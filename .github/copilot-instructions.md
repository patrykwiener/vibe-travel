# AI Rules for VibeTravels

VibeTravels to aplikacja MVP służąca do planowania angażujących wycieczek poprzez zamianę prostych notatek w szczegółowe plany podróży z wykorzystaniem AI. Podstawowe funkcje obejmują zarządzanie notatkami, profil użytkownika z preferencjami turystycznymi oraz integrację z silnikiem AI (OpenRouter).

## Tech stack

- Frontend:
  - Vue.js 3
  - Tailwind 4
  - Flowbite 3
- Backend:
    - Python 3.13
    - FastAPI with FastAPI Utilities and FastAPI Users
    - Docker
    - PostgreSQL
- AI - Komunikacja z modelami przez usługę Openrouter.ai:

## Project Strcture

When introducing changes to the project, please follow the structure outlined below. This will help maintain consistency and organization throughout the codebase.

* ./backend - Contains the backend codebase, including FastAPI application and related files.
   * ./backend/src - Contains the source code for the backend application.
     * /backend/src/alembic - Contains Alembic migration files for database schema changes.
     * ./backend/src/apps - Contains application-specific code, including routers, services, and models.
        * ./backend/src/apps/{app_name}/api.py - Contains the API endpoints for the application.
        * ./backend/src/apps/{app_name}/models.py - Contains the data models for the application.
        * ./backend/src/apps/{app_name}/repositories.py - Contains the repository classes for the application.
        * ./backend/src/apps/{app_name}/usecases.py - Contains the use case classes for the application implementing business logic.
        * ./backend/src/apps/{app_name}/services.py - Contains the business logic and service layer for the application.
        * ./backend/src/apps/{app_name}/schemas.py - Contains the Pydantic schemas for request and response validation.
        * ./backend/src/apps/{app_name}/utils.py - Contains utility functions and helpers for the application.
     * ./backend/src/config.py - Contains configuration settings for the backend application.
     * ./backend/src/main.py - The entry point for the backend application.
     * ./backend/src/routers.py - Contains the API main routers for the backend application.
   * ./backend/tests - Contains unit tests for the backend application.
      * ./backend/tests/{app_name}/unit - Contains unit tests for the backend application.
      * ./backend/tests/{app_name}/integration - Contains integration tests for the backend application.
   * ./backend/scripts - utility script for running the backend application
* ./frontend - Contains the frontend codebase, including Vue.js application and related files.
   * ./frontend/src - Contains the source code for the frontend application.
     * ./frontend/src/components - Contains reusable Vue.js components.
     * ./frontend/src/views - Contains Vue.js views and pages.
     * ./frontend/src/router - Contains Vue Router configuration and routes.
     * ./frontend/src/assets - Contains static assets like images and stylesheets.
* ./docs - Contains documentation files, including architecture decision records (ADRs), API documentation, and other relevant information.
   * ./docs/adr - Contains architecture decision records (ADRs) for the project.
* ./scripts - Contains utility scripts for running the application, database migrations, and other tasks.

## CODING_PRACTICES

### Guidelines for SUPPORT_LEVEL

#### SUPPORT_BEGINNER

- When running in agent mode, execute up to 3 actions at a time and ask for approval or course correction afterwards.
- Write code with clear variable names and include explanatory comments for non-obvious logic. Avoid shorthand syntax and complex patterns.
- Provide full implementations rather than partial snippets. Include import statements, required dependencies, and initialization code.
- Add defensive coding patterns and clear error handling. Include validation for user inputs and explicit type checking.
- Suggest simpler solutions first, then offer more optimized versions with explanations of the trade-offs.
- Briefly explain why certain approaches are used and link to relevant documentation or learning resources.
- When suggesting fixes for errors, explain the root cause and how the solution addresses it to build understanding. Ask for confirmation before proceeding.
- Offer introducing basic test cases that demonstrate how the code works and common edge cases to consider.

### Guidelines for DOCUMENTATION

#### DOC_UPDATES

- Update relevant documentation in /docs when modifying features
- Keep README.md in sync with new capabilities but always ask for confirmation before making changes
- Maintain changelog entries in CHANGELOG.md but always ask for confirmation before making changes

### Guidelines for ARCHITECTURE

#### ADR

- Create ADRs in /docs/adr/{name}.md for:
- 1) Major dependency changes
- 2) Architectural pattern changes
- 3) New integration patterns
- 4) Database schema changes

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
- Use the repository pattern to abstract data access and provide a clean interface for data operations
- Implement the service layer to encapsulate business logic and coordinate between repositories and use cases
- Use dependency injection to manage dependencies and improve testability
- Use queries for db data retrieval operations to separate query logic from business logic
- Use use cases to encapsulate specific business operations and orchestrate interactions between entities and repositories

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
- Use path operation decorators consistently with appropriate HTTP methods (GET for retrieval, POST for creation, etc.)
- Use FastAPI's built-in support for OpenAPI and Swagger UI to document endpoints and provide interactive API documentation
- Use FastAPI Utilities for common patterns like authentication, authorization, CORS handling, class-based views, and middleware
- Ensure that all endpoints are properly documented with descriptions and examples for better usability
- Use FastAPI's dependency injection system to manage shared resources like database sessions and authentication
- Name FastAPI schemas in a way that reflects their purpose with suffixes "InSchema" for input and "OutSchema" for output e.g. UserCreateInSchema, UserUpdateInSchema, UserOutSchema

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
- Implement Flowbite's JavaScript components for interactive elements