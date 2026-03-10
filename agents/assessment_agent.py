from agents.base_agent import BaseAgent
from orchestrator.state import GraphState
from pydantic import BaseModel, Field
from typing import List, Optional
from services.llm_service import LLMService
from langchain_core.messages import HumanMessage
from prompts.assessment_prompts import ASSESSMENT_GENERATION_PROMPT, ASSESSMENT_EVALUATION_PROMPT

class QuizQuestion(BaseModel):
    question: str = Field(..., description="The multiple choice question")
    options: List[str] = Field(..., description="4 options labeled A, B, C, D")
    correct_option: str = Field(..., description="The correct option letter (A, B, C, or D)")
    explanation: str = Field(..., description="Brief explanation of the correct answer")

class AssessmentAgent(BaseAgent):
    def __init__(self):
        self.llm_service = LLMService()

    def generate_quiz(self, topic: str, content: str) -> QuizQuestion:
        prompt = ASSESSMENT_GENERATION_PROMPT.format(topic=topic, content=content)
        response = self.llm_service.generate_structured(
            [HumanMessage(content=prompt)],
            QuizQuestion
        )
        return response

    def evaluate_answer(self, question: str, correct_answer: str, user_answer: str) -> dict:
        prompt = ASSESSMENT_EVALUATION_PROMPT.format(
            question=question,
            correct_answer=correct_answer,
            user_answer=user_answer
        )
        response = self.llm_service.generate([HumanMessage(content=prompt)])
        
        is_correct = user_answer.strip().upper() == correct_answer.strip().upper()
        
        return {
            "is_correct": is_correct,
            "feedback": response.content
        }

    def run(self, state: GraphState) -> GraphState:
        # This run method can be used if we integrate it into the LangGraph flow later
        # For now, we'll call specific methods via API
        return state
