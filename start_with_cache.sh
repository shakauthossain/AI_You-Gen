#!/bin/bash
# Quick start script for YouTube Extractor with caching

echo "🚀 Starting YouTube Extractor with Redis caching..."

# Check if Redis is running
if ! redis-cli ping > /dev/null 2>&1; then
    echo "🔴 Starting Redis..."
    if command -v docker &> /dev/null; then
        docker-compose -f docker-compose.redis.yml up -d
        echo "✅ Redis started with Docker"
    else
        sudo systemctl start redis
        echo "✅ Redis started with systemctl"
    fi
else
    echo "✅ Redis is already running"
fi

# Start Celery worker in background
echo "🔧 Starting Celery worker..."
celery -A app.cache.celery_app worker --loglevel=info --detach

# Start the FastAPI application
echo "🌐 Starting FastAPI server..."
echo "📊 Health check will be available at: http://localhost:8000/health"
echo "🕸️ Redis UI available at: http://localhost:8081 (if using Docker)"
echo ""

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000