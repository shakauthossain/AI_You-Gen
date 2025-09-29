import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

# Simple in-memory cache implementation
class SimpleCache:
    def __init__(self):
        self.cache = {}
    
    def get(self, key: str) -> Optional[Any]:
        item = self.cache.get(key)
        if item and item['expires'] > datetime.now():
            return item['value']
        elif item:
            del self.cache[key]
        return None
    
    def set(self, key: str, value: Any, ttl: int = 3600):
        self.cache[key] = {
            'value': value,
            'expires': datetime.now() + timedelta(seconds=ttl)
        }
    
    def delete(self, key: str):
        if key in self.cache:
            del self.cache[key]
    
    def ping(self):
        return True

# Simple in-memory cache for video data
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
            
    def _generate_key(self, video_url: str, data_type: str) -> str:
        """Generate cache key for video data"""
        import hashlib
        video_hash = hashlib.md5(video_url.encode()).hexdigest()
        return f"video:{video_hash}:{data_type}"

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

# Initialize cache - try Redis first, fallback to in-memory
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