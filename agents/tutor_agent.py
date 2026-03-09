from agents.base_agent import BaseAgent
from orchestrator.state import GraphState
from services.llm_service import LLMService
from services.knowledge_service import KnowledgeService
from langchain_core.messages import HumanMessage


class TutorAgent(BaseAgent):

    def __init__(self):
        self.llm_service = LLMService()
        self.knowledge_service = KnowledgeService()

    def run(self, state: GraphState) -> GraphState:

        curriculum = state.curriculum_plan["learning_stages"]

        # Select first stage and first skill for now
        stage = curriculum[0]
        skill_data = stage["skills"][0]

        skill = skill_data["skill"]
        topic = skill_data["topics"][0]

        # Retrieve knowledge using CRAG
        result = self.knowledge_service.retrieve_with_crag(topic)

        mode = result["mode"]
        context = result["context"]
        sources = result["sources"]

        if mode == "rag":

            prompt = f"""
        You are an enterprise AI tutor.

        Use the following textbook knowledge to teach the topic.

        Topic:
        {topic}

        Context:
        {context}

        Instructions:
        - Provide a clear explanation
        - Give a real-world example
        - Provide one short practice question
        """

        else:

            prompt = f"""
        You are an enterprise AI tutor.

        Explain the following topic clearly.

        Topic:
        {topic}

        Instructions:
        - Provide a clear explanation
        - Give a real-world example
        - Provide one short practice question
        """

        response = self.llm_service.generate(
            [HumanMessage(content=prompt)]
        )

        state.tutor_session = {
            "skill": skill,
            "topic": topic,
            "content": response.content
        }

        # Store book sources used in RAG
        state.knowledge_sources = sources

        state.current_step = "tutoring_session_generated"

        return state