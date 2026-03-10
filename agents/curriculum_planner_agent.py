from agents.base_agent import BaseAgent
from orchestrator.state import GraphState
from pydantic import BaseModel, Field
from typing import List, Dict
from services.llm_service import LLMService
from langchain_core.messages import HumanMessage

class SkillContent(BaseModel):
    skill_name: str = Field(..., description="Name of the skill")
    topics: List[str] = Field(..., description="4 to 6 core topics")
    learning_outcomes: List[str] = Field(..., description="4 measurable learning outcomes")

class FullCurriculumOutput(BaseModel):
    skills_content: List[SkillContent]

class CurriculumPlannerAgent(BaseAgent):
    def __init__(self):
        self.llm_service = LLMService()

    def run(self, state: GraphState) -> GraphState:
        skill_gap = state.skill_gap

        if not skill_gap or "skills" not in skill_gap or not skill_gap["skills"]:
            state.curriculum_plan = {"error": "No skills identified for curriculum"}
            state.current_step = "curriculum_error"
            return state

        # 1. Group skills by priority and calculate weeks
        experience_level = state.learner_profile["experience_level_category"]
        intensity = state.learner_profile["llm_inferred_profile"]["recommended_learning_intensity"]
        
        skills_to_generate = []
        for skill_data in skill_gap["skills"]:
            skills_to_generate.append({
                "name": skill_data["skill"],
                "target_level": skill_data["target_level"],
                "priority": skill_data["priority"],
                "gap": skill_data["gap"]
            })

        # 2. Generate content for ALL skills in one batch
        all_content = self._generate_batch_content(skills_to_generate)
        content_map = {c.skill_name: c for c in all_content.skills_content}

        # 3. Structure the stages
        stages = {"high": [], "medium": [], "low": []}
        total_weeks = 0

        for s in skills_to_generate:
            name = s["name"]
            priority = s["priority"]
            
            est_weeks = self._estimate_weeks(s["gap"], experience_level, intensity)
            total_weeks += est_weeks
            
            content = content_map.get(name)
            
            stages[priority].append({
                "skill": name,
                "estimated_weeks": est_weeks,
                "topics": content.topics if content else ["General concepts", "Best practices"],
                "learning_outcomes": content.learning_outcomes if content else ["Understand core principles"]
            })

        structured_stages = []
        stage_num = 1
        for p in ["high", "medium", "low"]:
            if stages[p]:
                structured_stages.append({
                    "stage": stage_num,
                    "focus_priority": p,
                    "skills": stages[p]
                })
                stage_num += 1

        state.curriculum_plan = {
            "learning_stages": structured_stages,
            "total_estimated_duration_weeks": total_weeks
        }
        state.current_step = "curriculum_planning_completed"
        return state

    def _generate_batch_content(self, skills: List[Dict]) -> FullCurriculumOutput:
        skill_list_str = "\n".join([f"- {s['name']} (Target Level: {s['target_level']})" for s in skills])
        
        prompt = f"""
        You are an enterprise curriculum designer.
        
        Generate structured learning content for the following list of skills:
        {skill_list_str}
        
        For EACH skill, provide:
        - 4 to 6 core topics
        - 4 measurable learning outcomes
        
        Ensure the content is tailored to the target proficiency levels provided.
        Focus on practical enterprise relevance.
        """

        response = self.llm_service.generate_structured(
            [HumanMessage(content=prompt)],
            FullCurriculumOutput
        )
        return response

    def _estimate_weeks(self, gap: int, experience_level: str, intensity: str) -> int:
        base = {1: 1, 2: 2, 3: 3, 4: 4}.get(gap, 4)
        exp_adj = {"junior": 1, "mid": 0, "senior": -1}.get(experience_level, 0)
        int_adj = {"low": 1, "medium": 0, "high": -1}.get(intensity, 0)
        return max(1, base + exp_adj + int_adj)
