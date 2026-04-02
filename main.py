import bcrypt

# Monkey-patch bcrypt before passlib imports it
if getattr(bcrypt, "__about__", None) is None:
    bcrypt.__about__ = type("About", (object,), {"__version__": bcrypt.__version__})

import json
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel
from typing import Optional, List, Any

from orchestrator.state import UserInput, GraphState
from memory.session_store import SessionStore
from memory.learner_store import LearnerStore
from agents.tutor_agent import TutorAgent
from agents.assessment_agent import AssessmentAgent
from orchestrator.controller import run_graph
from api.routes import router as auth_router

app = FastAPI(title="Autonomous AI Tutor API")

# Register Authentication Routes
app.include_router(auth_router)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": exc.body},
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Autonomous AI Tutor API", "docs": "/docs"}

@app.post("/run")
def run(user_input: UserInput):
    store = SessionStore()
    store.save_history("default_session", []) 
    result = run_graph(user_input)
    result_dict = jsonable_encoder(result)
    result_dict["session_id"] = "default_session"
    return result_dict

class ChatMessage(BaseModel):
    state: GraphState
    message: str

@app.post("/chat")
def chat(chat_input: ChatMessage):
    state = chat_input.state
    session_id = state.session_id or "default_session"
    store = SessionStore()
    history = store.get_history(session_id)
    history.append({"role": "user", "content": chat_input.message})
    store.save_history(session_id, history)
    state.chat_history = history
    agent = TutorAgent()
    result = agent.run(state)
    return jsonable_encoder(result)

@app.post("/next-topic")
def next_topic(state: GraphState):
    state.current_topic_index += 1
    state.active_quiz = None
    agent = TutorAgent()
    result = agent.run(state)
    return jsonable_encoder(result)

@app.post("/generate-quiz")
def generate_quiz(state: GraphState):
    agent = AssessmentAgent()
    topic = state.tutor_session.get("topic", "General")
    content = state.tutor_session.get("content", "")
    
    quiz = agent.generate_quiz(topic, content)
    state.active_quiz = jsonable_encoder(quiz)
    
    return jsonable_encoder(state)

class QuizSubmission(BaseModel):
    state: GraphState
    answer: str

@app.post("/submit-answer")
def submit_answer(submission: QuizSubmission):
    state = submission.state
    agent = AssessmentAgent()
    
    if not state.active_quiz:
        raise HTTPException(status_code=400, detail="No active quiz found")
        
    result = agent.evaluate_answer(
        question=state.active_quiz["question"],
        correct_answer=state.active_quiz["correct_option"],
        user_answer=submission.answer
    )
    
    session_id = state.session_id or "default_session"
    store = SessionStore()
    history = store.get_history(session_id)
    
    history.append({"role": "user", "content": f"My answer: {submission.answer}"})
    history.append({"role": "assistant", "content": result["feedback"]})
    store.save_history(session_id, history)
    
    state.chat_history = history
    
    if result["is_correct"]:
        topic = state.tutor_session.get("topic")
        if topic not in state.completed_topics:
            state.completed_topics.append(topic)
        state.active_quiz = None
        
    return {
        "state": jsonable_encoder(state),
        "is_correct": result["is_correct"]
    }
