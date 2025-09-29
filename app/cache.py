import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

# Simple in-memory cache (not recommended for production)
class VideoCache:
    def __init__(self):
        self.cache = {}
    
    def get(self, key: str) -> Optional[Dict[str, Any]]:
        item = self.cache.get(key)
        if item and item['expires'] > datetime.now():
            return item['value']
        elif item:
            del self.cache[key]
        return None
    
    def set(self, key: str, value: Dict[str, Any], ttl: int = 3600):
        self.cache[key] = {
            'value': value,
            'expires': datetime.now() + timedelta(seconds=ttl)
        }
    
    def delete(self, key: str):
        if key in self.cache:
            del self.cache[key]
    
    def exists(self, key: str) -> bool:
        return key in self.cache and self.cache[key]['expires'] > datetime.now()
    
    def _generate_key(self, video_url: str, key_type: str = "transcript") -> str:
        """Generate cache key for video data"""
        import hashlib
        video_hash = hashlib.md5(video_url.encode()).hexdigest()
        return f"video:{video_hash}:{key_type}"

    def get_transcript(self, video_url: str) -> Optional[Dict[str, Any]]:
        """Get cached transcript data"""
        key = self._generate_key(video_url, "transcript")
        result = self.get(key)
        if result:
            logger.info("Transcript cache hit for video: %s", video_url)
        return result

    def set_transcript(self, video_url: str, transcript_data: Dict[str, Any]) -> bool:
        """Cache transcript data"""
        try:
            key = self._generate_key(video_url, "transcript")
            self.set(key, transcript_data, ttl=3600)  # 1 hour
            logger.info("Transcript cached for video: %s", video_url)
            return True
        except Exception as e:
            logger.error("Error caching transcript: %s", str(e))
            return False

    def get_qa(self, video_url: str, question: str) -> Optional[Dict[str, Any]]:
        """Get cached QA response"""
        import hashlib
        qa_hash = hashlib.md5(f"{video_url}:{question}".encode()).hexdigest()
        key = self._generate_key(video_url, f"qa:{qa_hash}")
        result = self.get(key)
        if result:
            logger.info("QA cache hit for video: %s", video_url)
        return result

    def set_qa(self, video_url: str, question: str, qa_data: Dict[str, Any]) -> bool:
        """Cache QA response"""
        try:
            import hashlib
            qa_hash = hashlib.md5(f"{video_url}:{question}".encode()).hexdigest()
            key = self._generate_key(video_url, f"qa:{qa_hash}")
            self.set(key, qa_data, ttl=3600)  # 1 hour
            logger.info("QA cached for video: %s", video_url)
            return True
        except Exception as e:
            logger.error("Error caching QA: %s", str(e))
            return False

    def get_mcq(self, video_url: str, num_questions: int = 5) -> Optional[Dict[str, Any]]:
        """Get cached MCQ data"""
        key = self._generate_key(video_url, f"mcq:{num_questions}")
        result = self.get(key)
        if result:
            logger.info("MCQ cache hit for video: %s", video_url)
        return result

    def set_mcq(self, video_url: str, mcq_data: Dict[str, Any], num_questions: int = 5) -> bool:
        """Cache MCQ data"""
        try:
            key = self._generate_key(video_url, f"mcq:{num_questions}")
            self.set(key, mcq_data, ttl=3600)  # 1 hour
            logger.info("MCQ cached for video: %s", video_url)
            return True
        except Exception as e:
            logger.error("Error caching MCQ: %s", str(e))
            return False

    def invalidate_video(self, video_url: str) -> bool:
        """Invalidate all cached data for a video"""
        try:
            import hashlib
            video_hash = hashlib.md5(video_url.encode()).hexdigest()
            keys_to_delete = [k for k in self.cache.keys() if k.startswith(f"video:{video_hash}:")]
            
            for key in keys_to_delete:
                del self.cache[key]
            
            logger.info("Invalidated cache for video: %s", video_url)
            return True
        except Exception as e:
            logger.error("Error invalidating video cache: %s", str(e))
            return False

# Initialize global cache instance
video_cache = VideoCache()

# Session and message caching functions
def get_cached_session(session_id: str) -> Optional[Dict[str, Any]]:
    """Get cached session data"""
    return video_cache.get(f"session:{session_id}")

def cache_session(session_id: str, session_data: Dict[str, Any]):
    """Cache session data"""
    video_cache.set(f"session:{session_id}", session_data, ttl=86400)  # 24 hours

def get_cached_messages(session_id: str) -> Optional[List[Dict[str, Any]]]:
    """Get cached messages for a session"""
    return video_cache.get(f"messages:{session_id}")

def cache_messages(session_id: str, messages: List[Dict[str, Any]]):
    """Cache messages for a session"""
    video_cache.set(f"messages:{session_id}", messages, ttl=3600)  # 1 hour

def invalidate_session_cache(session_id: str):
    """Invalidate all cached data for a session"""
    video_cache.delete(f"session:{session_id}")
    video_cache.delete(f"messages:{session_id}")

