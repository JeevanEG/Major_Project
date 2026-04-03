from agents.base_agent import BaseAgent
from orchestrator.state import GraphState
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from services.llm_service import LLMService
from langchain_core.messages import HumanMessage

class SkillContent(BaseModel):
    skill_name: str = Field(..., description="Name of the skill")
    stage_number: int = Field(..., description="The chronological stage/phase number (1, 2, or 3)")
    stage_label: str = Field(..., description="Label for the stage (e.g., 'Foundations', 'Core Specialization', 'Advanced Mastery')")
    topics: List[str] = Field(..., description="4 to 6 core topics")
    learning_outcomes: List[str] = Field(..., description="4 measurable learning outcomes")

class FullCurriculumOutput(BaseModel):
    skills_content: List[SkillContent]

class SkillGapItem(BaseModel):
    skill: str
    target_level: int
    gap: int
    priority: str

class SkillGapResponse(BaseModel):
    skills: List[SkillGapItem]

class CurriculumPlannerAgent(BaseAgent):
    def __init__(self):
        self.llm_service = LLMService()

    def run(self, state: GraphState) -> GraphState:
        skill_gap = state.skill_gap
        
        # 1. Ensure we have skills to generate a curriculum for
        if not skill_gap or "skills" not in skill_gap or not skill_gap["skills"]:
            skills_to_generate = self._generate_fallback_skills_with_llm(state)
        else:
            skills_to_generate = []
            for skill_data in skill_gap["skills"]:
                skills_to_generate.append({
                    "name": skill_data["skill"],
                    "target_level": skill_data.get("target_level", 3),
                    "priority": skill_data.get("priority", "medium"),
                    "gap": skill_data.get("gap", 2)
                })

        # 2. Get learner profile details for estimation
        learner_profile = state.learner_profile or {}
        experience_level = learner_profile.get("experience_level_category", "mid")
        inferred_profile = learner_profile.get("llm_inferred_profile", {})
        intensity = inferred_profile.get("recommended_learning_intensity", "medium")

        # 3. Generate content for ALL skills in one batch with pedagogical ordering
        try:
            all_content = self._generate_batch_content(skills_to_generate, state)
            # Sort content by stage number
            sorted_content = sorted(all_content.skills_content, key=lambda x: x.stage_number)
        except Exception:
            # Absolute fallback if LLM generation fails
            sorted_content = []

        # 4. Structure the stages based on LLM output
        stage_map = {}
        total_weeks = 0

        # Create a map for quick lookup of skill gap data
        gap_map = {s["name"]: s for s in skills_to_generate}

        for content in sorted_content:
            name = content.skill_name
            stage_num = content.stage_number
            stage_label = content.stage_label
            
            gap_data = gap_map.get(name, {"gap": 2, "priority": "medium"})
            est_weeks = self._estimate_weeks(gap_data["gap"], experience_level, intensity)
            total_weeks += est_weeks
            
            if stage_num not in stage_map:
                stage_map[stage_num] = {
                    "stage": stage_num,
                    "focus_priority": stage_label,
                    "skills": []
                }
            
            stage_map[stage_num]["skills"].append({
                "skill": name,
                "estimated_weeks": est_weeks,
                "topics": content.topics,
                "learning_outcomes": content.learning_outcomes
            })

        # If LLM failed to return any content, provide a minimal fallback
        if not stage_map:
            structured_stages = [{
                "stage": 1,
                "focus_priority": "Core Foundations",
                "skills": [{
                    "skill": s["name"],
                    "estimated_weeks": self._estimate_weeks(s["gap"], experience_level, intensity),
                    "topics": ["Fundamental concepts", "Industry best practices"],
                    "learning_outcomes": ["Understand core principles"]
                } for s in skills_to_generate[:3]]
            }]
            total_weeks = sum(s["estimated_weeks"] for s in structured_stages[0]["skills"])
        else:
            structured_stages = [stage_map[num] for num in sorted(stage_map.keys())]

        state.curriculum_plan = {
            "learning_stages": structured_stages,
            "total_estimated_duration_weeks": total_weeks
        }
        state.current_step = "curriculum_planning_completed"
        return state

    def _generate_fallback_skills_with_llm(self, state: GraphState) -> List[Dict]:
        """Generate a complete skill set for the target_role from scratch when gap is missing."""
        target_role = state.user_input.target_role if state.user_input else "Target Role"
        
        prompt = f"""
        Generate a set of 5-7 essential technical and domain-specific skills for someone aiming to become a '{target_role}'.
        
        For each skill, provide:
        - skill: Name of the skill
        - target_level: Required proficiency (3-5)
        - gap: Assumed learning gap (2-4)
        - priority: "high", "medium", or "low"
        
        CRITICAL: Return ONLY valid JSON.
        """
        
        try:
            response = self.llm_service.generate_structured(
                [HumanMessage(content=prompt)],
                SkillGapResponse
            )
            return [{"name": item.skill, "target_level": item.target_level, "gap": item.gap, "priority": item.priority} for item in response.skills]
        except Exception:
            return [
                {"name": f"{target_role} Core Fundamentals", "target_level": 3, "gap": 2, "priority": "high"},
                {"name": "Domain Workflows", "target_level": 4, "gap": 3, "priority": "high"},
                {"name": "Industry Tools", "target_level": 3, "gap": 2, "priority": "medium"},
                {"name": "Strategic Concepts", "target_level": 3, "gap": 2, "priority": "medium"},
                {"name": "Professional Standards", "target_level": 3, "gap": 2, "priority": "low"}
            ]

    def _generate_batch_content(self, skills: List[Dict], state: GraphState) -> FullCurriculumOutput:
        skill_list_str = "\n".join([f"- {s['name']}" for s in skills])
        current_role = state.user_input.current_role if state.user_input else "Unknown"
        target_role = state.user_input.target_role if state.user_input else "Unknown"

        prompt = f"""
        You are an expert career architect and pedagogical designer. 
        The user is currently a '{current_role}' transitioning to the role of '{target_role}'.
        
        Generate a comprehensive, chronologically-ordered learning curriculum for the following skills:
        {skill_list_str}
        
        For EACH skill, provide:
        - stage_number: (1, 2, or 3) representing the chronological phase.
        - stage_label: A descriptive label for that phase (e.g., 'Foundations', 'Specialization').
        - topics: 4 to 6 core topics.
        - learning_outcomes: 4 measurable outcomes.
        
        CRITICAL RULE: You MUST organize the learning_stages chronologically based on strict prerequisites. 
        Never place an advanced framework or tool in an earlier phase than its foundational language or concepts.
        Phase 1 MUST always contain the absolute basics required for the target role (e.g., HTML/CSS before React, Python basics before Machine Learning, Networking before Cloud Architecture).
        Do not sort phases solely by the size of the user's skill gap. Sort them by the logical, real-world order a human must learn them.

        CRITICAL: Every phase/stage MUST have a unique, highly descriptive title based on the specific skills being taught in that phase. Do NOT use generic or repeating titles like 'Career Polish & Mastery'.
        CRITICAL: Skills must be MUTUALLY EXCLUSIVE across phases. Once a skill is placed in an early phase (e.g., Phase 1), it MUST NOT be listed again in subsequent phases. Distribute the missing skills logically from foundational to advanced.
        Do not pad phases. If there are only 4 missing skills, it is perfectly fine to have a 2-phase roadmap. Do not stretch it to 3 phases just to fill space.

        CRITICAL: Return ONLY valid JSON.
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
