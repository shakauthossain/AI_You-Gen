#!/bin/bash
# Setup script for Redis and Celery

echo "🚀 Setting up YouTube Extractor with Redis and Celery caching..."

# Check if Redis is installed
if ! command -v redis-server &> /dev/null; then
    echo "📦 Installing Redis..."
    sudo apt update
    sudo apt install -y redis-server
fi

# Start Redis service
echo "🔴 Starting Redis server..."
sudo systemctl start redis
sudo systemctl enable redis

# Check Redis status
redis-cli ping

# Install Python dependencies
echo "🐍 Installing Python dependencies..."
cd "$(dirname "$0")"
pip install -r requirements.txt

echo "✅ Setup complete!"
echo ""
echo "To start the application with caching:"
echo "1. Start the FastAPI server: uvicorn app.main:app --reload"
echo "2. In another terminal, start Celery worker: celery -A app.cache.celery_app worker --loglevel=info"
echo "3. (Optional) Start Celery Beat for periodic tasks: celery -A app.cache.celery_app beat --loglevel=info"
echo ""
echo "Environment variables you can set:"
echo "- REDIS_HOST=localhost"
echo "- REDIS_PORT=6379"
echo "- REDIS_DB=0"
echo "- ENABLE_CACHE=true"