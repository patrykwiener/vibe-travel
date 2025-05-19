# API Endpoint Implementation Plan: Get Active Plan for Note

## 1. Endpoint Overview
This document outlines the implementation plan for the `GET /notes/{note_id}/plan` API endpoint. The purpose of this endpoint is to retrieve the current active travel plan associated with a specific note. An active plan is defined as the plan record with `status = 'ACTIVE'` and the most recent `updated_at` timestamp for the given note.

## 2. Request Details
-   **HTTP Method**: `GET`
-   **URL Structure**: `/notes/{note_id}/plan`
-   **Parameters**:
    -   **Path Parameters**:
        -   `note_id` (integer, **required**): The unique identifier of the note for which the active plan is being requested.
    -   **Query Parameters**: None.
-   **Request Body**: None.
-   **Headers**:
    -   `Cookie`: Must contain a valid JWT for authentication (handled by FastAPI Users).

## 3. Relevant Schemas
-   **Output Schema (`200 OK`)**: `PlanOutSchema` (from `backend/src/apps/plans/schemas/plan.py`)
    ```json
    {
        "plan_id": 1,
        "note_id": 123,
        "plan_text": "Day 1: Eiffel Tower...",
        "plan_type": "AI", 
        "plan_status": "ACTIVE", 
        "generation_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        "created_at": "2025-05-11T11:00:00Z",
        "updated_at": "2025-05-11T11:05:00Z"
    }
    ```

## 4. Response Details
-   **Success Responses**:
    -   `200 OK`: Returned when an active plan is found for the note. The response body will contain the plan details formatted according to `PlanOutSchema`.
    -   `204 No Content`: Returned if the note exists and is owned by the user, but no active plan is currently associated with it. The response body will be empty.
-   **Error Responses**:
    -   `401 Unauthorized`: If the request is not authenticated (e.g., missing or invalid JWT).
    -   `404 Not Found`:
        -   If the note specified by `note_id` does not exist.
        -   If the note exists but is not owned by the authenticated user.
    -   `500 Internal Server Error`: For unexpected server-side errors.

## 5. Data Flow
1.  The client sends a `GET` request to `/notes/{note_id}/plan` with a valid JWT in the cookie.
2.  The FastAPI application receives the request. The authentication middleware (FastAPI Users) verifies the JWT and extracts the current user.
3.  The endpoint in `backend/src/apps/plans/api.py` is invoked.
4.  The API layer calls the `GetActivePlanUseCase`, passing the `note_id` and the authenticated `user_id`.
5.  The `GetActivePlanUseCase`:
    a.  Calls the `NoteRepository` to fetch the note by `note_id` and verify that its `user_id` matches the authenticated user's ID.
    b.  If the note is not found or not owned by the user, the use case raises a specific exception (e.g., `NoteNotFoundForUserError`).
    c.  If note ownership is verified, the use case calls the `PlanRepository`'s `get_last_updated_by_note_id_and_status(note_id, PlanStatusEnum.ACTIVE)` method.
6.  The `PlanRepository` queries the database for a `Plan` record where `note_id` matches, `status` is `PlanStatusEnum.ACTIVE`, ordered by `updated_at` in descending order, and returns the first record found (or `None`).
7.  The use case returns the `Plan` object (if found) or `None` to the API layer.
8.  The API layer:
    a.  If a `Plan` object is returned, it serializes it using `PlanOutSchema` and returns a `200 OK` response.
    b.  If `None` is returned (no active plan), it returns a `204 No Content` response.
    c.  If a `NoteNotFoundForUserError` was caught, it returns a `404 Not Found` HTTP response.
    d.  Other exceptions are handled and may result in `500 Internal Server Error`.

## 6. Security Considerations
-   **Authentication**: Handled by FastAPI Users using JWT. All requests to this endpoint must be authenticated.
-   **Authorization**: Crucial. The implementation must ensure that a user can only retrieve plans for notes they own. This will be enforced by checking the `user_id` associated with the `Note` against the `user_id` from the JWT.
-   **Input Validation**: The `note_id` path parameter is validated by FastAPI as an integer. Business rule validations (note existence, ownership) occur in the use case/repository layers.
-   **Error Handling**: Return generic error messages for `4xx` and `5xx` status codes to avoid leaking sensitive information.

