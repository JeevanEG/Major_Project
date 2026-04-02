from agents.base_agent import BaseAgent
from orchestrator.state import GraphState
from services.llm_service import LLMService
from langchain_core.messages import HumanMessage

class FeedbackAgent(BaseAgent):
    def __init__(self):
        self.llm_service = LLMService()

    def run(self, state: GraphState) -> GraphState:
        chat_history = state.chat_history
        if not chat_history:
            state.feedback_summary = {"summary": "No history to provide feedback on."}
            return state

        # Use the last few messages for feedback
        history_str = "\n".join([f"{m.get('role', 'user')}: {m.get('content', '')}" for m in chat_history[-10:]])
        
        prompt = f"""
        You are a supportive AI Mentor. Based on the following recent tutoring interaction, 
        summarize the learner's progress and identify areas for improvement or mastery.

        History:
        {history_str}
        
        Provide a concise, encouraging summary.
        """
        
        response = self.llm_service.generate([HumanMessage(content=prompt)])
        
        state.feedback_summary = {
            "summary": response.content,
            "sentiment": "positive"
        }
        state.current_step = "feedback_completed"
        return state
