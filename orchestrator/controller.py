from orchestrator.graph import create_graph
from orchestrator.state import GraphState, UserInput


graph = create_graph()


def run_graph(user_input: UserInput):
    # FIX: Provide full initial state with defaults to avoid Pydantic ValidationError
    initial_state = {
        "user_input": user_input.model_dump(),
        "session_id": "default_session",
        "current_module_index": 0,
        "current_skill_index": 0,
        "current_topic_index": 0,
        "chat_history": [],
        "completed_topics": [],
        "iteration_count": 0,
        "is_completed": False
    }
    
    result = graph.invoke(initial_state)
    return result
