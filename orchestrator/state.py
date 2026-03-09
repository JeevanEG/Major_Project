from pydantic import BaseModel, Field
from typing import Optional, Dict, Any


class UserInput(BaseModel):
    current_role: str = Field(..., description="User's current job role")
    experience_years: float = Field(..., ge=0)
    target_role: str = Field(..., description="Desired target role")
    learning_goal: Optional[str] = Field(None, description="Optional learning objective")
    

class GraphState(BaseModel):
    # ===== User Input =====
    user_input: UserInput

    # ===== Agent Outputs =====
    learner_profile: Optional[Dict[str, Any]] = None
    enterprise_skill_map: Optional[Dict[str, Any]] = None
    skill_gap: Optional[Dict[str, Any]] = None
    curriculum_plan: Optional[Dict[str, Any]] = None
    tutoring_session: Optional[Dict[str, Any]] = None
    assessment_result: Optional[Dict[str, Any]] = None
    feedback_summary: Optional[Dict[str, Any]] = None
    tutor_session: Optional[Dict[str, Any]] = None
    knowledge_sources: Optional[Dict[str, Any]] = None
    # ===== Control Fields =====
    current_step: Optional[str] = None
    iteration_count: int = 0
    is_completed: bool = False
    