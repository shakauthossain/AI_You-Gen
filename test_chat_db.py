#!/usr/bin/env python3
"""
Test script to verify chat history functionality works end-to-end
"""

from app.db import SessionLocal
from app.models import ChatSession, ChatMessage
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_chat_operations():
    """Test creating sessions and messages"""
    db = SessionLocal()
    
    try:
        # Test creating a session
        test_user_id = "test_user_12345"
        
        logger.info("Creating test chat session...")
        session = ChatSession(
            user_id=test_user_id,
            title="Test Session",
            video_url="https://youtube.com/watch?v=test123",
            video_title="Test Video"
        )
        
        db.add(session)
        db.commit()
        db.refresh(session)
        logger.info(f"✅ Created session with ID: {session.id}")
        
        # Test creating a message
        logger.info("Creating test chat message...")
        message = ChatMessage(
            session_id=session.id,
            user_id=test_user_id,
            role="user",
            message="This is a test message",
            video_context="https://youtube.com/watch?v=test123"
        )
        
        db.add(message)
        db.commit()
        db.refresh(message)
        logger.info(f"✅ Created message with ID: {message.id}")
        
        # Test retrieving sessions
        logger.info("Retrieving sessions for user...")
        sessions = db.query(ChatSession).filter_by(user_id=test_user_id).all()
        logger.info(f"✅ Found {len(sessions)} sessions for user")
        
        # Test retrieving messages
        logger.info("Retrieving messages for session...")
        messages = db.query(ChatMessage).filter_by(session_id=session.id).all()
        logger.info(f"✅ Found {len(messages)} messages for session")
        
        # Clean up test data
        logger.info("Cleaning up test data...")
        db.delete(message)
        db.delete(session)
        db.commit()
        logger.info("✅ Cleanup completed")
        
        logger.info("🎉 All database operations working correctly!")
        
    except Exception as e:
        logger.error(f"❌ Database test failed: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    test_chat_operations()