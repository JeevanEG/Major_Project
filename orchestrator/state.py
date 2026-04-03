from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List


class UserInput(BaseModel):
    current_role: str = Field(..., description="User's current job role")
    experience_years: float = Field(..., ge=0)
    target_role: str = Field(..., description="Desired target role")
    learning_goal: Optional[str] = Field(None, description="Optional learning objective")
    

class GraphState(BaseModel):
    # ===== User Input =====
    user_input: Optional[UserInput] = None
    session_id: Optional[str] = "default_session"

    # ===== Agent Outputs =====
    learner_profile: Optional[Dict[str, Any]] = None
    enterprise_skill_map: Optional[Dict[str, Any]] = None
    skill_gap: Optional[Dict[str, Any]] = None
    curriculum_plan: Optional[Dict[str, Any]] = None
    assessment_result: Optional[Dict[str, Any]] = None
    feedback_summary: Optional[Dict[str, Any]] = None
    tutor_session: Optional[Dict[str, Any]] = None
    knowledge_sources: Optional[List[Any]] = None
    
    # ===== Progress Tracking =====
    current_module_index: int = Field(default=0)
    current_skill_index: int = Field(default=0)
    current_topic_index: int = Field(default=0)
    chat_history: List[Dict[str, str]] = Field(default_factory=list)
    completed_topics: List[str] = Field(default_factory=list)
    active_quiz: Optional[Dict[str, Any]] = Field(default=None)

    # ===== Control Fields =====
    current_step: Optional[str] = Field(default=None)
    iteration_count: int = Field(default=0)
    is_completed: bool = Field(default=False)
