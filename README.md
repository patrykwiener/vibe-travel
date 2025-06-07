# VibeTravels

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Project Status: MVP Development](https://img.shields.io/badge/Project%20Status-MVP%20Development-yellow)](https://github.com/10xdevs/vibe-travel)

## Table of Contents

- [VibeTravels](#vibetravels)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Tech Stack](#tech-stack)
    - [Frontend](#frontend)
    - [Backend](#backend)
    - [AI Integration](#ai-integration)
    - [CI/CD \& Hosting](#cicd--hosting)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Setup](#setup)
  - [Available Scripts](#available-scripts)
  - [Development Setup](#development-setup)
    - [Code Quality with Pre-commit Hooks](#code-quality-with-pre-commit-hooks)
  - [Project Scope](#project-scope)
    - [Core Features](#core-features)
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
- **Vue.js 3**: Progressive JavaScript framework for building user interfaces
- **Tailwind CSS 4**: Utility-first CSS framework for rapid UI development
- **Flowbite 3**: Component library built on top of Tailwind CSS

### Backend
- **Python 3.13**: Core programming language
- **FastAPI**: High-performance web framework for building APIs
- **FastAPI Utilities**: Extension package for common FastAPI patterns
- **PostgreSQL**: Relational database for data storage
- **Docker**: Containerization for consistent development and deployment

### AI Integration
- **OpenRouter.ai**: Service providing access to various AI models (OpenAI, Anthropic, Google, etc.)
- Features cost-effective model selection and financial limit setting for API keys

### CI/CD & Hosting
- **GitHub Actions**: Automated CI/CD pipelines
- **DigitalOcean**: Cloud hosting platform using Docker images

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Git
- Make (optional but recommended)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/10xdevs/vibe-travel.git
   cd vibe-travel
   ```

2. Initialize the project using Make:
   ```bash
   make init
   ```
   This command:
   - Creates a `.env` file from the template
   - Builds Docker images
   - Starts the containers

3. Alternatively, follow these manual steps:
   ```bash
   cp -n .env.template .env
   docker compose build
   docker compose up
   ```

4. The application should now be running:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

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
| `make lint` | Run linting |
| `make lint-fix` | Fix linting issues |
| `make test [path=path/to/test]` | Run tests (optionally for specific path) |
| `make shell` | Enter backend shell |
| `make create-env` | Create .env file from template |
| `make init` | Initialize project (create .env, build images, start containers) |
| `make reset-db` | Reset the database (drops all data) |
| `make generate-openapi-client` | Generate OpenAPI client |
| `make setup-precommit` | Setup pre-commit hooks |
| `make precommit-run` | Run pre-commit hooks on all files |
| `make precommit-update` | Update pre-commit hooks |

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

### Core Features

1. **User Authentication & Profiles**
   - Registration and login with JWT authentication
   - User profile with travel preferences (travel style, pace, budget)

2. **Notes Management**
   - Create, read, update, delete (CRUD) operations for travel notes
   - Each note contains title, place, dates, number of people, and key ideas
   - Search and pagination functionality

3. **AI-Powered Travel Planning**
   - Generate detailed travel plans from notes using AI
   - Edit, accept, or reject AI-generated plans
   - Manual plan creation option

### Current Limitations

- No sharing functionality between accounts
- No advanced multimedia processing
- No advanced logistics planning
- No password reset or email confirmation
- Limited browser support (Chrome only)
- No offline or mobile mode

## Project Status

VibeTravels is currently in MVP development stage. The application implements core functionality to demonstrate the concept and gather user feedback.

**Key Success Metrics:**
- 90% of users complete their preference profiles
- 75% of users generate at least 3 travel plans annually

## License

This project is licensed under the MIT License - see the LICENSE file for details.
