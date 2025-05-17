# API Endpoint Implementation Plan: Update User Profile

## 1. Endpoint Overview
This document outlines the implementation plan for the `PUT /profile` API endpoint. This endpoint allows an authenticated user to create or update their travel profile, including their preferred travel style, pace, and budget.

## 2. Request Details
-   **HTTP Method**: `PUT`
-   **URL Path**: `/profile`
-   **Headers**:
    -   `Cookie`: Must contain a valid JWT (e.g., `fastapiusersauth=xxx`). Handled automatically by `fastapi-users` and `CookieTransport`.
    -   `Content-Type`: `application/json`
-   **Request Body (JSON)**:
    ```json
    {
        "travel_style": "ADVENTURE", // Optional, Enum: 'RELAX', 'ADVENTURE', 'CULTURE', 'PARTY', or null
        "preferred_pace": "MODERATE", // Optional, Enum: 'CALM', 'MODERATE', 'INTENSE', or null
        "budget": "MEDIUM" // Optional, Enum: 'LOW', 'MEDIUM', 'HIGH', or null
    }
    ```
-   **Parameters**:
    -   Required: None (User identified via JWT).
    -   Optional (in request body): `travel_style`, `preferred_pace`, `budget`.

## 3. Schema Definitions
-   **Input Schema**: `UserProfileInSchema` (from `backend/src/apps/users/schemas/profile.py`)
    -   Validates the structure and enum values of the request payload.
-   **Output Schema**: `UserProfileOutSchema` (from `backend/src/apps/users/schemas/profile.py`)
    -   Defines the structure of the response payload. Includes `travel_style`, `preferred_pace`, `budget`, and `updated_at`.
-   **Database Model**: `UserProfile` (to be created in `backend/src/apps/users/models/profile.py`)
    -   Maps to the `user_profile` table as defined in `db-plan.md`.
-   **Enums**:
    -   `UserTravelStyleEnum`
    -   `UserTravelPaceEnum`
    -   `UserBudgetEnum`
    (Expected to be defined in `backend/src/apps/users/enums.py` as per `db-plan.md`).

## 4. Response Details
-   **Success Response (JSON)**:
    ```json
    {
        "travel_style": "ADVENTURE",
        "preferred_pace": "MODERATE",
        "budget": "MEDIUM",
        "updated_at": "2025-05-11T10:00:00Z" // ISO 8601 format
    }
    ```
