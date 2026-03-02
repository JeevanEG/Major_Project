from orchestrator.graph import create_graph
from orchestrator.state import GraphState, UserInput


graph = create_graph()


def run_graph(user_input: UserInput):
    initial_state = GraphState(user_input=user_input)
    result = graph.invoke(initial_state)
    return result