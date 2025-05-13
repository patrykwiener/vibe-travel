# VibeTravels Backend

[![Python](https://img.shields.io/badge/Python-3.13-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.12-009688.svg)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Latest-336791.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED.svg)](https://www.docker.com/)
[![Project Status: MVP Development](https://img.shields.io/badge/Project%20Status-MVP%20Development-yellow)](https://github.com/10xdevs/vibe-travel)

## Table of Contents

- [VibeTravels Backend](#vibetravels-backend)
  - [Table of Contents](#table-of-contents)
  - [Project Description](#project-description)
  - [Tech Stack](#tech-stack)
  - [Project Structure](#project-structure)
  - [Environment Variables](#environment-variables)
  - [Available Scripts](#available-scripts)
  - [Project Scope](#project-scope)
    - [Core Features](#core-features)
    - [API Endpoints](#api-endpoints)
  - [Project Status](#project-status)
  - [Development Guidelines](#development-guidelines)

## Project Description

This is the backend application for VibeTravels - an MVP designed to transform simple travel notes into detailed trip plans using AI technology. The backend provides a robust API for managing travel notes, user profiles, and AI-generated travel plans.

The VibeTravels backend addresses key challenges in trip planning by providing:
- RESTful API for managing user travel notes and preferences
- Integration with OpenRouter.ai for AI-powered trip planning
- JWT-based authentication system with secure user management
- PostgreSQL database storage for reliable data persistence

## Tech Stack

The backend is built with modern technologies:

- **Python 3.13**: Latest stable version with improved performance and type hints
- **FastAPI**: High-performance, easy-to-use web framework with automatic OpenAPI documentation
- **FastAPI Utilities**: Extensions for common FastAPI patterns and utilities
- **PostgreSQL**: Robust relational database for data storage
- **Docker**: Containerization for consistent development and deployment
- **Ruff**: Fast Python linter and code formatter
- **Pytest**: Testing framework for unit and integration tests

## Project Structure

The backend follows a clean, modular structure:

```
backend/
├── src/
│   ├── apps/                 # Application modules
│   │   ├── {app_name}/       # Specific application modules
│   │   │   ├── api.py        # API endpoints
│   │   │   ├── models.py     # Database models
│   │   │   ├── schemas.py    # Pydantic schemas
│   │   │   ├── services.py   # Business logic
│   │   │   └── utils.py      # Helper functions
│   ├── config.py             # Application configuration
│   ├── main.py               # FastAPI application initialization
│   └── routes.py             # API router definitions
├── tests/                    # Test directory
│   └── {app_name}/           # Tests for specific applications
│       ├── unit/             # Unit tests
│       └── integration/      # Integration tests
├── scripts/                  # Utility scripts
│   ├── lint.sh               # Linting script
│   ├── prestart.sh           # Pre-startup checks
│   ├── start.sh              # Production startup
│   ├── start-reload.sh       # Development startup with reload
│   └── test.sh               # Test execution script
└── Dockerfile                # Docker configuration
```

## Environment Variables

VibeTravels backend uses environment variables for configuration. Create a `.env` file in the project root directory with the following variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `API_V1_STR` | API version path prefix | `/api/v1` |
| `SECRET_KEY` | Secret key for JWT encoding | auto-generated |
| `ENVIRONMENT` | Environment (dev/prod) | `dev` |
| `FRONTEND_HOST` | Frontend application URL | `http://localhost:5173` |
| `BACKEND_CORS_ORIGINS` | Allowed CORS origins (comma-separated) | `[]` |
| `POSTGRES_SERVER` | PostgreSQL server address | `db` |
| `POSTGRES_PORT` | PostgreSQL server port | `5432` |
| `POSTGRES_USER` | PostgreSQL username | `postgres` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `postgres` |
| `POSTGRES_DB` | PostgreSQL database name | `app` |
| `OPENROUTER_API_KEY` | OpenRouter.ai API key | |
| `HOST` | Backend server host | `0.0.0.0` |
| `PORT` | Backend server port | `80` |

## Available Scripts

The backend can be managed using the project's Makefile commands:

| Command | Description |
|---------|-------------|
| `make build` | Build Docker containers |
| `make up` | Start development environment |
| `make down` | Stop development environment |
| `make logs` | Show logs for all services |
| `make logs-backend` | Show backend logs |
| `make lint` | Run linting |
| `make lint-fix` | Fix linting issues |
| `make test [path=path/to/test]` | Run tests (optionally for specific path) |
| `make shell` | Enter backend shell |

## Project Scope

The backend implements the following core features of the VibeTravels application:

### Core Features

1. **User Authentication & Profiles**
   - Registration and login with JWT authentication (30-day validity)
   - User profile with travel preferences (travel style, pace, budget)
   - Secure password handling

2. **Notes Management**
   - Create, read, update, delete (CRUD) operations for travel notes
   - Each note contains title, place, dates, number of people, and key ideas
   - Search and pagination functionality
   - Data validation for all fields

3. **AI-Powered Travel Planning**
   - Integration with OpenRouter.ai for AI model access
   - Generate detailed travel plans from notes
   - Edit, accept, or reject AI-generated plans
   - Manual plan creation option

### API Endpoints

The API is documented using OpenAPI (Swagger UI) and can be accessed at `/api/v1/docs` when the server is running. Key endpoints include:

- **Authentication**
  - `POST /api/v1/auth/register` - Register a new user
  - `POST /api/v1/auth/login` - Login and get access token
  - `POST /api/v1/auth/logout` - Logout and invalidate token

- **User Profile**
  - `GET /api/v1/users/me` - Get current user profile
  - `GET /api/v1/profile` - Get travel preferences
  - `PUT /api/v1/profile` - Update travel preferences

- **Notes Management**
  - `GET /api/v1/notes` - List all notes (with search and pagination)
  - `POST /api/v1/notes` - Create a new note
  - `GET /api/v1/notes/{id}` - Get a specific note
  - `PUT /api/v1/notes/{id}` - Update a note
  - `DELETE /api/v1/notes/{id}` - Delete a note

- **Travel Plans**
  - `POST /api/v1/notes/{id}/plan/generate` - Generate an AI plan
  - `POST /api/v1/notes/{id}/plan` - Save a plan (AI-generated or manual)
  - `GET /api/v1/notes/{id}/plan` - Get the plan for a note

## Project Status

VibeTravels backend is currently in MVP development stage. The application implements core functionality to demonstrate the concept and gather user feedback.

Current limitations:
- No sharing functionality between accounts
- No advanced multimedia processing
- No advanced logistics planning
- No password reset or email confirmation

**Key Success Metrics:**
- 90% of users complete their preference profiles
- 75% of users generate at least 3 travel plans annually

## Development Guidelines

When contributing to the backend codebase, please follow these guidelines:

1. **FastAPI Best Practices**
   - Use Pydantic models for request and response validation
   - Implement dependency injection for services and database sessions
   - Use async endpoints for I/O-bound operations
   - Leverage FastAPI's built-in OpenAPI documentation

2. **Testing Guidelines**
   - Write unit tests for all new functionality
   - Use fixtures for test setup and dependency injection
   - Implement parameterized tests for multiple input scenarios
   - Mock external dependencies appropriately

3. **Code Quality**
   - Run linting checks before committing (`make lint`)
   - Follow the Clean Architecture principles
   - Use typing for all function parameters and return values
   - Document all public functions and classes

4. **Database Guidelines**
   - Use migrations for database schema changes
   - Follow normalization principles for database design
   - Use indexes for frequently queried fields
   - Document complex database relationships
