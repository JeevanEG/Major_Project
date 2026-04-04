import bcrypt

# Monkey-patch bcrypt before passlib imports it
if getattr(bcrypt, "__about__", None) is None:
    bcrypt.__about__ = type("About", (object,), {"__version__": bcrypt.__version__})

import json
import re
from fastapi import FastAPI, HTTPException, Depends, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel, Field
from typing import Optional, List, Any, Dict
from sqlalchemy.orm import Session

from orchestrator.state import UserInput, GraphState
from memory.session_store import SessionStore
from memory.learner_store import LearnerStore
from agents.tutor_agent import TutorAgent
from agents.assessment_agent import AssessmentAgent
from orchestrator.controller import run_graph
from api.routes import router as auth_router
from database import UserModel, get_db
from utils.auth_helper import get_current_user

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

@app.get("/api/me")
def get_me(current_user: UserModel = Depends(get_current_user)):
    return {
        "id": current_user.id, 
        "username": current_user.username,
        "current_role": current_user.current_role,
        "target_role": current_user.target_role,
        "progress_data": current_user.get_progress()
    }

@app.get("/api/roadmap")
def get_roadmap(current_user: UserModel = Depends(get_current_user)):
    if current_user.roadmap_json:
        return json.loads(current_user.roadmap_json)
    
    # Fallback to store if DB is empty but store has it
    store = LearnerStore()
    learner_data = store.get_learner(current_user.username)
    if not learner_data:
        return JSONResponse(status_code=404, content={"detail": "No roadmap found"})
    return learner_data

@app.post("/api/user/reset")
def reset_user(current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.current_role = None
    current_user.target_role = None
    current_user.roadmap_json = None
    current_user.progress_data = '{"completed_modules": [], "current_topic_index": 0, "bookmarks": {}}'
    db.commit()
    return {"message": "User data reset successfully"}

class AssessmentSubmission(BaseModel):
    skill_name: str
    topics: List[str]
    score: float
    feedback: Optional[str] = None

@app.post("/api/assessment/submit")
def submit_assessment(submission: AssessmentSubmission, current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    progress = current_user.get_progress()
    
    if submission.score >= 70:
        if submission.skill_name not in progress["completed_modules"]:
            progress["completed_modules"].append(submission.skill_name)
            
            # Store feedback in progress for future lesson adaptation if provided
            if submission.feedback:
                if "feedback" not in progress:
                    progress["feedback"] = {}
                progress["feedback"][submission.skill_name] = submission.feedback
                
            current_user.set_progress(progress)
            db.commit()
            return {"status": "success", "message": "Module completed", "progress": progress}
    
    return {"status": "failure", "message": "Score too low or module already completed", "progress": progress}

class TopicProgressRequest(BaseModel):
    skill_name: str
    topic_index: int

@app.post("/api/progress/topic")
def sync_topic_progress(request: TopicProgressRequest, current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    progress = current_user.get_progress()
    if "bookmarks" not in progress:
        progress["bookmarks"] = {}
    
    progress["bookmarks"][request.skill_name] = request.topic_index
    current_user.set_progress(progress)
    db.commit()
    return {"status": "success", "progress": progress}

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
def run(user_input: UserInput, current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    store = SessionStore()
    store.save_history(f"{current_user.username}_session", []) 
    
    result = run_graph(user_input)
    result_dict = jsonable_encoder(result)
    result_dict["session_id"] = f"{current_user.username}_session"
    
    # Persist to database
    current_user.current_role = user_input.current_role
    current_user.target_role = user_input.target_role
    current_user.roadmap_json = json.dumps(result_dict)
    db.commit()
    
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
    history: List[Dict[str, str]]

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

class LessonRequest(BaseModel):
    skill_name: str
    topic_name: str
    user_feedback: Optional[str] = None

@app.post("/api/generate-lesson")
def generate_lesson(request: LessonRequest):
    try:
        agent = TutorAgent()
        content = agent.generate_lesson(
            skill_name=request.skill_name,
            topic_name=request.topic_name,
            user_feedback=request.user_feedback
        )
        return {"content": content}
    except Exception as e:
        print(f"Error generating lesson: {e}")
        return {"content": "The AI Teacher is taking a short break. Please click Previous and then Next to try again."}

class AssessmentRequestPayload(BaseModel):
    skill_name: str
    topics: List[str]
    batch_number: int

@app.post("/api/generate-assessment")
def generate_assessment(request: AssessmentRequestPayload):
    agent = AssessmentAgent()
    return agent.generate_assessment(
        module_name=request.skill_name,
        topics=request.topics,
        batch_number=request.batch_number
    )

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
