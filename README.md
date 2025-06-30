# VibeTravels

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Project Status: MVP Development](https://img.shields.io/badge/Project%20Status-MVP%20Development-yellow)](https://github.com/10xdevs/vibe-travel)
[![CI/CD Pipeline](https://github.com/patrykwiener/vibe-travel/workflows/CI/CD%20Pipeline/badge.svg)](https://github.com/patrykwiener/vibe-travel/actions)

## Table of Contents

- [VibeTravels](#vibetravels)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Tech Stack](#tech-stack)
    - [Frontend](#frontend)
    - [Backend](#backend)
    - [AI Integration](#ai-integration)
    - [Testing](#testing)
      - [Backend Testing](#backend-testing)
      - [Frontend Testing](#frontend-testing)
    - [CI/CD \& Hosting](#cicd--hosting)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Setup](#setup)
  - [Available Scripts](#available-scripts)
  - [Development Setup](#development-setup)
    - [Code Quality with Pre-commit Hooks](#code-quality-with-pre-commit-hooks)
  - [Project Scope](#project-scope)
    - [Project Structure](#project-structure)
    - [Core Features](#core-features)
    - [Project Architecture](#project-architecture)
      - [Backend Structure](#backend-structure)
      - [Frontend Structure](#frontend-structure)
      - [Key Design Patterns](#key-design-patterns)
    - [Current Limitations](#current-limitations)
  - [Project Status](#project-status)
  - [License](#license)

## Overview

VibeTravels is an innovative MVP application designed to transform simple travel notes into detailed trip plans using AI technology. The core functionality includes:

- **Smart Travel Planning**: Convert your rough travel ideas into comprehensive itineraries
- **Note Management**: Create, organize, and search through your travel notes
- **User Profiles**: Save your travel preferences to generate more personalized plans
- **AI Integration**: Leverage OpenRouter.ai services to access a wide range of AI models

VibeTravels addresses common challenges in trip planning, including:

- Time-consuming research and organization
- Difficulty finding relevant attractions that match personal preferences
- Lack of tools to transform loose ideas into cohesive travel plans

## Tech Stack

### Frontend

- **Vue.js 3**: Progressive JavaScript framework with Composition API
- **TypeScript**: Type-safe JavaScript development
- **Tailwind CSS 4**: Utility-first CSS framework for rapid UI development
- **Flowbite 3**: Component library built on top of Tailwind CSS
- **Pinia**: State management for Vue applications
- **Vue Router**: Official router for Vue.js

### Backend

- **Python 3.13**: Core programming language
- **FastAPI**: High-performance web framework for building APIs
- **FastAPI Utilities**: Extension package for common FastAPI patterns
- **FastAPI Users**: Complete authentication system for FastAPI
- **FastAPI Pagination**: Pagination support for FastAPI
- **PostgreSQL 17**: Relational database for data storage
- **SQLAlchemy**: Python SQL toolkit and Object-Relational Mapping
- **Alembic**: Database migration tool for SQLAlchemy
- **Docker**: Containerization for consistent development and deployment

### AI Integration

- **OpenRouter.ai**: Service providing access to various AI models (OpenAI, Anthropic, Google, etc.)
- Features cost-effective model selection and financial limit setting for API keys

### Testing

#### Backend Testing

- **pytest**: Framework for Python unit and integration tests
- **pytest-cov**: Code coverage reporting
- **pytest-asyncio**: Support for asynchronous tests
- **httpx**: HTTP client for API testing
- **unittest.mock**: Mocking dependencies
- **factory_boy**: Test data generation
- **faker**: Random data generation

#### Frontend Testing

- **Vitest**: Fast unit testing framework for Vue.js
- **Vue Test Utils**: Official testing utilities for Vue components
- **@testing-library/vue**: Testing utilities for better test practices
- **@vitest/ui**: Interactive testing interface
- **@vitest/coverage-v8**: Code coverage reporting
- **Happy DOM**: Fast DOM implementation for testing
- **MSW (Mock Service Worker)**: API mocking for frontend tests (via setupTests)

### CI/CD & Hosting

- **GitHub Actions**: Automated CI/CD pipelines
- **Render**: Cloud hosting platform with Infrastructure as Code (render.yaml)

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Git
- Make (optional but recommended)

### Setup

1. Clone the repository:

        git clone https://github.com/10xdevs/vibe-travel.git
        cd vibe-travel

2. Initialize the project using Make:

        make init

   This command:
   - Creates a `.env` file from the template
   - Builds Docker images
   - Starts the containers

3. Alternatively, follow these manual steps:

        cp -n .env.template .env
        docker compose build
        docker compose up

4. The application should now be running:
   - Frontend: <http://localhost:5173>
   - Backend API: <http://localhost:8000>
   - API Documentation: <http://localhost:8000/docs>

## Available Scripts

The project uses a Makefile to simplify common operations:

| Command | Description |
|---------|-------------|
| `make help` | Show available commands |
| `make build` | Build Docker containers |
| `make up` | Start development environment |
| `make down` | Stop development environment |
| `make logs` | Show logs for all services |
| `make logs-backend` | Show backend logs |
| `make logs-frontend` | Show frontend logs |
| `make lint` | Run linting for both backend and frontend |
| `make lint-fix` | Fix linting issues automatically |
| `make test-backend [path=path/to/test]` | Run backend tests (optionally for specific path) |
| `make test-frontend` | Run frontend tests with coverage |
| `make test-all` | Run all tests (backend + frontend) with coverage |
| `make shell` | Enter backend shell |
| `make create-env` | Create .env file from template |
| `make init` | Initialize project (create .env, build images, start containers) |
| `make reset-db` | Reset the database (drops all data) |
| `make generate-openapi-client` | Generate OpenAPI client for frontend |
| `make makemigrations [msg=message]` | Create new migrations based on model changes |
| `make migrate` | Apply database migrations |
| `make setup-precommit` | Setup pre-commit hooks |
| `make precommit-run` | Run pre-commit hooks on all files |
| `make precommit-update` | Update pre-commit hooks to latest versions |

## Development Setup

### Code Quality with Pre-commit Hooks

This project uses pre-commit hooks to ensure code quality and consistency. The hooks automatically run `make lint` before each commit, which includes:

- Backend linting with ruff
- Frontend linting with ESLint  
- TypeScript type checking
- Code formatting

**Quick setup:**

```bash
make setup-precommit
```

For detailed setup instructions and troubleshooting, see [docs/PRECOMMIT.md](docs/PRECOMMIT.md).

## Project Scope

### Project Structure

The repository is organized as follows:

    ├── .ai/                    # AI-related documentation and specifications
    ├── .github/                # GitHub Actions CI/CD workflows
    ├── backend/                # FastAPI backend application
    ├── docs/                   # Project documentation
    ├── frontend/               # Vue.js frontend application
    ├── scripts/                # Utility scripts for development
    ├── docker-compose.yml      # Docker services configuration
    ├── Makefile               # Development commands
    └── README.md              # Project documentation

### Core Features

1. **User Authentication & Profiles**
   - Registration and login with JWT authentication (stored in HTTP-only cookies)
   - User profile with travel preferences (travel style, pace, budget)
   - Secure password handling with FastAPI Users
   - Automatic profile creation after registration

2. **Notes Management**
   - Create, read, update, delete (CRUD) operations for travel notes
   - Each note contains title, place, dates, number of people, and key ideas
   - Search and pagination functionality with FastAPI Pagination
   - Data validation for all fields with Pydantic schemas
   - Unique constraint on title per user

3. **AI-Powered Travel Planning**
   - Integration with OpenRouter.ai for AI model access via OpenAI SDK
   - Generate detailed travel plans from notes and user preferences
   - Create, update, and manage travel plans
   - Support for both AI-generated and manual plan creation
   - Plan status management (proposal, active, archived)

### Project Architecture

The application follows Clean Architecture principles with clear separation of concerns:

#### Backend Structure

- **Apps**: Domain-specific modules (`users`, `notes`, `plans`, `utils`)
  - `api.py` - FastAPI endpoints with class-based views
  - `models/` - SQLAlchemy database models
  - `repositories/` - Data access layer with repository pattern
  - `usecases/` - Business logic and use case orchestration
  - `schemas/` - Pydantic models for API validation
  - `services/` - Domain services and business logic
  - `exceptions.py` - Domain-specific exceptions
- **Common**: Shared utilities and base classes
- **Infrastructure**: External service integrations (AI, database)

#### Frontend Structure

- **Views**: Page-level components for routing
- **Components**: Reusable UI components
- **Layouts**: Application layout wrappers
- **Stores**: Pinia state management (`auth`, `notes`, `plan`)
- **Composables**: Reusable composition functions
- **Client**: Auto-generated OpenAPI client for type-safe API calls
- **Utils**: Utility functions and API configuration

#### Key Design Patterns

- Repository pattern for data access abstraction
- Use case pattern for business logic encapsulation
- Dependency injection for testability and modularity
- OpenAPI-first development with auto-generated client
- State management with reactive stores

### Current Limitations

Current limitations as this is an MVP:

- No sharing functionality between accounts
- No advanced multimedia processing  
- No advanced logistics planning
- No password reset or email confirmation
- No real-time collaboration features
- No offline functionality
- No mobile application (web-only)

## Project Status

VibeTravels is currently in MVP development stage. The application implements core functionality to demonstrate the concept and gather user feedback.

**Key Success Metrics:**

- 90% of users complete their preference profiles
- 75% of users generate at least 3 travel plans annually

## License

This project is licensed under the MIT License - see the LICENSE file for details.
