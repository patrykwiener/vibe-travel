# API Endpoint Implementation Plan: Get Note Details

## 1. Endpoint Overview
This document outlines the implementation plan for the `GET /notes/{note_id}` API endpoint. The purpose of this endpoint is to allow an authenticated user to retrieve the details of a specific travel note they own.

## 2. Request Details
-   **HTTP Method**: `GET`
-   **URL Path**: `/notes/{note_id}`
-   **Path Parameters**:
    -   `note_id` (integer, required): The unique identifier of the travel note to retrieve.
-   **Query Parameters**: None
-   **Request Body**: None
-   **Headers**:
    -   `Cookie`: Must contain a valid JWT for authentication (handled by FastAPI Users).

## 3. Data Transfer Objects (DTOs) and Schemas
-   **Input DTO (Use Case Layer)**:
    -   `GetNoteInDTO`:
        -   `note_id: int`
        -   `current_user_id: uuid.UUID`
-   **Output DTO (Use Case Layer)**:
    -   The use case will return the `Note` SQLAlchemy model instance directly, or a `GetNoteOutDTO` Pydantic model that mirrors the `Note` model structure.
-   **Output Schema (API Layer)**:
    -   `NoteOutSchema` (as defined in `src.apps.notes.schemas.note.py`):
        ```json
        {
            "id": 123,
            "user_id": "user-uuid-string",
            "title": "Trip to Paris",
            "place": "Paris, France",
            "date_from": "2025-07-10",
            "date_to": "2025-07-15",
            "number_of_people": 2,
            "key_ideas": "Eiffel Tower, Louvre Museum, Seine River cruise",
            "created_at": "2025-05-11T10:00:00Z",
            "updated_at": "2025-05-11T10:00:00Z"
        }
        ```

## 4. Response Details
-   **Success Response**:
    -   **Code**: `200 OK`
    -   **Body**: A JSON object matching the `NoteOutSchema` containing the details of the requested note.
-   **Error Responses**:
    -   **Code**: `401 Unauthorized`
        -   **Body**: Standard FastAPI Users error response for authentication failure.
        -   **Reason**: JWT is missing, invalid, or expired.
    -   **Code**: `403 Forbidden`
        -   **Body**: `{"detail": "User does not have permission to access this note."}` (or similar)
        -   **Reason**: The authenticated user does not own the requested note.
    -   **Code**: `404 Not Found`
        -   **Body**: `{"detail": "Note with ID {note_id} not found."}` (or similar)
        -   **Reason**: No note exists with the provided `note_id`.
    -   **Code**: `500 Internal Server Error`
        -   **Body**: Standard FastAPI error response.
        -   **Reason**: Unexpected server-side error.

## 5. Data Flow
1.  The client sends a `GET` request to `/notes/{note_id}` with a valid JWT in the cookie.
2.  FastAPI Users middleware verifies the JWT and populates `current_active_user`. If authentication fails, a `401 Unauthorized` response is returned.
3.  The request is routed to the `get_note_by_id` method in `NoteCBV` within `src.apps.notes.api.py`.
4.  The API method constructs a `GetNoteInDTO` containing `note_id` (from path) and `current_user.id`.
5.  The API method calls the `execute` method of the injected `GetNoteUseCase` with the `GetNoteInDTO`.
6.  The `GetNoteUseCase`:
    a.  Calls the `NoteRepository.get_by_id(note_id)` method to fetch the note from the database.
    b.  If the repository returns `None` (note not found), the use case raises a `NoteNotFoundError` custom exception.
    c.  If the note is found, it checks if `note.user_id` matches `current_user_id` from the DTO.
    d.  If the IDs do not match, the use case raises a `NotePermissionError` custom exception.
    e.  If checks pass, the use case returns the `Note` object (or `GetNoteOutDTO`).
7.  Back in the API method:
    a.  If `NoteNotFoundError` was raised, it's caught and re-raised as an `HTTPException` with status `404 Not Found`.
    b.  If `NotePermissionError` was raised, it's caught and re-raised as an `HTTPException` with status `403 Forbidden`.
    c.  If successful, the `Note` object returned by the use case is validated and serialized using `NoteOutSchema`.
