import redis
import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from celery import Celery
from sqlalchemy.orm import Session
from app.models import ChatSession, ChatMessage
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Redis connection
redis_client = redis.Redis(
    host=getattr(settings, 'REDIS_HOST', 'localhost'),
    port=getattr(settings, 'REDIS_PORT', 6379),
    db=getattr(settings, 'REDIS_DB', 0),
    decode_responses=True
)

# Celery app configuration
celery_app = Celery(
    'youtube_extractor',
    broker=f"redis://{getattr(settings, 'REDIS_HOST', 'localhost')}:{getattr(settings, 'REDIS_PORT', 6379)}/0",
    backend=f"redis://{getattr(settings, 'REDIS_HOST', 'localhost')}:{getattr(settings, 'REDIS_PORT', 6379)}/0"
)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    result_expires=3600,  # Results expire after 1 hour
)

# Cache keys
CHAT_SESSIONS_KEY = "chat_sessions:{user_id}"
CHAT_MESSAGES_KEY = "chat_messages:{session_id}"
VIDEO_CACHE_KEY = "video_cache:{video_url}"
USER_CACHE_KEY = "user_cache:{user_id}"

# Cache expiration times (in seconds)
CHAT_SESSION_EXPIRE = 86400  # 24 hours
CHAT_MESSAGES_EXPIRE = 3600  # 1 hour
VIDEO_CACHE_EXPIRE = 7200   # 2 hours
USER_CACHE_EXPIRE = 1800    # 30 minutes

class ChatCache:
    """Enhanced chat caching with Redis and Celery background tasks"""
    
    @staticmethod
    def get_chat_sessions(user_id: str) -> Optional[List[Dict]]:
        """Get cached chat sessions for a user"""
        try:
            key = CHAT_SESSIONS_KEY.format(user_id=user_id)
            cached_data = redis_client.get(key)
            if cached_data:
                logger.info(f"📚 Cache hit for chat sessions: {user_id}")
                return json.loads(cached_data)
            logger.info(f"📚 Cache miss for chat sessions: {user_id}")
            return None
        except Exception as e:
            logger.error(f"❌ Error getting cached chat sessions: {e}")
            return None
    
    @staticmethod
    def set_chat_sessions(user_id: str, sessions: List[Dict]) -> bool:
        """Cache chat sessions for a user"""
        try:
            key = CHAT_SESSIONS_KEY.format(user_id=user_id)
            redis_client.setex(
                key, 
                CHAT_SESSION_EXPIRE, 
                json.dumps(sessions, default=str)
            )
            logger.info(f"💾 Cached {len(sessions)} chat sessions for user: {user_id}")
            return True
        except Exception as e:
            logger.error(f"❌ Error caching chat sessions: {e}")
            return False
    
    @staticmethod
    def get_chat_messages(session_id: int) -> Optional[List[Dict]]:
        """Get cached chat messages for a session"""
        try:
            key = CHAT_MESSAGES_KEY.format(session_id=session_id)
            cached_data = redis_client.get(key)
            if cached_data:
                logger.info(f"💬 Cache hit for chat messages: {session_id}")
                return json.loads(cached_data)
            logger.info(f"💬 Cache miss for chat messages: {session_id}")
            return None
        except Exception as e:
            logger.error(f"❌ Error getting cached chat messages: {e}")
            return None
    
    @staticmethod
    def set_chat_messages(session_id: int, messages: List[Dict]) -> bool:
        """Cache chat messages for a session"""
        try:
            key = CHAT_MESSAGES_KEY.format(session_id=session_id)
            redis_client.setex(
                key, 
                CHAT_MESSAGES_EXPIRE, 
                json.dumps(messages, default=str)
            )
            logger.info(f"💾 Cached {len(messages)} messages for session: {session_id}")
            return True
        except Exception as e:
            logger.error(f"❌ Error caching chat messages: {e}")
            return False
    
    @staticmethod
    def add_message_to_cache(session_id: int, message: Dict) -> bool:
        """Add a single message to cached session messages"""
        try:
            key = CHAT_MESSAGES_KEY.format(session_id=session_id)
            cached_messages = ChatCache.get_chat_messages(session_id) or []
            cached_messages.append(message)
            return ChatCache.set_chat_messages(session_id, cached_messages)
        except Exception as e:
            logger.error(f"❌ Error adding message to cache: {e}")
            return False
    
    @staticmethod
    def invalidate_user_cache(user_id: str):
        """Invalidate all cache entries for a user"""
        try:
            pattern = f"*{user_id}*"
            keys = redis_client.keys(pattern)
            if keys:
                redis_client.delete(*keys)
                logger.info(f"🗑️ Invalidated {len(keys)} cache entries for user: {user_id}")
        except Exception as e:
            logger.error(f"❌ Error invalidating user cache: {e}")
    
    @staticmethod
    def invalidate_session_cache(session_id: int):
        """Invalidate cache for a specific session"""
        try:
            key = CHAT_MESSAGES_KEY.format(session_id=session_id)
            redis_client.delete(key)
            logger.info(f"🗑️ Invalidated cache for session: {session_id}")
        except Exception as e:
            logger.error(f"❌ Error invalidating session cache: {e}")

