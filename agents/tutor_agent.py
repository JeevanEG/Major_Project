from agents.base_agent import BaseAgent
from orchestrator.state import GraphState
from services.llm_service import LLMService
from services.knowledge_service import KnowledgeService
from memory.session_store import SessionStore
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage


class TutorAgent(BaseAgent):

    def __init__(self):
        self.llm_service = LLMService()
        self.knowledge_service = KnowledgeService()
        self.session_store = SessionStore()

    def run(self, state: GraphState) -> GraphState:
        # 1. Fetch current topic
        stages = state.curriculum_plan.get("learning_stages", [])
        if not stages:
            state.tutor_session = {"error": "No curriculum available"}
            return state

        mod_idx = state.current_module_index
        skill_idx = state.current_skill_index
        top_idx = state.current_topic_index

        if mod_idx >= len(stages):
            state.tutor_session = {"content": "Curriculum completed."}
            state.is_completed = True
            return state

        current_stage = stages[mod_idx]
        all_skills = current_stage.get("skills", [])
        
        if skill_idx >= len(all_skills):
            # Move to next module/stage
            state.current_module_index += 1
            state.current_skill_index = 0
            state.current_topic_index = 0
            return self.run(state)

        skill_data = all_skills[skill_idx]
        topics = skill_data.get("topics", [])
        
        if top_idx >= len(topics):
            # Move to next skill
            state.current_skill_index += 1
            state.current_topic_index = 0
            return self.run(state)

        topic = topics[top_idx]
        skill = skill_data["skill"]

        # 2. Retrieve RAG context
        result = self.knowledge_service.retrieve_with_crag(topic)
        context = result.get("context", "")

        # 3. Load history
        history_data = self.session_store.get_history(state.session_id or "default")
        
        # 4. Determine Mode: Q&A or Lesson?
        last_msg = history_data[-1] if history_data else None
        is_question = last_msg and last_msg["role"] == "user"

        messages = [SystemMessage(content=f"""
            You are an expert AI Tutor teaching '{skill}'. 
            Current Topic: {topic}
            Context: {context}
            
            Guidelines:
            - Use Markdown for formatting.
            - If the user asks a question, answer it directly using the context.
            - If it's a new lesson, explain the topic clearly with an example.
            - Keep responses educational and encouraging.
        """)]

        for h in history_data[-8:]:
            if h["role"] == "user":
                messages.append(HumanMessage(content=h["content"]))
            else:
                messages.append(AIMessage(content=h["content"]))

        if not is_question:
            messages.append(HumanMessage(content=f"Please deliver the lesson for the topic: {topic}"))

        # 5. Generate Response
        response = self.llm_service.generate(messages)

        # 6. Save & Update
        state.tutor_session = {
            "skill": skill,
            "topic": topic,
            "content": response.content
        }
        
        # Sync history
        history_data.append({"role": "assistant", "content": response.content, "topic": topic})
        self.session_store.save_history(state.session_id or "default", history_data)
        state.chat_history = history_data

        return state
