from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Autonomous AI Tutor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok"}

from orchestrator.state import UserInput, GraphState

@app.get("/test-state")
def test_state():
    user_input = UserInput(
        current_role="Backend Developer",
        experience_years=2,
        target_role="AI Engineer"
    )

    state = GraphState(user_input=user_input)

    return state.dict()
from orchestrator.controller import run_graph
from orchestrator.state import UserInput


@app.post("/run")
def run(user_input: UserInput):
    result = run_graph(user_input)
    return result
from services.ontology_service import OntologyService

@app.get("/test-ontology")
def test_ontology():
    service = OntologyService()
    skills = service.get_role_skills("backend developer")
    return skills