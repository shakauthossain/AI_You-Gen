from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.db import SessionLocal
from app.models import ChatSession, ChatMessage
from app.auth import get_current_user
from typing import List, Optional
from datetime import datetime

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# POST /chat/sessions for frontend compatibility
@router.post("/sessions", response_model=dict)
def create_session(user=Depends(get_current_user), db: Session = Depends(get_db)):
    session = ChatSession(user_id=user["sub"])
    db.add(session)
    db.commit()
    db.refresh(session)
    return {"session_id": session.id, "created_at": session.created_at, "title": session.title}

@router.get("/sessions", response_model=List[dict])
def list_sessions(user=Depends(get_current_user), db: Session = Depends(get_db)):
    sessions = db.query(ChatSession).filter_by(user_id=user["sub"]).order_by(ChatSession.created_at.desc()).all()
    return [{"session_id": s.id, "created_at": s.created_at, "title": s.title} for s in sessions]

@router.post("/message", response_model=dict)
def add_message(session_id: int = Body(...), message: str = Body(...), role: str = Body(...), user=Depends(get_current_user), db: Session = Depends(get_db)):
    session = db.query(ChatSession).filter_by(id=session_id, user_id=user["sub"]).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    msg = ChatMessage(session_id=session_id, user_id=user["sub"], message=message, role=role)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return {"message_id": msg.id, "timestamp": msg.timestamp}


# GET /chat/sessions/{session_id}/messages for frontend compatibility
@router.get("/sessions/{session_id}/messages", response_model=List[dict])
def get_session_messages(session_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    session = db.query(ChatSession).filter_by(id=session_id, user_id=user["sub"]).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    messages = db.query(ChatMessage).filter_by(session_id=session_id).order_by(ChatMessage.timestamp).all()
    return [{"role": m.role, "message": m.message, "timestamp": m.timestamp} for m in messages]
