# AI Rules for VibeTravels

VibeTravels to aplikacja MVP służąca do planowania angażujących wycieczek poprzez zamianę prostych notatek w szczegółowe
plany podróży z wykorzystaniem AI. Podstawowe funkcje obejmują zarządzanie notatkami, profil użytkownika z preferencjami
turystycznymi oraz integrację z silnikiem AI (OpenRouter).

## Tech stack

- Frontend:
    - Vue.js 3
    - Tailwind 4
    - Flowbite 3
    - Typescript
- Backend:
    - Python 3.13
    - FastAPI with FastAPI Utilities, FastAPI Users, FastAPI Pagination
    - Docker
    - PostgreSQL
- AI - Komunikacja z modelami przez usługę Openrouter.ai:
    - OpenAI SDK

## Project Strcture

When introducing changes to the project, please follow the structure outlined below. This will help maintain consistency and organization throughout the codebase.

* ./backend - Backend codebase (FastAPI).
    * ./backend/src - Backend source code.
      * ./backend/src/alembic - Alembic migrations (Database schema evolution).
      * ./backend/src/apps - Application-specific/Domain modules.
          * ./backend/src/apps/{app_name}/api.py - API endpoints (FastAPI routers/operations) for this app. Responsible for request/response handling and calling the use case layer.
          * ./backend/src/apps/{app_name}/models/ - Database models (e.g., SQLAlchemy models).
          * ./backend/src/apps/{app_name}/repositories/ - Data access logic (abstracting database interactions for CRUD operations).
          * ./backend/src/apps/{app_name}/usecases/ - Business logic / Application layer commands and queries. Orchestrates interactions between repositories, services, etc.
            * ./backend/src/apps/{app_name}/usecases/dto/ - Data Transfer Objects (DTOs) used by use cases.
          * ./backend/src/apps/{app_name}/services/ - Domain services that don't fit repositories (e.g., complex calculations *not* part of core use case orchestration).
          * ./backend/src/apps/{app_name}/schemas/ - Pydantic models for API request validation and response serialization.
          * ./backend/src/apps/{app_name}/exceptions.py - Application-specific custom exceptions.
          * ./backend/src/apps/{app_name}/utils.py - Utility functions specific to this application module.
      * ./backend/src/common/ - Shared modules/utilities used across multiple applications/domains (e.g., common helpers, shared base classes).
      * ./backend/src/config.py - Backend configuration loading and management (potentially using Pydantic Settings).
      * ./backend/src/database.py - Database session/connection setup and management logic. Provides dependencies for database sessions.
      * ./backend/src/dependencies/ - Central place for defining common dependency injection providers (e.g., getting current user, getting database session, factory functions for use cases/repositories).
      * ./backend/src/exceptions/ - Global custom exception types for the entire backend.
      * ./backend/src/middleware/ - FastAPI middleware for processing requests globally (e.g., logging, CORS, security checks, request ID).
      * ./backend/src/security/ - Authentication and Authorization logic (e.g., token handling, password hashing, permission checks, user management utilities).
      * ./backend/src/services/ - Global or infrastructure services used across the application (similar role to app-specific services, but at a higher level or for cross-cutting concerns). *Consider consolidating app-specific and global services if their roles overlap significantly.*
      * ./backend/src/tasks/ - Code for background tasks or workers (if needed for async processing outside the request cycle).
      * ./backend/src/main.py - Backend entry point. Instantiates the FastAPI application, includes routers, applies middleware, sets up event handlers (startup/shutdown).
      * ./backend/src/routers.py - Main API router where all application-specific `api.py` routers are included.
    * ./backend/tests - Backend tests.
        * ./backend/tests/conftest.py - Global test fixtures (e.g., test database setup, client).
        * ./backend/tests/unit/ - Unit tests (testing individual components in isolation, often using mocks).
        * ./backend/tests/integration/ - Integration tests (testing interactions between components, e.g., use case with repository, API with use case).
        * ./backend/tests/e2e/ - End-to-end tests (testing full request/response cycles - optional, might live outside `backend/`).
        * ./backend/tests/utils.py - Test-specific utility functions/helpers.
    * ./backend/scripts - Backend utility scripts (e.g., initial setup, data seeding, custom management commands).
