# API Endpoint Implementation Plan: Delete Note

## 1. Endpoint Overview
This document outlines the implementation plan for the `DELETE /notes/{note_id}` API endpoint. The purpose of this endpoint is to allow an authenticated user to delete one of their specific travel notes. Deleting a note will also result in the deletion of all associated travel plans due to the `cascade='all, delete-orphan'` setting on the `Note.plans` relationship in the ORM.

## 2. Request Details
-   **HTTP Method**: `DELETE`
-   **URL Structure**: `/notes/{note_id}`
-   **Path Parameters**:
    -   `note_id` (integer, required): The unique identifier of the note to be deleted.
-   **Query Parameters**: None
-   **Request Body**: None

## 3. Utilized Types
While this DELETE operation does not have a request body or a data-carrying success response, the following types/models are involved internally:
-   **`Note` Model** (`src.apps.notes.models.note.Note`): The SQLAlchemy model representing the note to be fetched and deleted.
-   **`User` Model** (`src.apps.users.models.user.User`): The SQLAlchemy model representing the authenticated user, used for authorization (typically injected via `CurrentUser` dependency).
-   **Custom Exception Types** (to be defined in `src.apps.notes.exceptions.py`):
    -   `NoteNotFoundError`: Raised when the specified `note_id` does not correspond to an existing note.

## 4. Response Details
-   **Success Response**:
    -   Code: `204 No Content`
    -   Body: None. Indicates that the note (and its associated plans) were successfully deleted.
-   **Error Responses**:
    -   Code: `401 Unauthorized`: If the request is made without proper authentication (handled by FastAPI Users).
        -   Body: Standard FastAPI/FastAPI Users error response (e.g., `{"detail": "Not authenticated"}`).
    -   Code: `403 Forbidden`: If the authenticated user attempts to delete a note they do not own.
        -   Body: JSON error object (e.g., `{"detail": "User does not have permission to delete this note."}`).
    -   Code: `404 Not Found`: If the note with the specified `note_id` does not exist.
        -   Body: JSON error object (e.g., `{"detail": "Note not found."}`).
    -   Code: `500 Internal Server Error`: For unexpected server-side errors during the operation.
        -   Body: JSON error object (e.g., `{"detail": "Internal server error."}`).

## 5. Data Flow
1.  A `DELETE` request is made to `/notes/{note_id}`.
2.  **Authentication**: FastAPI Users middleware (or equivalent dependency) verifies the JWT token from the cookie. If invalid or missing, a `401 Unauthorized` response is returned.
3.  **API Layer (`apps.notes.api.py`):**
    a.  The endpoint function receives the `note_id` (integer) from the path and the authenticated `User` object (e.g., via `CurrentUser: User = Depends(...)`).
    b.  It instantiates (or gets via dependency injection) and calls the `DeleteNoteUseCase`.
    c.  The `user.id` (UUID) and `note_id` are passed to the use case.
4.  **Use Case Layer (`apps.notes.usecases.delete_note_usecase.py`):**
    a.  The `DeleteNoteUseCase` (injected with `NoteRepository`) is executed.
    b.  It calls `note_repository.delete_users_note_by_id(note_id=note_id, user_id=user_id)`. May raise `NoteNotFoundError` if the note does not exist.
5.  **Repository Layer (`apps.notes.repositories.note_repository.py`):**
    a.  The `NoteRepository.delete_users_note_by_id(note_id=note_id, user_id=user_id)` method queries the database for the note and deletes it if found. Triggers the cascade delete for associated `Plan` records.
    c.  The `cascade='all, delete-orphan'` on the `Note.plans` relationship in `note.py` ensures that SQLAlchemy automatically deletes associated `Plan` records when the `Note` is deleted.
6.  **API Layer (Continued):**
    a.  If the use case completes successfully (no exceptions raised), the API layer returns a `Response(status_code=204)`.
    b.  If the use case raises `NoteNotFoundError`, the API layer catches this and returns an `HTTPException(status_code=404, detail="Note not found.")`.
    d.  Other unexpected exceptions are caught by global error handlers (or a generic try-except in the endpoint) and result in a `500 Internal Server Error`.

