# API Endpoint Implementation Plan: Update Travel Note

## 1. Endpoint Overview
This document outlines the plan for implementing the `PUT /notes/{note_id}` API endpoint. This endpoint allows an authenticated user to update an existing travel note they own. The update operation replaces the existing note data with the provided data.

## 2. Request Details
-   **HTTP Method**: `PUT`
-   **URL Structure**: `/notes/{note_id}`
-   **Path Parameters**:
    -   `note_id` (integer, required): The unique identifier of the note to be updated.
-   **Request Body Schema**: `NoteUpdateInSchema` (JSON)
    ```json
    {
        "title": "string",
        "place": "string",
        "date_from": "YYYY-MM-DD",
        "date_to": "YYYY-MM-DD",
        "number_of_people": "integer",
        "key_ideas": "string | null"
    }
    ```
    - All fields from `NoteCreateInSchema` are applicable, with `key_ideas` being optional.
    - Validation rules (min/max length, date logic, numeric ranges) are defined in the schema.

## 3. Response Details
-   **Success Response**:
    -   Code: `200 OK`
    -   Body: The updated note object, conforming to `NoteOutSchema`.
    ```json
    {
        "id": "integer",
        "user_id": "UUID",
        "title": "string",
        "place": "string",
        "date_from": "YYYY-MM-DD",
        "date_to": "YYYY-MM-DD",
        "number_of_people": "integer",
        "key_ideas": "string | null",
        "created_at": "datetime",
        "updated_at": "datetime"
    }
    ```
-   **Error Responses**:
    -   `400 Bad Request`: General invalid input or malformed request.
    -   `401 Unauthorized`: Authentication failed (e.g., missing/invalid JWT).
    -   `403 Forbidden`: User is authenticated but does not own the specified note.
    -   `404 Not Found`: The note with the given `note_id` does not exist.
    -   `409 Conflict`: The update would result in a title conflict (duplicate `user_id` and `title`) with another note belonging to the user.
    -   `422 Unprocessable Entity`: Request payload validation failed (e.g., incorrect data types, missing fields, constraint violations defined in `NoteUpdateInSchema`).

## 4. Data Transfer Objects (DTOs) and Schemas
-   **Input Schema**: `NoteUpdateInSchema` (defined in `backend/src/apps/notes/schemas/note.py`). This will also serve as the input DTO for the use case.
-   **Output Schema**: `NoteOutSchema` (defined in `backend/src/apps/notes/schemas/note.py`). This will also serve as the output DTO from the use case.
-   **Database Model**: `Note` (defined in `backend/src/apps/notes/models/note.py`).

## 5. Data Flow
1.  Client sends a `PUT` request to `/notes/{note_id}` with JWT in cookie and note data in the JSON body.
2.  FastAPI Users middleware authenticates the user via JWT. If fails, returns `401`.
3.  The endpoint in `apps.notes.api` receives the request.
4.  Request body is validated against `NoteUpdateInSchema`. If fails, FastAPI returns `422`.
5.  The API endpoint calls the `UpdateNoteUseCase` with `note_id`, validated `NoteUpdateInSchema` data, and the authenticated `user_id`.
6.  **`UpdateNoteUseCase`**:
    d.  If the `title` in `NoteUpdateInSchema` is different from `retrieved_note.title`:
        i.  Calls `NoteRepository.update(user_id, note_id, explicit_parameters_to_update)`.
        ii. If a conflicting note is found, raises `NoteTitleConflictException`.
        iii. If not found raises `NoteNotFoundException`.
        iv.  If the note is found, updates the note attributes with the new data.
        v.  Calls `session.commit()` to save changes. 
    f.  Returns the updated note object as `UpdateNoteOutDTO` (which is compatible with `NoteOutSchema` via `from_attributes=True`).
7.  The API endpoint receives the updated note data from the use case.
8.  The data is serialized using `NoteOutSchema` and returned to the client with a `200 OK` status.
9.  If any custom exceptions (`NoteNotFoundException`, `NoteTitleConflictException`) are raised from the use case, the API layer catches them and converts them to the appropriate `HTTPException` with the correct status code (`404`, `409` respectively).