* ./frontend - Frontend codebase (Vue.js).
    * ./frontend/src - Frontend source code.
      * ./frontend/src/assets - Static assets.
      * ./frontend/src/client - OpenAPI-generated API client (from backend OpenAPI spec).
      * ./frontend/src/components - Vue.js components.
      * ./frontend/src/composables - Vue.js composables (reusable logic).
      * ./frontend/src/layouts - Vue.js layouts (e.g., AuthLayout, BaseLayout).
      * ./frontend/src/router - Vue Router configuration.
      * ./frontend/src/store - Vuex store (state management).
        * ./frontend/src/store/auth - Authentication store (manages user session, login, registration).
        * ./frontend/src/store/notes - Notes store (manages notes state).
        * ./frontend/src/store/profile - User profile store (manages user preferences).
      * ./frontend/src/utils - Utility functions and helpers like API configuration, error handling, etc.
      * ./frontend/src/views - Vue.js views/pages.
* ./docs - Documentation (ADRs, API docs).
    * ./docs/adr - Architecture Decision Records (ADRs).
* ./scripts - Utility scripts (migrations, tasks).

## CODING_PRACTICES

### Guidelines for SUPPORT_LEVEL

#### SUPPORT_BEGINNER

- When running in agent mode, execute up to 3 actions at a time and ask for approval or course correction afterwards.
- Write code with clear variable names and include explanatory comments for non-obvious logic. Avoid shorthand syntax
  and complex patterns.
- Provide full implementations rather than partial snippets. Include import statements, required dependencies, and
  initialization code.
- Add defensive coding patterns and clear error handling. Include validation for user inputs and explicit type checking.
- Suggest simpler solutions first, then offer more optimized versions with explanations of the trade-offs.
- Briefly explain why certain approaches are used and link to relevant documentation or learning resources.
- When suggesting fixes for errors, explain the root cause and how the solution addresses it to build understanding. Ask
  for confirmation before proceeding.
- Offer introducing basic test cases that demonstrate how the code works and common edge cases to consider.

### Guidelines for DOCUMENTATION

#### DOC_UPDATES

- Update relevant documentation in /docs when modifying features
- Keep README.md in sync with new capabilities but always ask for confirmation before making changes
- Maintain changelog entries in CHANGELOG.md but always ask for confirmation before making changes

### Guidelines for ARCHITECTURE

#### ADR

- Create ADRs in /docs/adr/{name}.md for:
-
    1) Major dependency changes
-
    2) Architectural pattern changes
-
    3) New integration patterns
-
    4) Database schema changes

#### CLEAN_ARCHITECTURE

- Strictly separate code into layers: models, use cases, interfaces, and frameworks
- Ensure dependencies point inward, with inner layers having no knowledge of outer layers
- Implement domain entities that encapsulate {{business_rules}} without framework dependencies
- Use interfaces (ports) and implementations (adapters) to isolate external dependencies
- Create use cases that orchestrate entity interactions for specific business operations
- Implement mappers to transform data between layers to maintain separation of concerns
- Ensure that each layer has a clear responsibility and adheres to the Single Responsibility Principle

#### DDD

- Define bounded contexts to separate different parts of the domain with clear boundaries
- Implement ubiquitous language within each context to align code with business terminology
- Create rich domain models with behavior, not just data structures, for {{core_domain_entities}}
- Use value objects for concepts with no identity but defined by their attributes
- Implement domain events to communicate between bounded contexts
- Use aggregates to enforce consistency boundaries and transactional integrity

# BACKEND

### CLEAN_ARCHITECTURE

- Use the repository pattern to abstract data access and provide a clean interface for data operations. 
  Repositories methods should explicitly require model fields values as arguments in order to avoid passing 
  a dictionary or object with all fields.
- Repositories should be responsible for data access and persistence, while use cases should handle business logic
  and coordinate between repositories and entities
- Implement the service layer to encapsulate business logic and coordinate between repositories and use cases
- Use dependency injection to manage dependencies and improve testability
- Use use cases to encapsulate specific business operations and orchestrate interactions between entities and
  repositories
- Implement DTOs to transfer data between layers and ensure separation of concerns. Usercases should return DTOs
  and expect DTOs as input.
