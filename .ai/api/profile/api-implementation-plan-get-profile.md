# API Endpoint Implementation Plan: GET /profile
## 1. Endpoint Overview
The purpose of this endpoint is to allow authenticated users to retrieve their travel profile. The profile includes preferences such as travel style, preferred pace, and budget.

## 2. Request Details
-   **HTTP Method**: `GET`
-   **URL Structure**: `/profile`
-   **Parameters**:
    -   Required: None (user identification based on JWT in Cookie).
    -   Optional: None.
-   **Request Body**: None.
-   **Headers**:
    -   `Cookie`: Must contain a valid JWT (e.g., `fastapiusersauth=xxx`). Handled automatically by `fastapi-users` and `CookieTransport`.

## 3. Types Used
-   **Response Schema (Pydantic)**:
    -   `UserProfileOutSchema` (from `backend/src/apps/users/schemas/profile.py`):
        ```python
        class UserProfileOutSchema(BaseModel):
            travel_style: UserTravelStyleEnum | None
            preferred_pace: UserTravelPaceEnum | None
            budget: UserBudgetEnum | None
            updated_at: datetime
        ```
-   **SQLAlchemy Models**:
    -   `User` (from `backend/src/apps/users/models/user.py`)
    -   `UserProfile` (from `backend/src/apps/users/models/profile.py`)
-   **Custom Exceptions**:
    -   `ProfileNotFoundException` (to be defined in `backend/src/apps/users/exceptions.py`)

## 4. Response Details
-   **Success Response (200 OK)**:
    ```json
    {
        "travel_style": "ADVENTURE",
        "preferred_pace": "MODERATE",
        "budget": "MEDIUM",
        "updated_at": "2025-05-11T10:00:00Z"
    }
    ```
    Or with `null` values if not set:
    ```json
    {
        "travel_style": null,
        "preferred_pace": null,
        "budget": null,
        "updated_at": "2025-05-10T09:00:00Z" // Profile creation/last update time, even if empty
    }
    ```
-   **Error Responses**:
    -   `401 Unauthorized`: If the user is not authenticated.
        ```json
        {
            "detail": "Not authenticated" // Or standard fastapi-users response
        }
        ```
    -   `404 Not Found`: If the user profile does not exist.
        ```json
        {
            "detail": "User profile not found."
        }
        ```

## 5. Data Flow
1.  The client sends a `GET /profile` request with a valid JWT in the Cookie.
2.  `fastapi-users` verifies the JWT and provides the `User` object (`current_active_user`).
3.  The API layer (`api.py`) receives the request and calls `GetUserProfileUseCase`, passing the `user_id` from `current_active_user`.
4.  `GetUserProfileUseCase` uses the injected `UserProfileRepository` to retrieve the `UserProfile` based on `user_id`.
5.  `UserProfileRepository` executes a query to the PostgreSQL database to find the corresponding record in the `user_profile` table.
6.  If the `UserProfile` record is found, it is returned to `GetUserProfileUseCase`.
7.  If the record is not found, `UserProfileRepository` returns `None`. `GetUserProfileUseCase` catches this and raises `ProfileNotFoundException`.
8.  `GetUserProfileUseCase` returns the `UserProfile` model (if found) to the API layer.
9.  The API layer maps the `UserProfile` model to the `UserProfileOutSchema` schema.
10. If `ProfileNotFoundException` was raised, the API layer returns a `404 Not Found` response.
11. Otherwise, the API layer returns a `200 OK` response with the profile data in JSON format.

## 6. Security Considerations
-   **Authentication**: Ensured by `fastapi-users` using JWTs passed in `HttpOnly`, `Secure` (in production environment) cookies. The JWT secret must be strong and properly managed.
-   **Authorization**: Users can only access their own profile. This is achieved by using `current_active_user` provided by `fastapi-users` and retrieving the profile based on `current_active_user.id`.
-   **Data Validation**: Not directly applicable to user input for this GET endpoint. Returned data conforms to the `UserProfileOutSchema`.

## 7. Error Handling
-   **`401 Unauthorized`**: Handled automatically by `fastapi-users` when the JWT token is absent, invalid, or expired.
-   **`404 Not Found`**: Returned when `GetUserProfileUseCase` raises `ProfileNotFoundException` (meaning the repository did not find a profile for the given `user_id`). A global or local exception handler for `ProfileNotFoundException` should be implemented to return the appropriate status and message.
-   **`500 Internal Server Error`**: General server errors (e.g., database issues) should be logged, and the client should receive a generic error response. FastAPI handles unhandled exceptions as 500 by default.

## 8. Performance Considerations
-   The database query to retrieve the user profile is simple (select by indexed foreign key `user_id`) and should be efficient.
-   Ensure that the SQLAlchemy session is managed correctly (e.g., closed after each request), which is standard practice in FastAPI with `Depends(get_async_session)`.
-   For a very high number of requests, application-level caching could be considered, but for an MVP, this is likely overkill.

## 9. Implementation Steps

1.  **Create Custom Exception**:
    *   In the file `backend/src/apps/users/exceptions.py`, define `ProfileNotFoundException`:
        ```python
        class ProfileNotFoundException(Exception):
            """Raised when a user profile is not found."""
            pass
        ```

2.  **Implement Repository (`UserProfileRepository`)**:
    *   Create the file `backend/src/apps/users/repositories/profile_repository.py`.
    *   Define the `UserProfileRepository` class.

3.  **Implement Use Case (`GetUserProfileUseCase`)**:
    *   Create the file `backend/src/apps/users/usecases/profile_usecases.py`.
    *   Define the `GetUserProfileUseCase` class.

4.  **Update API Endpoint (`api.py` in `users`)**:
    *   In the file `backend/src/apps/users/api.py` (or a dedicated router file for profile, if it exists).
    *   Add the `GET /profile` endpoint using a Class-Based View.

5.  **Register Router**:
    *   In `backend/src/main.py` or `backend/src/routes.py` (according to project structure), add `profile_router` to the main FastAPI application router.
        Or if `api.py` in `users` contains all user paths, ensure this router is included.

6.  **Dependencies**:
    *   Ensure `get_async_session` is correctly defined in `src/database.py`.
    *   `current_active_user` is already defined in `src/apps/users/auth.py`.
    *   Factories for the repository and use case have been added in `api.py` for clarity of dependency injection.

7.  **API Documentation**:
    *   FastAPI will automatically generate OpenAPI documentation (Swagger UI / ReDoc) based on the endpoint definition, Pydantic schemas, and docstrings. Ensure descriptions are clear.

This plan should provide comprehensive guidance for the development team to implement the `GET /profile` endpoint.