8.  The serialized JSON response with a `200 OK` status is sent back to the client.

## 6. Security Considerations
-   **Authentication**: Handled by FastAPI Users using JWT. The `current_active_user` dependency ensures that only authenticated users can attempt to access the endpoint.
-   **Authorization**: Implemented within the `GetNoteUseCase` by verifying that the `user_id` associated with the note matches the `id` of the authenticated user. This prevents users from accessing notes they do not own (mitigates IDOR).
-   **Input Validation**:
    -   `note_id` path parameter type is validated by FastAPI.
    -   Business logic validation (existence of note, ownership) is handled in the use case.
-   **Data Exposure**: The `NoteOutSchema` defines the fields returned to the client, ensuring no sensitive or unnecessary data is exposed.

## 7. Error Handling
-   **`NoteNotFoundError`**: Custom exception to be defined in `src.apps.notes.exceptions.py`. Raised by the use case when a note with the given ID is not found. Caught in `api.py` and converted to `HTTPException(status_code=404)`.
-   **`NotePermissionError`**: Custom exception to be defined in `src.apps.notes.exceptions.py`. Raised by the use case when an authenticated user tries to access a note they do not own. Caught in `api.py` and converted to `HTTPException(status_code=403)`.
-   Standard FastAPI error handling will manage other exceptions, returning appropriate HTTP status codes (e.g., `401` for authentication issues by FastAPI Users, `500` for unhandled server errors).
-   All custom exceptions should inherit from a common base error class (e.g., `BaseNoteError`) and Python's `Exception` class, as per project guidelines.

## 8. Performance Considerations
-   **Database Query**: The primary performance factor will be the database query to fetch the note by its ID. Ensuring an index on the `note.id` column (which is typical for primary keys) will keep this query efficient.
-   **Object Serialization**: Pydantic's serialization is generally efficient for the expected data size.
-   For this specific `GET` endpoint retrieving a single record, performance is not expected to be a major concern under normal load.

## 9. Implementation Steps
1.  **Define Custom Exceptions**:
    *   In `backend/src/apps/notes/exceptions.py`, define `NoteNotFoundError` and `NotePermissionError` (or a more generic `NoteForbiddenError`). Ensure they follow project guidelines for custom exceptions.
2.  **Define DTOs**:
    *   In a new file `backend/src/apps/notes/usecases/dto/get_note.py`, define `GetNoteInDTO`.
3.  **Update Note Repository**:
    *   In `backend/src/apps/notes/repositories/note_repository.py` (create if not exists, or update existing):
        *   Add/ensure an `async def get_by_id(self, note_id: int) -> Note | None:` method that queries the database for a note by its primary key.
4.  **Implement Use Case**:
    *   Create `backend/src/apps/notes/usecases/get_note.py`.
    *   Implement `GetNoteUseCase` with an `async def execute(self, input_dto: GetNoteInDTO) -> Note:` method.
        *   Inject `NoteRepository`.
        *   Implement the logic described in the "Data Flow" section (fetch, check existence, check ownership, raise exceptions).
5.  **Add Dependency Provider**:
    *   In `backend/src/apps/notes/dependencies.py`, add a dependency provider function for `GetNoteUseCase` (e.g., `get_get_note_use_case`).
6.  **Update API Endpoint**:
    *   In `backend/src/apps/notes/api.py`:
        *   Import necessary DTOs, use case, exceptions, and the new dependency provider.
        *   Add the `get_get_note_use_case` to the `NoteCBV` dependencies.
        *   Add a new method to `NoteCBV` for the `GET /notes/{note_id}` endpoint:
            *   Use `@notes_router.get("/{note_id}", response_model=NoteOutSchema, status_code=status.HTTP_200_OK, ...)`
            *   Inject `note_id: int` as a path parameter.
            *   Implement the API logic: call the use case, handle exceptions, and return the `NoteOutSchema`.
7.  **Update OpenAPI Documentation**:
    *   Ensure the FastAPI endpoint definition includes comprehensive `summary`, `description`, and `responses` attributes for accurate OpenAPI schema generation.
