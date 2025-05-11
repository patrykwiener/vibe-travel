#!/bin/sh

set -e

# Check if message argument is provided
if [ "$#" -eq 0 ]; then
    echo "Error: Migration message is required"
    echo "Usage: $0 \"your migration message\""
    exit 1
fi

# Use the first argument as the migration message
alembic revision --autogenerate -m "$1"