- Database related custom exceptions should be raises in the repository layer and can be caught in the use case
  layer or propagate further. Use cases should raise application specific exceptions that are caught in the API 
  layer and converted to HTTPException with appropriate status codes.

### Guidelines for STATIC_ANALYSIS

- Configure project-specific rules in pyproject.toml to enforce consistent coding standards
- Use ruff for static analysis and linting
- Implement custom rules for {{project_specific_patterns}} to maintain codebase consistency
- Use the --fix flag in CI/CD pipelines to automatically correct fixable issues
- Implement staged linting with husky and lint-staged to prevent committing non-compliant code

### Guidelines for PYTHON

#### FASTAPI

- Use Pydantic models for request and response validation with strict type checking and custom validators
- Implement dependency injection for services and database sessions to improve testability and resource management
- Use async endpoints for I/O-bound operations to improve throughput for {{high_load_endpoints}}
- Leverage FastAPI's background tasks for non-critical operations that don't need to block the response
- Implement proper exception handling with HTTPException and custom exception handlers for {{error_scenarios}}
- Custom exceptions should inherit from Base*Error and Exception classes to maintain a consistent error hierarchy. 
- Custom exceptions should be caught in api.py and converted to HTTPException with appropriate status codes.
- Use path operation decorators consistently with appropriate HTTP methods (GET for retrieval, POST for creation, etc.)
- Use FastAPI's built-in support for OpenAPI and Swagger UI to document endpoints and provide interactive API
  documentation
- Use FastAPI Utilities for common patterns like authentication, authorization, CORS handling, class-based views, and
  middleware
- Ensure that all endpoints are properly documented with descriptions and examples for better usability
- Use FastAPI's dependency injection system to manage shared resources like database sessions and authentication
- Name FastAPI schemas in a way that reflects their purpose with suffixes "InSchema" for input and "OutSchema" for
  output e.g. UserCreateInSchema, UserUpdateInSchema, UserOutSchema
- Use FastAPI's built-in support for filtering to handle large datasets efficiently
- Use FastAPI Pagination for paginated responses (offset-based) to improve performance and reduce data transfer

## TESTING

### Guidelines for UNIT

#### PYTEST

- Use fixtures for test setup and dependency injection
- Implement parameterized tests for testing multiple inputs for {{function_types}}
- Use unittest.mock.MagicMock, patch, and patch.object for mocking dependencies
- Use pytest function based approach. Don't create classes for tests unless necessary
- Use pytest.mark.parametrize for parameterized tests

# FRONTEND

### Guidelines for VUE 3

#### VUE_CODING_STANDARDS

- Use the Composition API instead of the Options API for better type inference and code reuse
- Implement <script setup> for more concise component definitions
- Use Suspense and async components for handling loading states during code-splitting
- Leverage the defineProps and defineEmits macros for type-safe props and events
- Use the new defineOptions for additional component options
- Implement provide/inject for dependency injection instead of prop drilling in deeply nested components
- Use the Teleport component for portal-like functionality to render UI elsewhere in the DOM
- Leverage ref over reactive for primitive values to avoid unintended unwrapping
- Use v-memo for performance optimization in render-heavy list rendering scenarios
- Implement shallow refs for large objects that don't need deep reactivity

### Guidelines for STYLING

#### TAILWIND

- Use the @layer directive to organize styles into components, utilities, and base layers
- Implement Just-in-Time (JIT) mode for development efficiency and smaller CSS bundles
- Use arbitrary values with square brackets (e.g., w-[123px]) for precise one-off designs
- Leverage the @apply directive in component classes to reuse utility combinations
- Implement the Tailwind configuration file for customizing theme, plugins, and variants
- Use component extraction for repeated UI patterns instead of copying utility classes
- Leverage the theme() function in CSS for accessing Tailwind theme values
- Implement dark mode with the dark: variant
- Use responsive variants (sm:, md:, lg:, etc.) for adaptive designs
- Leverage state variants (hover:, focus:, active:, etc.) for interactive elements

#### FLOWBITE

- Use Flowbite components for pre-built UI elements and patterns
- Implement Flowbite's utility classes for consistent styling and spacing
- Leverage Flowbite's theming capabilities for consistent branding
- Use Flowbite's documentation and examples for reference and best practices
- Implement Flowbite's Typescript components for interactive elements

