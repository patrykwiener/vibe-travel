#!/usr/bin/env sh
set -e
set -x

# Run database pre-start checks
python tests_pre_start.py

# Run the actual tests
sh scripts/test.sh "$@"
