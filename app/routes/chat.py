from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError, DisconnectionError
from app.db import SessionLocal
from app.models import ChatSession, ChatMessage
from app.auth import get_current_user
from typing import List, Optional
from datetime import datetime
import time
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Import cache functionality (with fallback if Redis not available)
try:
    from app.cache import ChatCache, cache_chat_sessions_task, cache_chat_messages_task
    CACHE_ENABLED = True
    logger.info("✅ Cache functionality enabled")
except ImportError as e:
    logger.warning(f"⚠️ Cache functionality disabled: {e}")
    CACHE_ENABLED = False
    
    # Fallback classes
    class ChatCache:
        @staticmethod
        def get_chat_sessions(user_id): return None
        @staticmethod
        def set_chat_sessions(user_id, sessions): return True
        @staticmethod
        def get_chat_messages(session_id): return None
        @staticmethod
        def set_chat_messages(session_id, messages): return True
        @staticmethod
        def add_message_to_cache(session_id, message): return True
        @staticmethod
        def invalidate_user_cache(user_id): pass
        @staticmethod
        def invalidate_session_cache(session_id): pass
    
    class MockTask:
        def delay(self, *args, **kwargs): pass
    
    cache_chat_sessions_task = MockTask()
    cache_chat_messages_task = MockTask()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def retry_db_operation(func, max_retries=3, delay=1):
    """Retry database operations with exponential backoff"""
    for attempt in range(max_retries):
        try:
            return func()
        except (OperationalError, DisconnectionError) as e:
            if attempt == max_retries - 1:
                logger.error(f"Database operation failed after {max_retries} attempts: {e}")
                raise HTTPException(status_code=503, detail="Database connection error. Please try again.")
            
            logger.warning(f"Database operation attempt {attempt + 1} failed: {e}. Retrying in {delay} seconds...")
            time.sleep(delay)
            delay *= 2  # Exponential backoff
        except Exception as e:
            logger.error(f"Non-retryable database error: {e}")
            raise


