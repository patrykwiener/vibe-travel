#!/bin/sh

set -e

if [ -f /app/scripts/prestart.sh ]; then
    . /app/scripts/prestart.sh
fi

# Environment variables with defaults
HOST=${HOST:-"0.0.0.0"}
PORT=${PORT:-"80"}
LOG_LEVEL=${LOG_LEVEL:-"info"}

# Start FastAPI with live reload for development using FastAPI CLI
exec fastapi dev src/main.py --host "$HOST" --port "$PORT" --reload --proxy-headers