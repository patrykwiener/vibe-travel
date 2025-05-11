#!/bin/sh

set -e

# Wait for PostgreSQL to be available
echo "Waiting for PostgreSQL..."
while ! nc -z "${POSTGRES_SERVER}" "${POSTGRES_PORT}"; do
  sleep 0.1
done
echo "PostgreSQL is available"

# Run database migrations if needed (assuming you'll use alembic for migrations)
alembic upgrade head
