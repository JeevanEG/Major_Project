from agents.base_agent import BaseAgent
from orchestrator.state import GraphState
from pydantic import BaseModel, Field, ValidationError
from typing import List, Optional
from services.llm_service import LLMService
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.exceptions import OutputParserException
from prompts.assessment_prompts import ASSESSMENT_GENERATION_PROMPT, ASSESSMENT_EVALUATION_PROMPT

class QuizQuestion(BaseModel):
    question: str = Field(..., description="The multiple choice question")
    options: List[str] = Field(..., description="4 options labeled A, B, C, D")
    correct_option: str = Field(..., description="The correct option letter (A, B, C, or D)")
    explanation: str = Field(..., description="Brief explanation of the correct answer")

class AssessmentQuestion(BaseModel):
    type: str = Field(..., description="Type of question: single_choice, multiple_choice, fill_blank, code_fix")
    question: str = Field(..., description="The assessment question text")
    code_snippet: str = Field(default="", description="The code snippet with numbered lines.")
    options: List[str] = Field(default=[], description="List of possible answers for choice questions")
    correct_answer: str = Field(..., description="The correct answer. For code_fix questions, this MUST be just the line number (e.g., '4').")
    wrong_explanation: str = Field(default="", description="Explanation why common mistakes are incorrect")
    correct_explanation: str = Field(default="", description="Explanation why the answer is the industry standard")

class AssessmentResponse(BaseModel):
    questions: List[AssessmentQuestion] = Field(..., description="List of assessment questions")

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

    def generate_assessment(self, module_name: str, topics: List[str], batch_number: int) -> List[AssessmentQuestion]:
        batch_info = "If batch 1, start with fundamental concepts. If batch 2, focus on expert architectural scenarios."
        
        parser = PydanticOutputParser(pydantic_object=AssessmentResponse)
        format_instructions = parser.get_format_instructions()

        system_prompt = (
            f"Act as a Senior Lead Engineer. Generate a minimum of 10 questions and a maximum of 15 questions based on the density and complexity of the provided topics. Ensure thorough coverage without unnecessary repetition for the module: {module_name}. "
            f"Topics: {topics}. This is batch number {batch_number}. "
            f"Instructions: 1. {batch_info} 2. Use real-world production scenarios. 3. Output only valid JSON based on the schema. "
            "\nCRITICAL JSON INSTRUCTIONS: You MUST generate a completely valid, fully populated JSON response. "
            "Every single question object in the array MUST contain ALL of these keys: 'type', 'question', 'code_snippet', 'options' (use an empty array if not applicable), 'correct_answer', 'wrong_explanation', and 'correct_explanation'. "
            "CRITICAL: You MUST include the code_snippet field in the JSON for EVERY question. If there is no code, use an empty string. If it is a code_fix type, the field MUST contain the numbered code. "
            "Do NOT truncate your response. If you use code snippets in the question or code_snippet field, you must properly escape newlines as \\n. "
            "CRITICAL: Do NOT use markdown code blocks (```python) or double newlines inside the JSON string values. Use single \\n for line breaks to prevent parsing errors. "
            "\nFor 'code_fix' questions, you MUST format the 'code_snippet' field with explicit line numbers (e.g., '1: def my_func():\\n2:     return x'). "
            "The 'question' field must simply ask 'Which line number contains the error'. "
            "The 'correct_answer' must be JUST the integer line number as a string (e.g., '2')."
            "\nSTRICT RULES FOR CODE FIX: NEVER generate a 'code_fix' question where the original code is functionally correct. "
            "Only use 'code_fix' if there is a syntax error, a NameError, or a clear logical bug (e.g., an off-by-one error in a loop). "
            "For all questions, the 'correct_answer' must be the objective truth. Do not penalize the user for valid alternative solutions. "
            "If a code snippet is provided, it must be unambiguous."
            f"\n\n{format_instructions}"
        )
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"Generate advanced questions for {module_name} batch {batch_number}")
        ]
        
        for attempt in range(3):
            try:
                # Using with_structured_output as migrated from main.py logic
                structured_llm = self.llm_service.provider.llm.with_structured_output(AssessmentResponse)
                response = structured_llm.invoke(messages)
                return response.questions
            except (ValidationError, OutputParserException, Exception) as e:
                print(f"Assessment generation attempt {attempt + 1} failed: {e}")
                if attempt == 2:
                    # Final fallback attempt using generate_structured
                    try:
                        response = self.llm_service.generate_structured(messages, AssessmentResponse)
                        return response.questions
                    except Exception as final_e:
                        print(f"Final fallback failed: {final_e}")
                        raise final_e

    def run(self, state: GraphState) -> GraphState:
        # This run method can be used if we integrate it into the LangGraph flow later
        # For now, we'll call specific methods via API
        return state