## 6. Security Considerations
-   **Authentication**: Handled by FastAPI Users, ensuring only logged-in users can attempt this operation. JWTs are used (as per spec).
-   **Authorization**: This is critical. The use case layer *must* rigorously verify that the `user_id` of the note matches the `id` of the authenticated user. This prevents Insecure Direct Object Reference (IDOR) vulnerabilities where a user could delete notes belonging to others.
-   **Input Validation**:
    -   `note_id`: FastAPI path parameter type coercion will validate it's an integer. The application logic (use case) validates its existence in the database.
-   **Cascade Deletion**: The `cascade='all, delete-orphan'` setting on the `Note.plans` relationship is relied upon. This must be correctly configured in the `Note` model and tested to ensure it functions as expected, preventing orphaned `Plan` records.

## 7. Error Handling
-   **`NoteNotFoundError`**: Custom exception (inheriting from a project base error and `Exception`) raised by the repository if Note for a user does not exist. Caught in the API layer and converted to a `404 Not Found` HTTPException.
-   **Database Errors**: General database errors during the delete operation (e.g., connection issues) should be caught by a generic error handler and logged, resulting in a `500 Internal Server Error` response to the client.
-   **Authentication Errors**: Handled by the FastAPI Users integration, typically resulting in a `401 Unauthorized` response.

## 8. Performance Considerations
-   The primary performance impact will be the database operations: fetching the note by its ID and then deleting it. The cascade delete to `Plan` records also adds to this.
-   `note_id` is a primary key, so lookups should be very fast.
-   The number of associated plans could impact deletion time if a note has an extremely large number of plans. However, for typical use cases, this should be acceptable.
-   The operation is synchronous. No background tasks are specified or seem necessary for this deletion.
-   Ensure database indexes are properly in place for `note.id` (automatic for PK) and `note.user_id` (automatic for FK, good for potential admin queries, though direct ownership check uses the fetched note object).

## 9. Implementation Steps
1.  **Define Custom Exceptions (`backend/src/apps/notes/exceptions.py`):**
    *   Create `NoteNotFoundError(BaseNoteError)` if it doesn't exist (assuming `BaseNoteError` is a common base for note-related exceptions).
    *   Ensure these inherit from a project-wide base error class (e.g., `NoteBaseError`) and `Exception` as per project guidelines.
2.  **Implement/Verify Repository Methods (`backend/src/apps/notes/repositories/note_repository.py`):**
    *   Ensure `NoteRepository.delete_users_note_by_id(note_id: int, user_id: uuid.UUID)` is implemented and correctly deletes the note.
3.  **Implement Use Case (`backend/src/apps/notes/usecases/delete_note_usecase.py`):**
    *   Create DeleteNoteInDTO class to encapsulate input data.
    *   Create a `DeleteNoteUseCase` class.
    *   Inject `NoteRepository` via constructor.
    *   Implement an `async execute(self, input_data: DeleteNoteInDTO)` method (or sync equivalent).
        *   Inside `execute`, call `note_repository.delete_users_note_by_id()`.
4.  **Implement API Endpoint (`backend/src/apps/notes/api.py`):**
    *   Add a new FastAPI route: `router.delete("/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)`.
    *   Define the endpoint function, e.g., `async def delete_note(...)`.
    *   Inject dependencies: `note_id: int`, `current_user: User = Depends(get_current_active_user)`, `delete_note_use_case: DeleteNoteUseCase = Depends(get_delete_note_use_case)` (assuming factory/provider functions for dependencies).
    *   Call `await delete_note_use_case.execute(note_id=note_id, user_id=current_user.id)`.
    *   Implement `try-except` blocks to catch `NoteNotFoundError` (raise `HTTPException(404)`)
    *   On success, FastAPI will automatically return `204 No Content` due to the `status_code` in the decorator and no return value from the function.
5.  **Update Main Router (`backend/src/routers.py`):**
    *   Ensure the notes API router (from `apps.notes.api.py`) is included in the main application router if not already structured this way.
6.  **Documentation:**
    *   FastAPI's automatic OpenAPI generation should cover this. Review the generated Swagger UI/OpenAPI spec to ensure the endpoint, path parameter, and responses (including 204, 401, 403, 404) are correctly documented.
