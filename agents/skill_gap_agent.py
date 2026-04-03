from agents.base_agent import BaseAgent
from orchestrator.state import GraphState
from services.llm_service import LLMService
from langchain_core.messages import HumanMessage
from pydantic import BaseModel, Field
from typing import List, Dict, Any


class SkillGapItem(BaseModel):
    skill: str
    current_level: int
    target_level: int
    gap: int
    priority: str


class SkillGapResponse(BaseModel):
    skills: List[SkillGapItem]


class SkillGapAgent(BaseAgent):

    def __init__(self):
        self.llm_service = LLMService()

    def run(self, state: GraphState) -> GraphState:
        enterprise_map = state.enterprise_skill_map or {}
        
        # Ensure we have skill dictionaries even if empty
        current_skills = enterprise_map.get("current_role_skills", {})
        target_skills = enterprise_map.get("target_role_skills", {})

        gap_results = []
        total_gap_score = 0

        for skill, target_level in target_skills.items():
            current_level = current_skills.get(skill, 0)
            gap = max(target_level - current_level, 0)
            priority = self._assign_priority(gap)

            if gap > 0:
                gap_results.append({
                    "skill": skill,
                    "current_level": current_level,
                    "target_level": target_level,
                    "gap": gap,
                    "priority": priority
                })
            total_gap_score += gap

        # FALLBACK: If no gap is found, trigger the LLM to dynamically generate missing skills
        if not gap_results:
            gap_results = self._generate_missing_skills_with_llm(
                state.user_input.current_role,
                state.user_input.target_role
            )
            total_gap_score = sum(item["gap"] for item in gap_results)

        state.skill_gap = {
            "total_gap_score": total_gap_score,
            "skills": sorted(
                gap_results,
                key=lambda x: x["gap"],
                reverse=True
            )
        }

        state.current_step = "skill_gap_analysis_completed"
        return state

    def _generate_missing_skills_with_llm(self, current_role: str, target_role: str) -> List[Dict[str, Any]]:
        """Fallback: Generate at least 5 missing skills to bridge current_role and target_role."""
        prompt = f"""
        Analyze the career transition from '{current_role}' to '{target_role}'.
        Identify exactly 5-7 essential technical or domain-specific skills that a person transitioning would lack.
        
        For each skill, provide:
        - skill: Name of the skill
        - current_level: 1 (Awareness)
        - target_level: 3 (Proficient) or 4 (Advanced)
        - gap: target_level - current_level
        - priority: "high" if gap >= 3, else "medium"

        CRITICAL: Return ONLY valid JSON.
        """

        try:
            response = self.llm_service.generate_structured(
                [HumanMessage(content=prompt)],
                SkillGapResponse
            )
            return [item.model_dump() for item in response.skills]
        except Exception:
            # Absolute fallback
            return [
                {"skill": "Fundamental Industry Tools", "current_level": 1, "target_level": 3, "gap": 2, "priority": "medium"},
                {"skill": "Advanced Workflow Techniques", "current_level": 1, "target_level": 4, "gap": 3, "priority": "high"},
                {"skill": "Professional Domain Knowledge", "current_level": 1, "target_level": 3, "gap": 2, "priority": "medium"},
                {"skill": "Strategic Planning", "current_level": 1, "target_level": 3, "gap": 2, "priority": "medium"},
                {"skill": "Specialized Software Proficiency", "current_level": 1, "target_level": 4, "gap": 3, "priority": "high"},
            ]

    def _assign_priority(self, gap: int) -> str:
        if gap == 0:
            return "none"
        elif gap == 1:
            return "low"
        elif gap == 2:
            return "medium"
        else:
            return "high"
