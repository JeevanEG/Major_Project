import bcrypt

# Monkey-patch bcrypt before passlib imports it
if getattr(bcrypt, "__about__", None) is None:
    bcrypt.__about__ = type("About", (object,), {"__version__": bcrypt.__version__})

import json
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static Files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Register Authentication Routes
app.include_router(auth_router)

from utils.auth_helper import get_current_user
from database import UserModel

@app.get("/api/me")
def get_me(current_user: UserModel = Depends(get_current_user)):
    return {"id": current_user.id, "username": current_user.username}

@app.get("/api/roadmap")
def get_roadmap(current_user: UserModel = Depends(get_current_user)):
    # Use LearnerStore to get roadmap (which is effectively the state in this system)
    store = LearnerStore()
    learner_data = store.get_learner(current_user.username)
    if not learner_data:
        return JSONResponse(status_code=404, content={"detail": "No roadmap found"})
    
    # In this project, the roadmap is part of the overall GraphState.
    # For simplicity, we might return the last state stored or just learner_data.
    # Looking at the codebase, it seems we might need a way to persist GraphState fully.
    # For Phase 1, we will return the learner_data as the roadmap source.
    return learner_data

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": exc.body},
    )

@app.get("/")
def read_root():
    return FileResponse("templates/index.html")

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

class ChatRequest(BaseModel):
    message: str
    context: str
    history: List[dict[str, str]]

@app.post("/api/chat")
def api_chat(request: ChatRequest):
    from services.llm_service import LLMService
    from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
    
    llm = LLMService()
    
    system_prompt = f"You are an expert, encouraging AI Tutor. The user is currently studying the topic: {request.context}. Answer their questions clearly and concisely. If they ask something unrelated to programming or the current topic, gently guide them back to the subject."
    
    messages = [SystemMessage(content=system_prompt)]
    
    # Add history
    for msg in request.history:
        if msg["role"] == "user":
            messages.append(HumanMessage(content=msg["content"]))
        elif msg["role"] == "assistant":
            messages.append(AIMessage(content=msg["content"]))
            
    # Add current message
    messages.append(HumanMessage(content=request.message))
    
    response = llm.generate(messages)
    return {"reply": response.content}

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
    topic = state.tutor_session.get("topic", "General") if state.tutor_session else "General"
    content = state.tutor_session.get("content", "") if state.tutor_session else ""
    
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
        topic = state.tutor_session.get("topic") if state.tutor_session else None
        if topic:
            if state.completed_topics is None:
                state.completed_topics = []
            if topic not in state.completed_topics:
                state.completed_topics.append(topic)
        state.active_quiz = None
        
    return {
        "state": jsonable_encoder(state),
        "is_correct": result["is_correct"]
    }