-   **Status Codes**:
    -   `200 OK`: Profile updated successfully.
    -   `201 Created`: Profile created successfully (if it didn't exist prior to the request).
    -   `400 Bad Request`: Invalid input data (e.g., invalid enum values, if custom handling is implemented to override Pydantic's 422 for this specific case).
    -   `401 Unauthorized`: User not authenticated (JWT invalid, expired, or missing).
    -   `422 Unprocessable Entity`: Validation error (e.g., Pydantic schema validation failure if request body format is incorrect or an enum value is invalid - default Pydantic behavior).
    -   `500 Internal Server Error`: Unexpected server-side error.

## 5. Data Flow
1.  Client sends a `PUT` request to `/profile` with JWT (in cookie) and JSON payload.
2.  FastAPI Users middleware authenticates the user based on the JWT. If authentication fails, a `401 Unauthorized` response is returned.
3.  The request is routed to the profile update endpoint handler (e.g., in `backend/src/apps/users/api/profile.py`).
4.  The endpoint handler validates the request payload against `UserProfileInSchema`. If validation fails, FastAPI returns a `422 Unprocessable Entity` response (or `400 Bad Request` if custom handling for enum validation is implemented).
5.  The endpoint handler retrieves the authenticated `User` object (e.g., via `Depends(fastapi_users.current_user(active=True))`).
6.  The endpoint handler calls the `UpdateUserProfileUseCase` with the validated payload and the authenticated `User` object.
7.  The `UpdateUserProfileUseCase` (e.g., in `backend/src/apps/users/usecases/profile_usecases.py`):
    a.  Attempts to fetch the existing `UserProfile` for the `user.id` using `UserProfileRepository.get_by_user_id()`.
    b.  If the profile exists, it updates the profile fields with the provided data using `UserProfileRepository.update()`. Sets a flag or determines the status for response as `200 OK`.
    c.  If the profile does not exist, it creates a new `UserProfile` associated with the `user.id` using `UserProfileRepository.create()`. Sets a flag or determines the status for response as `201 Created`.
    d.  The repository methods interact with the `UserProfile` SQLAlchemy model and the database.
    e.  The use case returns the created/updated profile data (or a DTO that can be mapped to `UserProfileOutSchema`) and the determined status code (200 or 201).
8.  The endpoint handler receives the result (profile data and status code) from the use case.
9.  The endpoint handler serializes the profile data to `UserProfileOutSchema` and returns the JSON response with the appropriate status code (200 or 201).

## 6. Security Considerations
-   **Authentication**: Handled by FastAPI Users using JWT. The endpoint must be protected and require an authenticated user.
-   **Authorization**: The core authorization logic is to ensure a user can only modify their own profile. This will be enforced in the `UpdateUserProfileUseCase` by using the `user_id` from the authenticated JWT to query and update the `UserProfile` table.
-   **Input Validation**:
    -   Pydantic schemas (`UserProfileInSchema`) will validate data types and enum values.
    -   SQLAlchemy will protect against SQL injection at the database interaction level.
-   **CSRF Protection**: Since the specification mentions "JWT in the Cookie", CSRF protection mechanisms must be in place. Review FastAPI Users documentation for built-in support or consider custom middleware if necessary.
-   **Error Handling**: Avoid leaking sensitive information in error messages. Use generic error messages for `500` errors. Log detailed errors server-side.

## 7. Error Handling
-   **Invalid Enum Values**: If Pydantic validation fails for enum values, it will raise a `ValidationError`. FastAPI typically converts this to a `422 Unprocessable Entity`. To strictly adhere to the spec's `400 Bad Request` for invalid enums, a custom exception handler for `RequestValidationError` could be implemented to check the error details and return `HTTPException(status_code=400, detail="Invalid enum value provided.")` if applicable.
-   **User Not Found (for profile)**: This scenario is handled by creating a new profile if one doesn't exist for the authenticated user. A `404 Not Found` is not applicable here for the profile itself, as the operation is create-or-update.
-   **Database Errors**: Any database operation failures (e.g., connection issues, constraint violations not caught by prior validation) should result in a `500 Internal Server Error`. These should be logged appropriately.

## 8. Performance Considerations
-   **Database Queries**: The operation involves at most one read (to check existence) and one write (create or update) to the `user_profile` table. These operations should target indexed fields (`user_id`) and are expected to be efficient.
-   **Payload Size**: The request and response payloads are small, so network latency should not be a significant concern.
-   **Concurrency**: FastAPI's `async` capabilities should be leveraged for the endpoint and any I/O-bound operations within the use case and repository to handle concurrent requests efficiently.

## 9. Implementation Steps

1.  **Define/Verify Enums (`backend/src/apps/users/enums.py`):**
    -   Ensure `UserTravelStyleEnum`, `UserTravelPaceEnum`, `UserBudgetEnum` are correctly defined as per `db-plan.md`. (These might already exist from previous migrations or need creation if this is the first use).

2.  **Create `UserProfile` SQLAlchemy Model (`backend/src/apps/users/models/profile.py`):**
    -   Define the `UserProfile` model mapping to the `user_profile` table.
    -   Columns: `id` (Integer, PK, autoincrement), `user_id` (UUID, FK to `user.id`, unique, not null), `travel_style` (SQLAlchemy Enum type referencing `user_travel_style_enum`, nullable), `preferred_pace` (SQLAlchemy Enum type referencing `user_travel_pace_enum`, nullable), `budget` (SQLAlchemy Enum type referencing `user_budget_enum`, nullable), `created_at` (TIMESTAMP WITH TIME ZONE, server_default=func.now()), `updated_at` (TIMESTAMP WITH TIME ZONE, server_default=func.now(), onupdate=func.now()).
    -   Establish a one-to-one relationship with the `User` model:
        -   In `UserProfile`: `user: Mapped['User'] = relationship(back_populates='profile')`
        -   Ensure the existing `profile` relationship in the `User` model (`backend/src/apps/users/models/user.py`) correctly points to this new `UserProfile` model (`Mapped['UserProfile'] = relationship('UserProfile', back_populates='user', uselist=False, cascade='all, delete-orphan')`).

3.  **Update Alembic for Database Migration:**
    -   Ensure the PostgreSQL ENUM types (`user_travel_style_enum`, etc.) are created in the database via an Alembic migration if they don't exist. This might be a separate, earlier migration or part of the `user_profile` table migration.
    -   Add the new `UserProfile` model to `backend/src/alembic/all_models.py` (or ensure it's discoverable).
    -   Run the project's script for generating migrations (e.g., `make makemigrations` or `alembic revision -m "create_user_profile_table"`).
    -   Review the generated migration script to ensure it correctly creates the `user_profile` table with specified columns, constraints, foreign keys, and uses the PostgreSQL ENUM types.
    -   Run the project's script for applying migrations (e.g., `make migrate` or `alembic upgrade head`).

4.  **Define/Verify Pydantic Schemas (`backend/src/apps/users/schemas/profile.py`):**
    -   Confirm `UserProfileInSchema` and `UserProfileOutSchema` are correctly defined as per the API specification and use the Python enums from `backend/src/apps/users/enums.py`. (These are already provided in context as existing).

5.  **Create `UserProfileRepository`:**
    -   **Implementation (`backend/src/apps/users/repositories/profile_repository.py` - new file or extend):**
        - update - updating the existing record of the user profile

6.  **Create `UpdateUserProfileUseCase` (`backend/src/apps/users/usecases/profile_usecases.py` - new file or extend):**
    -   Define `UpdateUserProfileUseCase`.
    -   Constructor injects `ProfileRepository`.
    -   Method: `async def execute(self, db: AsyncSession, *, current_user: User, profile_data: UserProfileInSchema) -> tuple[UserProfile, int]:` (returns profile and status code 200 or 201).
    -   Logic:
        -   Call `repository.get_by_user_id(db, user_id=current_user.id)`.
        -   If profile exists, call `repository.update(db, db_obj=existing_profile, obj_in=profile_data)`. Return (updated_profile, 200).
        -   If not, call `repository.create(db, user_id=current_user.id, obj_in=profile_data)`. Return (new_profile, 201).

7.  **Create API Endpoint (`backend/src/apps/users/api/profile.py` - new file):**
    -   Create a new FastAPI router: `router = APIRouter(prefix="/profile", tags=["User Profile"])`.
    -   Define the `PUT /` endpoint (relative to router prefix).
    -   Dependencies: `current_user: User = Depends(fastapi_users.current_user(active=True, verified=True))`, `db: AsyncSession = Depends(get_async_session)`, `use_case: UpdateUserProfileUseCase = Depends(get_update_user_profile_use_case)`. (Factory for use case needs to be defined).
    -   Endpoint logic:
        -   Call `profile, status_code = await use_case.execute(db, current_user=current_user, profile_data=payload)`.
        -   Return `JSONResponse(content=UserProfileOutSchema.model_validate(profile).model_dump(), status_code=status_code)`.
    -   Add this new router to the main app router in `backend/src/routes.py` (or `main.py` depending on project structure).

8.  **Define Dependency Injection Providers (`backend/src/dependencies.py` or a new `backend/src/apps/users/dependencies.py`):**
    -   Create factory functions for `UpdateUserProfileUseCase` and UserProfileRepository.:
        *(Adjust actual implementation based on how repository instances are typically created, e.g. if they take `db` in constructor or only in methods)*

9.  **Implement Custom Exception Handler (Optional, for 400 on Enum Validation):**
    -   If strict adherence to `400 Bad Request` for invalid enum values (instead of Pydantic's default `422`) is required:
        -   In `main.py`, add a custom exception handler for `RequestValidationError`.
        -   Inspect `exc.errors()`: if any error `type` is `enum`, return `HTTPException(status_code=400, detail="Invalid enum value provided.")`. Otherwise, use FastAPI's default handling.

10. **Documentation:**
    -   Ensure OpenAPI documentation (Swagger UI) is automatically generated by FastAPI and accurately reflects the endpoint, schemas, request body, and responses. Add `description` and `example` to Pydantic schema fields where helpful.
    -   No ADR is needed as this is an extension of existing user functionality, not a major architectural change.
    -   Internal project documentation (like this plan) is sufficient for now.

This plan provides a comprehensive guide for the development team to implement the user profile update endpoint according to the provided specifications and project structure.