## 6. Security Considerations
-   **Authentication**: Handled by FastAPI Users (JWT in cookie). The endpoint must be protected to allow access only to authenticated users.
-   **Authorization**: Crucial. The `UpdateNoteUseCase` must verify that the `user_id` associated with the `note_id` matches the `user_id` of the authenticated user from the JWT. This prevents Insecure Direct Object References (IDOR).
-   **Input Validation**: Performed by Pydantic via `NoteUpdateInSchema`. This mitigates risks like injection attacks and ensures data integrity.
-   **CSRF Protection**: If cookies are used for authentication, ensure CSRF protection mechanisms are in place for relevant frontend interactions (FastAPI Users might offer some support or require specific configurations).
-   **Error Handling**: Return generic error messages for `500` errors to avoid leaking sensitive system information. Specific, non-sensitive error messages can be used for `4xx` client errors.

## 7. Error Handling
-   Custom exceptions will be defined in `backend/src/apps/notes/exceptions.py`:
    -   `NoteNotFoundException`: Raised by repository if note ID does not exist or user does not own the note.
    -   `NoteTitleConflictException`: Raised by repository if updated title conflicts with another note of the same user.
-   These exceptions will inherit from a base application exception and `Exception`.
-   The API layer (`api.py`) will have exception handlers to catch these custom exceptions and map them to FastAPI's `HTTPException` with the appropriate HTTP status codes (`404`, `409` respectively).
-   Pydantic validation errors will automatically result in `422 Unprocessable Entity` responses by FastAPI.

## 8. Performance Considerations
-   Database queries should be optimized. The `get_by_id`, `update`, methods in the repository should use indexed columns (`id`, `user_id`, `title`) for efficient lookups.
-   The update operation involves fetching the note, potentially one conflict check query, and then the update itself. This should generally be performant for a single operation.
-   Ensure database connection pooling is properly configured.

## 9. Implementation Steps

1.  **Define Custom Exceptions (`backend/src/apps/notes/exceptions.py`)**:
    *   Create `NoteNotFoundException`.
    *   Create `NoteTitleConflictException`.
    *   Ensure they inherit from a suitable base exception and `Exception`.

2.  **Update `NoteRepository` (`backend/src/apps/notes/repositories/note_repository.py`)**:
    *   Implement/verify `async def get_by_id(self, note_id: int, user_id: UUID) -> Note | None;`.
    *   Implement `async def update(self, *) -> Note;`. This method will update the attributes of the note objects fetched by user_id and note_id with explicitly defined parameters, then add `db_obj` to the session and flush/commit. Raises `NoteTitleConflictException` if a note with the same title and user ID already exists. Raises `NoteNotFoundException` if the note with the given ID does not exist or the user does not own it.

3.  **Create `UpdateNoteUseCase` (`backend/src/apps/notes/usecases/update_note_usecase.py`)**:
    *   Define the class `UpdateNoteUseCase`.
    *   Constructor will take `NoteRepository` as a dependency.
    *   Implement an `execute` method that takes `input_data: NoteUpdateInSchema` containing the updated note data and `note_id: int` and `user_id: UUID` (from the authenticated user).
    *   Implement the data flow logic described in section 5, step 6, including fetching, authorization check, title conflict check, and calling the repository's update method.
    *   Raise the custom exceptions defined in step 1 as appropriate.
    *   Return the updated `UpdateNoteOutDTO` instance (which is compatible with `NoteOutSchema` via `from_attributes=True`).

4.  **Update API Endpoint (`backend/src/apps/notes/api.py`)**:
    *   Define the `PUT /notes/{note_id}` route.
    *   Ensure it's protected by FastAPI Users authentication (`current_active_user` dependency).
    *   Inject `UpdateNoteUseCase` and `AsyncSession` (database session).
    *   Call the use case's `execute` method.
    *   Implement try-except blocks to catch the custom exceptions from the use case and re-raise them as `HTTPException` with correct status codes and detail messages.
    *   Return `NoteOutSchema` on success.

5.  **Dependency Injection**:
    *   Ensure `NoteRepository` can be injected into `UpdateNoteUseCase`.
    *   Ensure `UpdateNoteUseCase` can be injected into the API endpoint. This might involve creating factory functions in `backend/src/apps/notes/dependencies.py` or `backend/src/dependencies.py`.

6.  **Documentation**:
    *   Ensure OpenAPI/Swagger documentation generated by FastAPI is accurate for this endpoint, including request/response schemas and status codes. Add descriptions and examples if necessary.
    *   Update any external API documentation if applicable.
