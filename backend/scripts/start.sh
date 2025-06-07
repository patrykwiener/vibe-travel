#!/bin/sh

set -e

if [ -f /app/scripts/prestart.sh ]; then
    . /app/scripts/prestart.sh
fi

# Environment variables with defaults
HOST=${HOST:-"0.0.0.0"}
PORT=${PORT:-"80"}
LOG_LEVEL=${LOG_LEVEL:-"info"}
WORKERS=${WORKERS:-"auto"}

# Start FastAPI using its CLI
exec fastapi run src/main.py --host "$HOST" --port "$PORT" --workers "$WORKERS" --proxy-headers