# POST /chat/sessions for frontend compatibility
@router.post("/sessions", response_model=dict)
def create_session(
    video_url: str = Body(None), 
    video_title: str = Body(None), 
    title: str = Body(None),
    user=Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    def _create_session_operation():
        # Create session with optional video context
        session_title = title or video_title or "Untitled Session"
        session = ChatSession(
            user_id=user["sub"], 
            title=session_title,
            video_url=video_url,
            video_title=video_title
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        
        # Invalidate user's sessions cache
        if CACHE_ENABLED:
            ChatCache.invalidate_user_cache(user["sub"])
            cache_chat_sessions_task.delay(user["sub"], "refresh")
        
        return {
            "session_id": session.id, 
            "created_at": session.created_at, 
            "title": session.title,
            "video_url": session.video_url,
            "video_title": session.video_title
        }
    return retry_db_operation(_create_session_operation)

@router.get("/sessions", response_model=List[dict])
def list_sessions(user=Depends(get_current_user), db: Session = Depends(get_db)):
    """Get user's chat sessions with caching"""
    user_id = user["sub"]
    
    # Try to get from cache first
    if CACHE_ENABLED:
        cached_sessions = ChatCache.get_chat_sessions(user_id)
        if cached_sessions:
            logger.info(f"📚 Returning cached sessions for user: {user_id}")
            return cached_sessions
    
    # If not in cache, get from database
    def _list_sessions_operation():
        sessions = db.query(ChatSession).filter_by(user_id=user_id).order_by(ChatSession.created_at.desc()).all()
        sessions_data = [{
            "session_id": s.id, 
            "created_at": s.created_at, 
            "title": s.title,
            "video_url": s.video_url,
            "video_title": s.video_title,
            "message_count": len(s.messages) if hasattr(s, 'messages') else 0
        } for s in sessions]
        
        # Cache the result
        if CACHE_ENABLED:
            ChatCache.set_chat_sessions(user_id, sessions_data)
            cache_chat_sessions_task.delay(user_id, "refresh")
        
        return sessions_data
    
    return retry_db_operation(_list_sessions_operation)

@router.post("/{session_id}/messages", response_model=dict)
def add_message(
    session_id: int, 
    message: str = Body(...),
    role: str = Body(...),
    video_context: str = Body(None),
    user=Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    def _add_message_operation():
        # Verify session belongs to user
        session = db.query(ChatSession).filter_by(id=session_id, user_id=user["sub"]).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        chat_message = ChatMessage(
            session_id=session_id,
            role=role,
            message=message,
            video_context=video_context
        )
        db.add(chat_message)
        db.commit()
        db.refresh(chat_message)
        
        # Update cache
        if CACHE_ENABLED:
            ChatCache.invalidate_session_cache(session_id)
            message_data = {
                "message_id": chat_message.id,
                "session_id": chat_message.session_id,
                "role": chat_message.role,
                "message": chat_message.message,
                "timestamp": chat_message.timestamp.isoformat() if chat_message.timestamp else None,
                "video_context": chat_message.video_context
            }
            ChatCache.add_message_to_cache(session_id, message_data)
            cache_chat_messages_task.delay(session_id)
        
        return {
            "message_id": chat_message.id,
            "timestamp": chat_message.timestamp,
            "role": chat_message.role,
            "message": chat_message.message
        }
    
    return retry_db_operation(_add_message_operation)

@router.get("/{session_id}/messages", response_model=List[dict])
def get_messages(session_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    """Get session messages with caching"""
    
    # Try to get from cache first
    if CACHE_ENABLED:
        cached_messages = ChatCache.get_chat_messages(session_id)
        if cached_messages:
            logger.info(f"💬 Returning cached messages for session: {session_id}")
            return cached_messages
    
    def _get_messages_operation():
        # Verify session belongs to user
        session = db.query(ChatSession).filter_by(id=session_id, user_id=user["sub"]).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        messages = db.query(ChatMessage).filter_by(session_id=session_id).order_by(ChatMessage.timestamp.asc()).all()
        messages_data = [{
            "message_id": m.id,
            "session_id": m.session_id,
            "role": m.role,
            "message": m.message,
            "timestamp": m.timestamp.isoformat() if m.timestamp else None,
            "video_context": m.video_context
        } for m in messages]
        
        # Cache the result
        if CACHE_ENABLED:
            ChatCache.set_chat_messages(session_id, messages_data)
            cache_chat_messages_task.delay(session_id)
        
        return messages_data
    
    return retry_db_operation(_get_messages_operation)

@router.delete("/{session_id}", response_model=dict)
def delete_session(session_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    def _delete_session_operation():
        # Verify session belongs to user
        session = db.query(ChatSession).filter_by(id=session_id, user_id=user["sub"]).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Delete messages first
        db.query(ChatMessage).filter_by(session_id=session_id).delete()
        
        # Delete session
        db.delete(session)
        db.commit()
        
        # Invalidate caches
        if CACHE_ENABLED:
            ChatCache.invalidate_session_cache(session_id)
            ChatCache.invalidate_user_cache(user["sub"])
        
        return {"message": "Session deleted successfully"}
    
    return retry_db_operation(_delete_session_operation)
    return [{"session_id": s.id, "created_at": s.created_at, "title": s.title} for s in sessions]

# GET /chat/sessions/{session_id}/messages for frontend compatibility
@router.get("/sessions/{session_id}/messages", response_model=List[dict])
def get_session_messages(session_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    session = db.query(ChatSession).filter_by(id=session_id, user_id=user["sub"]).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    messages = db.query(ChatMessage).filter_by(session_id=session_id).order_by(ChatMessage.timestamp).all()
    return [{"role": m.role, "message": m.message, "timestamp": m.timestamp} for m in messages]
