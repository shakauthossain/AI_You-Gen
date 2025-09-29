# Docker Compose Setup

This Docker Compose configuration provides a complete development and production environment for the YouTube Extractor application with both backend and frontend services.

## Services Included

- **NeonDB** - Serverless PostgreSQL database (external service)
- **Redis Cache** (`redis`) - Caching layer
- **FastAPI Backend** (`backend`) - Python API server
- **Celery Worker** (`celery`) - Background task processing
- **React Frontend** (`frontend`) - Vite-built React application
- **Redis Commander** (`redis-commander`) - Optional Redis management UI

## Prerequisites

- Docker and Docker Compose installed
- `.env.docker` file configured (copy from `.env.docker` template)

## Quick Start

1. **Configure Environment Variables**
   ```bash
   cp .env.docker .env
   # Edit .env with your actual values
   ```

2. **Start All Services**
   ```bash
   docker-compose up -d
   ```

3. **View Logs**
   ```bash
   docker-compose logs -f
   ```

## Service Access

- **Frontend**: http://localhost:3003 → https://yougen.hellonotionhive.com
- **Backend API**: http://localhost:8003 → https://ygbackend.hellonotionhive.com
- **API Documentation**: http://localhost:8003/docs
- **Redis Commander**: http://localhost:8081
- **NeonDB**: Access via your NeonDB dashboard

## Development Commands

### Build and Start
```bash
# Build and start all services
docker-compose up --build

# Start in detached mode
docker-compose up -d

# Start specific service
docker-compose up backend frontend
```

### Monitoring
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Check service status
docker-compose ps
```

### Database Management

```bash
# NeonDB is managed externally - use Neon Console for database operations
# https://console.neon.tech/

# Run database migrations from backend container
docker-compose exec backend python -c "from app.db import create_tables; create_tables()"
```

### Development Mode
```bash
# Start with local file watching (backend auto-reload enabled)
docker-compose up backend frontend redis postgres

# Rebuild specific service
docker-compose build backend
docker-compose build frontend
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# NeonDB
NEON_DATABASE_URL=postgresql://username:password@your-neon-hostname.neon.tech/your-database-name?sslmode=require

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Clerk Authentication
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_FRONTEND_API=your-clerk-frontend-api.clerk.accounts.dev
CLERK_AUDIENCE=yougen.hellonotionhive.com,your-clerk-frontend-api.clerk.accounts.dev
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# App Configuration
CORS_ALLOW_ORIGINS=https://yougen.hellonotionhive.com,http://localhost:3003
APP_ENV=production
```

## Production Deployment

For production deployment:

1. **Update Environment Variables**
   ```bash
   # Set secure passwords and production keys
   nano .env
   ```

2. **Use Production Configuration**
   ```bash
   # Start with production settings
   docker-compose -f docker-compose.yml up -d
   ```

3. **Scale Services** (if needed)
   ```bash
   # Scale backend workers
   docker-compose up -d --scale celery=3
   ```

## Health Checks

All services include health checks:

```bash
# Check service health
docker-compose ps
```

Services will show as `healthy` when ready.

## Troubleshooting

### Service Won't Start
```bash
# Check logs
docker-compose logs [service-name]

# Restart specific service
docker-compose restart [service-name]
```

### Database Connection Issues

```bash
# Check NeonDB connection from your Neon Console
# https://console.neon.tech/

# Verify DATABASE_URL in your .env file
echo $NEON_DATABASE_URL
```

### Frontend Build Issues
```bash
# Rebuild frontend
docker-compose build frontend --no-cache

# Check build logs
docker-compose logs frontend
```

### Port Conflicts
If you have port conflicts, update the ports in `docker-compose.yml`:

```yaml
services:
  frontend:
    ports:
      - "3001:3000"  # Change host port
  backend:
    ports:
      - "8001:8000"  # Change host port
```

## Cleanup

```bash
# Stop all services
docker-compose down

# Remove all data (destructive)
docker-compose down -v

# Remove images
docker-compose down --rmi all
```

## File Structure

```
.
├── docker-compose.yml          # Main Docker Compose configuration
├── Dockerfile.backend          # Backend Docker configuration
├── .env.docker                 # Environment template
├── app/                        # Backend source code
│   └── requirements.txt
└── Frontend/
    ├── Dockerfile              # Frontend Docker configuration
    ├── nginx.conf              # Nginx configuration
    └── package.json
```

## Notes

- Backend runs with auto-reload in development mode
- Frontend is served by Nginx with optimized caching
- PostgreSQL data persists in Docker volumes
- Redis data persists in Docker volumes
- All services include proper health checks
- CORS is configured for development