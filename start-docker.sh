#!/bin/bash

# YouTube Extractor Docker Compose Startup Script (NeonDB Version)

set -e

echo "🚀 Starting YouTube Extractor with Docker Compose (using NeonDB)..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp .env.docker .env
    echo "✅ Please configure your NeonDB connection string in .env file and run this script again."
    echo "📝 You need to set NEON_DATABASE_URL with your NeonDB connection string."
    exit 1
fi

# Check for NeonDB URL
if ! grep -q "NEON_DATABASE_URL=" .env; then
    echo "❌ NEON_DATABASE_URL not found in .env file."
    echo "📝 Please add your NeonDB connection string to the .env file."
    exit 1
fi

# Check for Gemini API Key
if ! grep -q "GEMINI_API_KEY=" .env; then
    echo "❌ GEMINI_API_KEY not found in .env file."
    echo "📝 Please add your Gemini API key to the .env file."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose not found. Please install Docker Compose."
    exit 1
fi

# Start services
echo "🐳 Starting all services (Redis, Backend, Frontend, Celery)..."
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service status
echo "📊 Service Status:"
docker-compose ps

# Display access URLs
echo ""
echo "🎉 YouTube Extractor is running!"
echo ""
echo "📍 Access URLs:"
echo "   Frontend:     http://localhost:3003 (→ https://yougen.hellonotionhive.com)"
echo "   Backend API:  http://localhost:8003 (→ https://ygbackend.hellonotionhive.com)"
echo "   API Docs:     http://localhost:8003/docs"
echo "   Redis UI:     http://localhost:8081"
echo ""
echo "🗃️  Database: NeonDB (external service)"
echo "🧠  AI Model: Google Gemini"
echo ""
echo "📝 Commands:"
echo "   View logs:    docker-compose logs -f"
echo "   Stop all:     docker-compose down"
echo "   Restart:      docker-compose restart"
echo ""