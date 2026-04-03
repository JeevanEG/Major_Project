from agents.base_agent import BaseAgent
from orchestrator.state import GraphState
from services.ontology_service import OntologyService, RoleNotFoundError
from services.llm_service import LLMService
from langchain_core.messages import HumanMessage
from pydantic import BaseModel, Field
from typing import Dict


class RoleSkillMapping(BaseModel):
    role_name: str = Field(..., description="The name of the job role")
    skills: Dict[str, int] = Field(..., description="Map of skill names to proficiency levels (1-5)")


class EnterpriseSkillAgent(BaseAgent):

    def __init__(self):
        self.ontology_service = OntologyService()
        self.llm_service = LLMService()

    def run(self, state: GraphState) -> GraphState:
        current_role = state.user_input.current_role
        target_role = state.user_input.target_role

        # Try ontology first
        try:
            current_role_skills = self.ontology_service.get_role_skills(current_role)
        except (RoleNotFoundError, FileNotFoundError):
            current_role_skills = self._generate_skills_with_llm(current_role)

        try:
            target_role_skills = self.ontology_service.get_role_skills(target_role)
        except (RoleNotFoundError, FileNotFoundError):
            target_role_skills = self._generate_skills_with_llm(target_role)

        state.enterprise_skill_map = {
            "current_role": current_role,
            "target_role": target_role,
            "current_role_skills": current_role_skills,
            "target_role_skills": target_role_skills,
            "source": "hybrid_ontology_llm"
        }

        state.current_step = "enterprise_skill_mapping_completed"
        return state

    def _generate_skills_with_llm(self, role_name: str) -> Dict[str, int]:
        """Fallback: Predict required skills for a role using LLM."""
        prompt = f"""
        You are a strategic workforce planning expert. 
        Identify the top 7 essential technical and soft skills required for the role: '{role_name}'.

        For each skill, assign a standard industry proficiency level from 1 to 5:
        1: Awareness
        2: Novice
        3: Proficient
        4: Advanced
        5: Expert

        CRITICAL: Return ONLY valid JSON. 
        Do NOT wrap the JSON in markdown code blocks.
        """

        try:
            response = self.llm_service.generate_structured(
                [HumanMessage(content=prompt)],
                RoleSkillMapping
            )
            return response.skills
        except Exception as e:
            # Absolute fallback if LLM fails
            return {"General Professional Skills": 3, "Communication": 3, "Problem Solving": 3}