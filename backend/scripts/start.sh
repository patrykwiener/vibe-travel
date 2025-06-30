#!/bin/bash

# VibeTravels Backend Start Script for Production
# This script starts the FastAPI application with production optimizations

set -e

echo "🚀 Starting VibeTravels Backend..."

# Check environment variables
if [ -z "$PORT" ]; then
    echo "⚠️  PORT environment variable not set, using default 10000"
    export PORT=10000
fi

if [ -z "$POSTGRES_SERVER" ]; then
    echo "❌ Required database environment variables not set"
    exit 1
fi

echo "📊 Environment Configuration:"
echo "  - Environment: ${ENVIRONMENT:-production}"
echo "  - Port: $PORT"
echo "  - Database: $POSTGRES_SERVER:$POSTGRES_PORT"
echo "  - Workers: ${WORKERS:-1}"

# Wait for database to be ready
echo "⏳ Waiting for database connection..."
timeout=60
counter=0
while ! nc -z "$POSTGRES_SERVER" "$POSTGRES_PORT"; do
    if [ $counter -ge $timeout ]; then
        echo "❌ Database connection timeout after ${timeout}s"
        exit 1
    fi
    sleep 1
    counter=$((counter + 1))
done
echo "✅ Database connection established"

# Run database migrations
echo "🔄 Running database migrations..."
if ! python -m alembic upgrade head; then
    echo "❌ Database migration failed"
    exit 1
fi
echo "✅ Database migrations completed"

# Start the application using uvicorn
echo "🌟 Starting FastAPI application..."
exec uvicorn src.main:app \
    --host 0.0.0.0 \
    --port "$PORT" \
    --workers "${WORKERS:-1}" \
    --loop uvloop \
    --http httptools \
    --access-log \
    --use-colors
