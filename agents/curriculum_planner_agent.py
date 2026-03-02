from agents.base_agent import BaseAgent
from orchestrator.state import GraphState
from pydantic import BaseModel
from typing import List
from services.llm_service import LLMService
from langchain_core.messages import HumanMessage
class SkillCurriculumOutput(BaseModel):
    topics: List[str]
    learning_outcomes: List[str]

class CurriculumPlannerAgent(BaseAgent):
    def __init__(self):
        self.llm_service = LLMService()
    def run(self, state: GraphState) -> GraphState:

        skill_gap = state.skill_gap

        if "error" in skill_gap:
            state.curriculum_plan = {"error": "Cannot generate curriculum due to gap error"}
            state.current_step = "curriculum_error"
            return state

        stages = {
            "high": [],
            "medium": [],
            "low": []
        }

        total_weeks = 0

        for skill_data in skill_gap["skills"]:
            priority = skill_data["priority"]
            gap = skill_data["gap"]

            experience_level = state.learner_profile["experience_level_category"]
            intensity = state.learner_profile["llm_inferred_profile"]["recommended_learning_intensity"]

            estimated_weeks = self._estimate_weeks(
                gap,
                experience_level,
                intensity
            )   

            skill_name = skill_data["skill"]
            target_level = skill_data["target_level"]

            content = self._generate_skill_content(skill_name, target_level)

            stages[priority].append({
                "skill": skill_name,
                "estimated_weeks": estimated_weeks,
                "topics": content["topics"],
                "learning_outcomes": content["learning_outcomes"]
            })
            total_weeks += estimated_weeks

        structured_stages = []
        stage_number = 1

        for priority in ["high", "medium", "low"]:
            if stages[priority]:
                structured_stages.append({
                    "stage": stage_number,
                    "focus_priority": priority,
                    "skills": stages[priority]
                })
                stage_number += 1

        state.curriculum_plan = {
            "learning_stages": structured_stages,
            "total_estimated_duration_weeks": total_weeks
        }

        state.current_step = "curriculum_planning_completed"

        return state
    def _estimate_weeks(self, gap: int, experience_level: str, intensity: str) -> int:

        base_mapping = {
            1: 1,
            2: 2,
            3: 3,
            4: 4
        }

        base = base_mapping.get(gap, 4)

        experience_adjustment = {
            "junior": 1,
            "mid": 0,
            "senior": -1
        }.get(experience_level, 0)

        intensity_adjustment = {
            "low": 1,
            "medium": 0,
            "high": -1
        }.get(intensity, 0)

        estimated = base + experience_adjustment + intensity_adjustment

        return max(1, estimated)
    def _generate_skill_content(self, skill: str, target_level: int) -> dict:

        prompt = f"""
        You are an enterprise curriculum designer.

        Generate structured learning content for the skill: {skill}
        Target proficiency level: {target_level}

        Provide:
        - 4 to 6 core topics
        - 4 measurable learning outcomes

        Focus on practical enterprise relevance.
        """

        response = self.llm_service.generate_structured(
            [HumanMessage(content=prompt)],
            SkillCurriculumOutput
        )

        return response.model_dump()