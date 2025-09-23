import os
import logging
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.routes import transcript, qa, mcq, chat
from app.auth import get_current_user

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="YT Q&A + MCQ Generator with Caching",
    version="1.2.0",
    description="YouTube video analysis with AI-powered Q&A, MCQ generation, and Redis caching",
    dependencies=[Depends(get_current_user)]  # Require Clerk auth globally
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(transcript.router, prefix="/transcript", tags=["Transcript"])
app.include_router(qa.router, prefix="/qa", tags=["Q&A"])
app.include_router(mcq.router, prefix="/mcq", tags=["MCQs"])
app.include_router(chat.router, prefix="/chat", tags=["Chat"])

@app.get("/health")
async def health_check():
    """Health check endpoint with cache status"""
    health_status = {
        "status": "healthy",
        "version": "1.2.0",
        "cache": {
            "redis": False,
            "celery": False
        }
    }
    
    # Check cache connectivity
    try:
        from app.cache import test_redis_connection, test_celery_connection, CACHE_ENABLED
        if CACHE_ENABLED:
            health_status["cache"]["redis"] = test_redis_connection()
            health_status["cache"]["celery"] = test_celery_connection()
            health_status["cache"]["enabled"] = True
        else:
            health_status["cache"]["enabled"] = False
            health_status["cache"]["message"] = "Cache disabled or dependencies not available"
    except ImportError:
        health_status["cache"]["enabled"] = False
        health_status["cache"]["message"] = "Cache dependencies not installed"
    
    return health_status

@app.get("/protected")
def protected_route(user=Depends(get_current_user)):
    return {"message": "This is protected", "user": user}

@app.on_event("startup")
async def startup_event():
    """Application startup event"""
    logger.info("🚀 Starting YouTube Extractor with caching...")
    
    # Test cache connectivity on startup
    try:
        from app.cache import test_redis_connection, CACHE_ENABLED
        if CACHE_ENABLED:
            if test_redis_connection():
                logger.info("✅ Redis connection successful")
            else:
                logger.warning("⚠️ Redis connection failed - running without cache")
        else:
            logger.info("ℹ️ Cache disabled")
    except ImportError:
        logger.info("ℹ️ Cache dependencies not available - running without cache")