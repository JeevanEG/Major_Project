from orchestrator.controller import run_graph
from orchestrator.state import UserInput
import os
from dotenv import load_dotenv

load_dotenv()

user_input = UserInput(
    current_role="Java developer",
    experience_years=0,
    target_role="Web developer",
    learning_goal="Upscaling"
)

try:
    print("Running graph...")
    result = run_graph(user_input)
    print("Result:")
    print(result)
except Exception as e:
    print(f"Error caught: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
