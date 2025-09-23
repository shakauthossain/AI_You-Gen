import os
from dotenv import load_dotenv
import google.generativeai as genai

# Handle different Pydantic versions
try:
    from pydantic_settings import BaseSettings
except ImportError:
    try:
        from pydantic import BaseSettings
    except ImportError:
        # Fallback for older versions
        class BaseSettings:
            def __init__(self, **kwargs):
                for key, value in kwargs.items():
                    setattr(self, key, value)

load_dotenv()

class Settings(BaseSettings):
    # Authentication settings
    clerk_frontend_api: str = os.getenv("CLERK_FRONTEND_API", "")
    
    # Existing settings
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    embed_model_name: str = os.getenv("EMBED_MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2")
    
    # Database settings
    database_url: str = os.getenv("DATABASE_URL", "")
    
    # Redis and Celery settings
    redis_host: str = os.getenv("REDIS_HOST", "localhost")
    redis_port: int = int(os.getenv("REDIS_PORT", "6379"))
    redis_db: int = int(os.getenv("REDIS_DB", "0"))
    redis_password: str = os.getenv("REDIS_PASSWORD", "")
    
    # Celery settings
    celery_broker_url: str = os.getenv("CELERY_BROKER_URL", f"redis://{os.getenv('REDIS_HOST', 'localhost')}:{os.getenv('REDIS_PORT', '6379')}/0")
    celery_result_backend: str = os.getenv("CELERY_RESULT_BACKEND", f"redis://{os.getenv('REDIS_HOST', 'localhost')}:{os.getenv('REDIS_PORT', '6379')}/0")
    
    # Cache settings
    enable_cache: bool = os.getenv("ENABLE_CACHE", "true").lower() == "true"
    cache_expire_sessions: int = int(os.getenv("CACHE_EXPIRE_SESSIONS", "86400"))  # 24 hours
    cache_expire_messages: int = int(os.getenv("CACHE_EXPIRE_MESSAGES", "3600"))   # 1 hour
    
    class Config:
        env_file = ".env"

def get_settings() -> Settings:
    return Settings()

# Backward compatibility - avoid circular imports
settings = None
try:
    settings = get_settings()
    GEMINI_API_KEY = settings.gemini_api_key
    EMBED_MODEL_NAME = settings.embed_model_name
except Exception as e:
    # Fallback for cases where settings can't be loaded
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    EMBED_MODEL_NAME = os.getenv("EMBED_MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)