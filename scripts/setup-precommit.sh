#!/bin/bash

# Script to setup pre-commit hooks for VibeTravels
# Run this script from the project root directory

set -e

echo "🔧 Setting up pre-commit hooks for VibeTravels..."

# Check if we're in the right directory
if [[ ! -f ".pre-commit-config.yaml" ]]; then
    echo "❌ Error: .pre-commit-config.yaml not found. Please run this script from the project root."
    exit 1
fi

# Check if pre-commit is installed
if ! command -v pre-commit &> /dev/null; then
    echo "📦 Installing pre-commit..."

    # Try to install pre-commit using pip
    if command -v pip &> /dev/null; then
        pip install pre-commit
    elif command -v pip3 &> /dev/null; then
        pip3 install pre-commit
    else
        echo "❌ Error: pip not found. Please install pip first or install pre-commit manually:"
        echo "   pip install pre-commit"
        exit 1
    fi
fi

# Install the pre-commit hooks
echo "🎣 Installing pre-commit hooks..."
pre-commit install

# Run pre-commit on all files to test
echo "🧪 Testing pre-commit setup..."
pre-commit run --all-files || true

echo "✅ Pre-commit setup complete!"
echo ""
echo "📝 Usage:"
echo "  - Hooks will run automatically on git commit"
echo "  - Run manually: pre-commit run --all-files"
echo "  - Update hooks: pre-commit autoupdate"
echo "  - Skip hooks: git commit --no-verify"
echo ""
echo "🚀 Happy coding!"
