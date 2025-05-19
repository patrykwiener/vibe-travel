#!/bin/sh

set -e
set -x

# Check if --fix parameter is passed
FIX_MODE=false
if [ "$1" = "--fix" ]; then
    FIX_MODE=true
fi

# Run Ruff check with or without fixes
if [ "$FIX_MODE" = true ]; then
    echo "Running in fix mode..."
    ruff check src tests --fix
    ruff format src tests
else
    ruff check src tests
    ruff format src tests --check
fi

# Run MyPy for type checking (no auto-fix available)
mypy src tests