# Dummy functions to maintain compatibility (no async processing)
def process_video_async(video_url: str):
    """Synchronous video processing (no Celery)"""
    logger.info(f"Processing video synchronously: {video_url}")
    return {"status": "completed", "url": video_url}

def generate_mcq_async(video_url: str, num_questions: int = 5):
    """Synchronous MCQ generation (no Celery)"""  
    logger.info(f"Generating MCQ synchronously for: {video_url}")
    return {"status": "completed", "url": video_url, "questions": num_questions}

def cleanup_old_cache():
    """Clean up expired cache entries"""
    logger.info("Cache cleanup completed (in-memory cache auto-expires)")
    return {"status": "completed"}

def get_cache_stats():
    """Get cache statistics"""
    return {
        "cache_type": "in-memory",
        "total_keys": len(video_cache.cache),
        "status": "healthy"
    }

# Initialize cache
try:
    import redis
    from config import get_settings
    settings = get_settings()
    
    # Try Redis first
    redis_host = getattr(settings, 'redis_host', 'localhost') if settings else 'localhost'
    redis_port = getattr(settings, 'redis_port', 6379) if settings else 6379
    
    redis_client = redis.Redis(
        host=redis_host,
        port=redis_port,
        db=getattr(settings, 'redis_db', 0) if settings else 0,
        decode_responses=True
    )
    
    # Test Redis connection
    redis_client.ping()
    cache_client = redis_client
    logger.info("Using Redis cache")
    
except Exception as e:
    logger.warning(f"Redis not available, using in-memory cache: {e}")
    cache_client = SimpleCache()

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
                logger.info(f"Cache hit for chat sessions: {user_id}")
                return json.loads(cached_data)
            logger.info(f"Cache miss for chat sessions: {user_id}")
            return None
        except Exception as e:
            logger.error(f"Error getting cached chat sessions: {e}")
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
            logger.info(f"Cached {len(sessions)} chat sessions for user: {user_id}")
            return True
        except Exception as e:
            logger.error(f"Error caching chat sessions: {e}")
            return False
    
    @staticmethod
    def get_chat_messages(session_id: int) -> Optional[List[Dict]]:
        """Get cached chat messages for a session"""
        try:
            key = CHAT_MESSAGES_KEY.format(session_id=session_id)
            cached_data = redis_client.get(key)
            if cached_data:
                logger.info(f"Cache hit for chat messages: {session_id}")
                return json.loads(cached_data)
            logger.info(f"Cache miss for chat messages: {session_id}")
            return None
        except Exception as e:
            logger.error(f"Error getting cached chat messages: {e}")
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
            logger.info(f"Cached {len(messages)} messages for session: {session_id}")
            return True
        except Exception as e:
            logger.error(f"Error caching chat messages: {e}")
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
            logger.error(f"Error adding message to cache: {e}")
            return False
    
    @staticmethod
    def invalidate_user_cache(user_id: str):
        """Invalidate all cache entries for a user"""
        try:
            pattern = f"*{user_id}*"
            keys = redis_client.keys(pattern)
            if keys:
                redis_client.delete(*keys)
                logger.info(f"Invalidated {len(keys)} cache entries for user: {user_id}")
        except Exception as e:
            logger.error(f"Error invalidating user cache: {e}")
    
    @staticmethod
    def invalidate_session_cache(session_id: int):
        """Invalidate cache for a specific session"""
        try:
            key = CHAT_MESSAGES_KEY.format(session_id=session_id)
            redis_client.delete(key)
            logger.info(f"Invalidated cache for session: {session_id}")
        except Exception as e:
            logger.error(f"Error invalidating session cache: {e}")

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
            logger.info(f"Background task cached {len(sessions_data)} sessions for user: {user_id}")
            
        finally:
            db.close()
            
    except Exception as exc:
        logger.error(f"Background caching task failed: {exc}")
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
            logger.info(f"Background task cached {len(messages_data)} messages for session: {session_id}")
            
        finally:
            db.close()
            
    except Exception as exc:
        logger.error(f"Background message caching task failed: {exc}")
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))

@celery_app.task
def cleanup_expired_cache():
    """Periodic task to cleanup expired cache entries"""
    try:
        # This is handled automatically by Redis TTL, but we can add custom cleanup logic here
        logger.info("🧹 Cache cleanup task completed")
    except Exception as e:
        logger.error(f"Cache cleanup failed: {e}")

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
        logger.info("Redis connection successful")
        return True
    except Exception as e:
        logger.error(f"Redis connection failed: {e}")
        return False

def test_celery_connection() -> bool:
    """Test Celery connection"""
    try:
        result = celery_app.control.inspect().stats()
        if result:
            logger.info("Celery connection successful")
            return True
        else:
            logger.warning("Celery workers not available")
            return False
    except Exception as e:
        logger.error(f"Celery connection failed: {e}")
        return False