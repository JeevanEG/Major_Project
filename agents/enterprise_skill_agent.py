from agents.base_agent import BaseAgent
from orchestrator.state import GraphState
from services.ontology_service import OntologyService, RoleNotFoundError


class EnterpriseSkillAgent(BaseAgent):

    def __init__(self):
        self.ontology_service = OntologyService()

    def run(self, state: GraphState) -> GraphState:

        current_role = state.user_input.current_role
        target_role = state.user_input.target_role

        try:
            current_role_skills = self.ontology_service.get_role_skills(current_role)
            target_role_skills = self.ontology_service.get_role_skills(target_role)

        except RoleNotFoundError as e:
            state.enterprise_skill_map = {
                "error": str(e)
            }
            state.current_step = "enterprise_skill_error"
            return state

        state.enterprise_skill_map = {
            "current_role": current_role,
            "target_role": target_role,
            "current_role_skills": current_role_skills,
            "target_role_skills": target_role_skills
        }

        state.current_step = "enterprise_skill_mapping_completed"

        return state