## TESTING

### Guidelines for UNIT

#### VITEST

- Leverage the `vi` object for test doubles - Use `vi.fn()` for function mocks, `vi.spyOn()` to monitor existing functions, and `vi.stubGlobal()` for global mocks. Prefer spies over mocks when you only need to verify interactions without changing behavior.
- Master `vi.mock()` factory patterns - Place mock factory functions at the top level of your test file, return typed mock implementations, and use `mockImplementation()` or `mockReturnValue()` for dynamic control during tests. Remember the factory runs before imports are processed.
- Create setup files for reusable configuration - Define global mocks, custom matchers, and environment setup in dedicated files referenced in your `vitest.config.ts`. This keeps your test files clean while ensuring consistent test environments.
- Use inline snapshots for readable assertions - Replace complex equality checks with `expect(value).toMatchInlineSnapshot()` to capture expected output directly in your test file, making changes more visible in code reviews.
- Monitor coverage with purpose and only when asked - Configure coverage thresholds in `vitest.config.ts` to ensure critical code paths are tested, but focus on meaningful tests rather than arbitrary coverage percentages.
- Make watch mode part of your workflow - Run `vitest --watch` during development for instant feedback as you modify code, filtering tests with `-t` to focus on specific areas under development.
- Explore UI mode for complex test suites - Use `vitest --ui` to visually navigate large test suites, inspect test results, and debug failures more efficiently during development.
- Handle optional dependencies with smart mocking - Use conditional mocking to test code with optional dependencies by implementing `vi.mock()` with the factory pattern for modules that might not be available in all environments.
- Configure jsdom for DOM testing - Set `environment: 'jsdom'` in your configuration for frontend component tests and combine with testing-library utilities for realistic user interaction simulation.
- Structure tests for maintainability - Group related tests with descriptive `describe` blocks, use explicit assertion messages, and follow the Arrange-Act-Assert pattern to make tests self-documenting.
- Leverage TypeScript type checking in tests - Enable strict typing in your tests to catch type errors early, use `expectTypeOf()` for type-level assertions, and ensure mocks preserve the original type signatures.

# Docker Best Practices for Modern Web Applications

## Dockerfile Structure

### Naming and Conventions
- Always use UPPERCASED keywords

### Base Image Selection
- Always use specific version tags matching tech stack (e.g., `node:22-alpine` not `node:latest`)
- Use images compatible with CI/CD & Github Actions runner - `ubuntu-latest`
- Choose slim/alpine variants for production images
- Use two-stage builds to separate build and runtime environments
- Analyze deps and scripts that may cause issues when switching between build and runtime step (i.e. devDependency required in "prepare", but not installed)

### Instruction Order
1. FROM - Base image definition
2. ARG - Build-time variables (can also appear before FROM)
3. LABEL - Image metadata
4. ENV - Environment variables
5. WORKDIR - Set working directory
6. RUN - Execute commands
7. COPY - Add files from build context
8. USER - Switch to non-root user
9. EXPOSE - Document ports
10. HEALTHCHECK - Container health monitoring
11. CMD - Default command

### Essential Security Practices
- Run containers as non-root users
- Never store secrets or credentials in images
- Set appropriate file permissions
- Use COPY instead of ADD for predictable behavior
- Scan images for vulnerabilities before deployment

### Optimization Essentials
- Use .dockerignore to exclude unnecessary files
- Order instructions by change frequency (least frequent first)
- Cache dependency installation separately from application code
- Copy only what's needed in multi-stage builds using `--from`
- Clean up package manager caches in the same layer they're created

### Health & Monitoring
- Always implement HEALTHCHECK instructions
- Configure logging to stdout/stderr
- Document exposed ports with EXPOSE instruction

## Docker Commands

### Building
- Use versioning based on commit SHA for image tags
- Add metadata with labels
- Enable BuildKit for better performance
- Always build app in production mode based on provided tech stack
- Ask if `node_modules` directory is required in runtime

### Running
- Set appropriate resource limits
- Use read-only filesystem when possible
- Name containers for easier management

### Docker Compose
- Use version '3' or higher syntax
- Define networks explicitly
- Set appropriate restart policies
