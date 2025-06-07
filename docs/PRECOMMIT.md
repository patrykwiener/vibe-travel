# Pre-commit Setup Documentation

This document explains how to set up and use pre-commit hooks in the VibeTravels project.

## What are Pre-commit Hooks?

Pre-commit hooks are scripts that run automatically before each git commit to ensure code quality and consistency. Pre-commit is installed on your local machine, but our setup runs `make lint` which uses Docker containers for linting:

- Backend linting with ruff (in Docker container)
- Frontend linting with ESLint (in Docker container)  
- TypeScript type checking (in Docker container)
- Code formatting

## Installation

Pre-commit must be installed on your local machine (not in Docker containers):

1. Install pre-commit globally:

   ```bash
   pip install pre-commit
   ```

2. Run the setup script:

   ```bash
   make setup-precommit
   ```

3. The hooks are now installed and will run on every commit.

## Usage

### Automatic Running

Pre-commit hooks run automatically when you commit:

```bash
git add .
git commit -m "Your commit message"
# Hooks will run automatically and may modify files
# If files are modified, you need to add and commit again
```

### Manual Running

Run hooks on all files:

```bash
make precommit-run
# or directly:
pre-commit run --all-files
```

Run hooks on specific files:

```bash
pre-commit run --files backend/src/apps/notes/api.py
```

### Skipping Hooks

If you need to skip hooks (not recommended):

```bash
git commit --no-verify -m "Skip hooks"
```

## Updating Hooks

Update to the latest versions:

```bash
make precommit-update
```

## Configuration

The pre-commit configuration is in `.pre-commit-config.yaml`. It includes:

1. **make lint**: Runs the full linting suite for both backend and frontend
2. **File quality checks**: Trailing whitespace, line endings, file size limits
3. **Python-specific**: Direct ruff linting for quick feedback

## Troubleshooting

### Hooks fail with Docker not running

Pre-commit runs locally, but `make lint` requires Docker containers to be running:

```bash
docker compose up -d
```

### Pre-commit not found

Make sure pre-commit is installed on your local machine:

```bash
pip install pre-commit
# or
pip3 install pre-commit
```

### Hooks are too slow

You can configure which hooks run by editing `.pre-commit-config.yaml` or use:

```bash
pre-commit run --hook-stage manual
```

## Integration with CI/CD

The pre-commit configuration is compatible with pre-commit.ci service for automated updates and running hooks in pull requests.