## 7. Performance Considerations
-   **Database Query Optimization**: The query to fetch the active plan should be efficient. It involves filtering by `note_id` (foreign key, likely indexed), `status` (enum, consider indexing if cardinality is favorable and queries are frequent), and ordering by `updated_at` (should be indexed).
-   **Data Serialization**: Pydantic handles serialization efficiently. The `PlanOutSchema` is well-defined.
-   **Caching**: If plan data is frequently accessed and doesn't change very often, caching could be considered in the future, but is likely not necessary for an MVP.

## 8. Implementation Steps
1.  **Verify/Update `PlanOutSchema`**: Ensure `backend/src/apps/plans/schemas/plan.py` contains the correct `PlanOutSchema` matching the API specification. (Already provided and seems correct).
2.  **Implement `NoteRepository` Method (if not existing)**:
    -   In `backend/src/apps/notes/repositories/note_repository.py`, ensure a method exists to fetch a note by its ID and verify ownership by `user_id`.
    -   Example: `async def get_by_id(self, db: AsyncSession, *, note_id: int, user_id: UUID) -> Note | None:`
3.  **Implement `PlanRepository` Method**:
    -   In `backend/src/apps/plans/repositories/plan_repository.py`, create the method `async def get_last_updated_by_note_id_and_status(self, note_id: int, status: PlanStatusEnum) -> Plan | None:`.
    -   This method will query the `Plan` table:
        -   Filter by `note_id`.
        -   Filter by `status == PlanStatusEnum.ACTIVE`.
        -   Order by `updated_at` descending.
        -   Return the first result or `None`.
4.  **Implement DTOs for Usecase**:
    -   Ensure `GetActivePlanInDTO` and `GetActivePlanOutDTO` are defined in `backend/src/apps/plans/usecases/dto/plan_dtos.py. Add if necessary.
4.  **Implement Use Case**:
    -   Create `backend/src/apps/plans/usecases/get_active_plan_use_case.py`.
    -   Define `GetActivePlanUseCase` with a method like `async def execute(self, *, note_id: int, user_id: UUID) -> Plan | None:`.
    -   This use case will:
        -   Inject `NoteRepository` and `PlanRepository`.
        -   Call the `NoteRepository` method to verify note existence and ownership. Raise a custom exception (e.g., `NoteNotFoundForUserError` defined in `plans/exceptions.py` or `notes/exceptions.py`) if validation fails.
        -   If note is valid, call `PlanRepository.get_last_updated_by_note_id_and_status(note_id, PlanStatusEnum.ACTIVE)`.
        -   Return the result.
5.  **Implement API Endpoint**:
    -   In `backend/src/apps/plans/api.py`, add a new FastAPI path operation. (Refer to the detailed example in the analysis section for the structure).
    -   Ensure proper dependency injection for `AsyncSession`, `current_user`, and the use case (if using DI for use cases).
    -   Handle the `NoteNotFoundForUserError` and map it to `HTTPException(status_code=404)`.
    -   Return `Response(status_code=204)` if the use case returns `None` (no active plan).
6.  **Define Custom Exceptions**:
    -   Ensure `NoteNotFoundForUserError` (or a similar, appropriately named exception like `NoteAccessDeniedError`) is defined (e.g., in `backend/src/apps/notes/exceptions.py` or a common `exceptions.py`) and inherits from a suitable base (e.g. `Exception`).
7.  **Register Router**:
    -   Ensure the `plans` router (from `backend/src/apps/plans/api.py`) is included in the main application router (`backend/src/routes.py`).
8.  **Update API Documentation**:
    -   Ensure the OpenAPI documentation (auto-generated by FastAPI) accurately reflects the endpoint, its parameters, responses, and schemas. Add descriptions and examples where necessary in the endpoint decorator.