# Celery background tasks
@celery_app.task(bind=True, max_retries=3)
def cache_chat_sessions_task(self, user_id: str, db_session_data: str):
    """Background task to cache chat sessions"""
    try:
        from app.db import SessionLocal
        from app.models import ChatSession
        
        db = SessionLocal()
        try:
            # Get fresh data from database
            sessions = db.query(ChatSession).filter(
                ChatSession.user_id == user_id
            ).order_by(ChatSession.created_at.desc()).all()
            
            sessions_data = [
                {
                    "session_id": s.session_id,
                    "title": s.title,
                    "video_url": s.video_url,
                    "video_title": s.video_title,
                    "created_at": s.created_at.isoformat() if s.created_at else None,
                    "updated_at": s.updated_at.isoformat() if s.updated_at else None,
                    "user_id": s.user_id
                }
                for s in sessions
            ]
            
            # Cache the data
            ChatCache.set_chat_sessions(user_id, sessions_data)
            logger.info(f"✅ Background task cached {len(sessions_data)} sessions for user: {user_id}")
            
        finally:
            db.close()
            
    except Exception as exc:
        logger.error(f"❌ Background caching task failed: {exc}")
        # Retry with exponential backoff
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))

@celery_app.task(bind=True, max_retries=3)
def cache_chat_messages_task(self, session_id: int):
    """Background task to cache chat messages"""
    try:
        from app.db import SessionLocal
        from app.models import ChatMessage
        
        db = SessionLocal()
        try:
            # Get fresh data from database
            messages = db.query(ChatMessage).filter(
                ChatMessage.session_id == session_id
            ).order_by(ChatMessage.timestamp.asc()).all()
            
            messages_data = [
                {
                    "message_id": m.message_id,
                    "session_id": m.session_id,
                    "role": m.role,
                    "message": m.message,
                    "timestamp": m.timestamp.isoformat() if m.timestamp else None,
                    "video_context": m.video_context
                }
                for m in messages
            ]
            
            # Cache the data
            ChatCache.set_chat_messages(session_id, messages_data)
            logger.info(f"✅ Background task cached {len(messages_data)} messages for session: {session_id}")
            
        finally:
            db.close()
            
    except Exception as exc:
        logger.error(f"❌ Background message caching task failed: {exc}")
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))

@celery_app.task
def cleanup_expired_cache():
    """Periodic task to cleanup expired cache entries"""
    try:
        # This is handled automatically by Redis TTL, but we can add custom cleanup logic here
        logger.info("🧹 Cache cleanup task completed")
    except Exception as e:
        logger.error(f"❌ Cache cleanup failed: {e}")

# Periodic task configuration
celery_app.conf.beat_schedule = {
    'cleanup-cache-every-hour': {
        'task': 'app.cache.cleanup_expired_cache',
        'schedule': 3600.0,  # Every hour
    },
}

# Legacy in-memory cache for backward compatibility
video_cache: Dict[str, Dict[str, Any]] = {}

def test_redis_connection() -> bool:
    """Test Redis connection"""
    try:
        redis_client.ping()
        logger.info("✅ Redis connection successful")
        return True
    except Exception as e:
        logger.error(f"❌ Redis connection failed: {e}")
        return False

def test_celery_connection() -> bool:
    """Test Celery connection"""
    try:
        result = celery_app.control.inspect().stats()
        if result:
            logger.info("✅ Celery connection successful")
            return True
        else:
            logger.warning("⚠️ Celery workers not available")
            return False
    except Exception as e:
        logger.error(f"❌ Celery connection failed: {e}")
        return False