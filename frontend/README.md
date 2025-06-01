# VibeTravels Frontend

[![Vue.js](https://img.shields.io/badge/Vue.js-3.5.13-42b883)](https://vuejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1.6-38bdf8)](https://tailwindcss.com/)
[![Flowbite](https://img.shields.io/badge/Flowbite-3.1.2-1c64f2)](https://flowbite.com/)
[![Project Status: MVP Development](https://img.shields.io/badge/Project%20Status-MVP%20Development-yellow)](https://github.com/10xdevs/vibe-travel)

## Table of Contents

- [VibeTravels Frontend](#vibetravels-frontend)
  - [Table of Contents](#table-of-contents)
  - [Project Description](#project-description)
  - [Tech Stack](#tech-stack)
  - [Environment Variables](#environment-variables)
  - [Available Scripts](#available-scripts)
  - [Project Scope](#project-scope)
    - [Core Features](#core-features)
  - [Project Status](#project-status)
  - [Development Guidelines](#development-guidelines)

## Project Description

This is the frontend application for VibeTravels - an innovative MVP designed to transform simple travel notes into detailed trip plans using AI technology. The frontend provides an intuitive user interface for managing travel notes, user profiles, and AI-generated travel plans.

VibeTravels frontend addresses key challenges in trip planning by providing:

- A clean, modern interface for creating and managing travel notes
- User profile management for saving travel preferences
- Seamless integration with AI-powered planning features
- Responsive design optimized for desktop browsers (Chrome)

## Tech Stack

The frontend is built with modern web technologies:

- **Vue.js 3**: Utilizing the Composition API for better type inference and code organization
- **Tailwind CSS 4**: Utility-first CSS framework for rapid and responsive UI development
- **Flowbite 3**: Component library built on top of Tailwind CSS for consistent UI elements
- **Vite**: Next-generation frontend tooling for fast development and optimized builds
- **ESLint & Prettier**: Code quality and formatting tools

Additional packages and integrations:

- **@hey-api/client-fetch**: API client for backend communication
- **@hey-api/openapi-ts**: OpenAPI client generator for type-safe API interactions

## Environment Variables

VibeTravels frontend uses environment variables for configuration. Create a `.env` file in the frontend directory with the following variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | URL of the backend API | <http://localhost:8000> |

For local development, you can create a `.env.local` file:

```sh
# Frontend environment variables
VITE_API_BASE_URL=http://localhost:8000
```

Note: Environment variables in Vite must be prefixed with `VITE_` to be exposed to the client-side code.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server with hot-reload |
| `npm run build` | Build the application for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint to find and fix problems in your code |
| `npm run format` | Format code using Prettier |
| `npm run generate-client` | Generate API client from OpenAPI specification |

## Project Scope

The frontend implements the following core features of the VibeTravels application:

### Core Features

1. **User Authentication**
   - Registration and login with JWT authentication
   - Session management (30-day validity)

2. **User Profile Management**
   - Travel preferences form (travel style, pace, budget)
   - Profile update functionality

3. **Notes Management**
   - Create, read, update, delete (CRUD) operations for travel notes
   - Form for note creation with validation:
     - Title (3-255 characters, unique per user)
     - Place (3-255 characters)
     - Date range (with validation)
     - Number of people (1-20)
     - Key ideas (up to 5000 characters)
   - Notes listing with search and pagination
   - Case-insensitive partial search by title

4. **AI-Powered Travel Planning**
   - Travel plan generation from notes
   - Plan review, editing, acceptance, or rejection
   - Manual plan creation option

## Project Status

VibeTravels frontend is currently in MVP development stage. The application is focused on core functionality to demonstrate the concept and gather user feedback.

Current limitations:

- No sharing functionality between accounts
- Limited browser support (Chrome only)
- No offline or mobile mode
- No password reset functionality

## Development Guidelines

When contributing to the frontend codebase, please follow these guidelines:

1. **Vue 3 Coding Standards**
   - Use the Composition API with `<script setup>` syntax
   - Leverage TypeScript for better type safety
   - Implement provide/inject for dependency injection
   - Use the Suspense component for async operations

2. **Styling Guidelines**
   - Use Tailwind utility classes directly in components
   - Create component abstractions for repeated UI patterns
   - Use the @layer directive to organize styles
   - Implement responsive design using Tailwind breakpoints
   - Leverage Flowbite components for consistency

3. **Code Quality**
   - Run linting and formatting before committing
   - Keep components small and focused on a single responsibility
   - Document complex logic with comments
   - Avoid prop drilling by using provide/inject or state management
