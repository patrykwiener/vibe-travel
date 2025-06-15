#!/bin/sh

set -e
set -x


# Default test path is empty (runs all tests)
TEST_PATH=""

# Default title for the coverage report
TITLE="coverage"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --title=*)
      TITLE="${1#*=}"
      shift
      ;;
    *)
      # Any other argument is treated as a test path
      TEST_PATH="$1"
      shift
      ;;
  esac
done

# Run the tests with the specified parameters
coverage run --source=src -m pytest $TEST_PATH
