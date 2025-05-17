\
<!-- filepath: /Users/patrykwiener/Code/10xdevs/vibe-travel/.ai/note-create-api-implementation-plan.md -->
# API Endpoint Implementation Plan: Create Note (`POST /notes`)

## 1. Endpoint Overview
The purpose of this endpoint is to allow authenticated users to create new travel notes. The note contains basic information about the planned trip, such as title, place, dates, number of people, and key ideas. Each note is associated with the user who created it.

## 2. Request Details
-   **HTTP Method**: `POST`
-   **URL Structure**: `/notes`
-   **Parameters**: None (no path or query parameters).
-   **Request Body**: `application/json`
    ```json
    {
        "title": "string (required, min_length: 3, max_length: 255)",
        "place": "string (required, min_length: 3, max_length: 255)",
        "date_from": "date (required, format: YYYY-MM-DD)",
        "date_to": "date (required, format: YYYY-MM-DD)",
        "number_of_people": "integer (required, min: 1, max: 20)",
        "key_ideas": "string (optional, max_length: 5000)"
    }
    ```
    -   Business logic validation:
        -   `date_from` must be earlier than or equal to `date_to`.
        -   The difference between `date_to` and `date_from` cannot exceed 14 days.

## 3. Types Used
-   **Input Schema (Request DTO)**: `NoteCreateInSchema` (from `backend/src/apps/notes/schemas/note.py`)
    -   Requires adding a `@model_validator` for date logic validation (`date_from <= date_to` and maximum trip duration of 14 days).
-   **Output Schema (Response DTO)**: `NoteOutSchema` (from `backend/src/apps/notes/schemas/note.py`)
-   **Domain Model**: `Note` (from `backend/src/apps/notes/models/note.py`)
-   **User Model**: `User` (from `src.apps.users.models.user.User`)
-   **Custom Exception**: `NoteTitleConflictError` (to be defined in `backend/src/apps/notes/exceptions.py`)

## 4. Response Details
-   **Success Response (201 Created)**:
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
-   **Error Responses**:
    -   `400 Bad Request`: General error for invalid data not caught by schema validation.
    -   `401 Unauthorized`: User is not authenticated.
    -   `409 Conflict`: A note with the given title already exists for this user.
    -   `422 Unprocessable Entity`: Field validation errors (e.g., missing fields, invalid type, violation of length/value constraints, incorrect date range).

## 5. Data Flow
1.  The client sends a `POST /notes` request with a JSON payload.
2.  The FastAPI router (`apps/notes/api.py`) receives the request.
3.  FastAPI Users middleware authenticates the user via JWT (from a cookie) and provides the `current_user` object.
4.  The request payload is validated against `NoteCreateInSchema`. This includes:
    -   Static validation (types, presence, length/value constraints).
    -   Custom validation in the schema (`date_from <= date_to`, duration <= 14 days).
    -   If Pydantic validation fails, FastAPI automatically returns a `422 Unprocessable Entity` response.
5.  The API endpoint calls `CreateNoteUseCase`, passing data from `NoteCreateInSchema` and `current_user`.
6.  `CreateNoteUseCase`:
    a.  Injects `NoteRepository`.
    b.  Calls `note_repository.get_by_title_and_user_id(title, user.id)` to check title uniqueness.
    c.  If the title already exists for the user, it raises a `NoteTitleConflictError` exception.
    d.  If the title is unique, it prepares data to create a `Note` object.
    e.  Calls `note_repository.create(note_data, user.id)` to save the note in the database. The repository assigns `user_id` to the note.
    f.  Returns the created `Note` object.
7.  The API endpoint receives the created `Note` object from the use case.
8.  The `Note` object is serialized using `NoteOutSchema`.
9.  FastAPI returns a `201 Created` response with the serialized note.
10. **Exception Handling in the API Layer**:
    -   `NoteTitleConflictError` (from the use case) is caught and mapped to an HTTP `409 Conflict` response.
    -   Other errors (e.g., `ValueError` from the use case, if not schema validation errors) can be mapped to `400 Bad Request`.
    -   Database errors or other unexpected server errors are mapped to `500 Internal Server Error`.

## 6. Security Considerations
-   **Authentication**: The endpoint must be protected and require a valid JWT. Provided by integration with FastAPI Users (`fastapi_users.current_user()`).
-   **Authorization**: Business logic must ensure that notes are created and associated with the currently logged-in user (`user_id` from the JWT). Title uniqueness is checked within the context of the given user.
-   **Input Validation**: Strict validation using Pydantic (`NoteCreateInSchema`) and additional business validations (e.g., title uniqueness) are crucial to prevent errors and potential attacks (e.g., injection, although ORM provides protection). Field length constraints should be applied.
-   **CSRF Protection**: If JWT is transmitted in cookies, CSRF protection mechanisms should be considered if not provided by default by FastAPI Users in the used configuration.
-   **Secure HTTP Headers**: Appropriate security headers (e.g., `X-Content-Type-Options`, `X-Frame-Options`) should be configured.

## 7. Performance Considerations
-   The note creation operation is typically fast and involves one database query to check title uniqueness and one query to insert the new record.
-   With a large number of notes per user, the title uniqueness query (`get_by_title_and_user_id`) should be optimized by an appropriate database index on the `(user_id, title)` columns. The `Note` model already includes `UniqueConstraint('user_id', 'title', name='unique_user_title')`, which should result in the creation of such an index.
-   Pydantic validation is efficient.

## 8. Implementation Steps
1.  **Update `NoteCreateInSchema` schema**:
    -   Add `@model_validator(mode='after')` in `backend/src/apps/notes/schemas/note.py` to implement date validation logic:
        -   Check if `date_from <= date_to`.
        -   Check if the day difference between `date_to` and `date_from` does not exceed 14.
        -   In case of a validation error, raise `ValueError` with an appropriate message (Pydantic will convert this to a `422` error).
2.  **Define custom exception**:
    -   Create the file `backend/src/apps/notes/exceptions.py` (if it doesn't exist).
    -   Define the class `class NoteTitleConflictError(Exception): pass`.
3.  **Implement `NoteRepository`**:
    -   Create/modify the file `backend/src/apps/notes/repositories/note_repository.py`.
    -   Implement the method `async def create(self, db: AsyncSession, *, note_in: NoteCreateInSchema, user_id: UUID) -> Note:`:
        -   Creates an instance of the `Note` model based on `note_in` and `user_id`.
        -   Adds it to the `db` session and commits the transaction.
        -   Returns the created `Note` object.
    -   Implement the method `async def get_by_title_and_user_id(self, db: AsyncSession, *, title: str, user_id: UUID) -> Note | None:`:
        -   Executes a database query to find a note with the given title for the given user.
        -   Returns the `Note` object or `None`.
4.  **Implement `CreateNoteUseCase`**:
    -   Create the file `backend/src/apps/notes/usecases/create_note_usecase.py`.
    -   Define the class `CreateNoteUseCase`.
    -   Inject `NoteRepository` in the constructor.
    -   Implement the method `async def execute(self, db: AsyncSession, *, note_data: NoteCreateInSchema, current_user: User) -> Note:`:
        -   Call `self.note_repository.get_by_title_and_user_id()` to check title uniqueness.
        -   If a note with this title exists, raise `NoteTitleConflictError("Note with this title already exists for the user.")`.
        -   Call `self.note_repository.create()` to create the note.
        -   Return the created note.
5.  **Implement API endpoint**:
    -   In the file `backend/src/apps/notes/api.py`:
        -   Create or add to an existing `APIRouter` for notes.
        -   Define a class-based view (CBV) for the `POST /notes` endpoint with appropriate dependencies:
            -   `note_data: NoteCreateInSchema`
            -   `db: AsyncSession = Depends(get_async_session)` (or appropriate DB session dependency from `src.database`)
            -   `current_user: User = Depends(fastapi_users.current_user(active=True))` (from `src.apps.users.dependencies` or directly)
            -   `create_note_use_case: CreateNoteUseCase = Depends()` (FastAPI will automatically inject if the repository is also injected or correctly configured as a use case dependency).
        -   In the function body, call `await create_note_use_case.execute(...)`.
        -   Add `NoteTitleConflictError` exception handling using `try-except` or a FastAPI `@exception_handler` decorator, returning `HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))`.
        -   Return the created note with status code `status.HTTP_201_CREATED` and `response_model=NoteOutSchema`.
6.  **Register router**:
    -   Ensure the notes router (`notes_router`) is added to the main FastAPI application in `backend/src/main.py` or in the main `backend/src/routes.py` file.
7.  **Tests**:
    -   **Unit Tests**:
        -   For the validator in `NoteCreateInSchema` (correct and incorrect dates).
        -   For `NoteRepository` (mocking the DB session).
        -   For `CreateNoteUseCase` (mocking the repository, testing title uniqueness logic and successful creation).
    -   **Integration/API Tests**:
        -   Test the `POST /notes` endpoint with valid data, expecting `201 Created`.
        -   Test with invalid data (e.g., wrong date format, missing fields), expecting `422 Unprocessable Entity`.
        -   Test with date logic violating rules (e.g., `date_from > date_to`), expecting `422 Unprocessable Entity`.
        -   Test creating a note with a title that already exists for the given user, expecting `409 Conflict`.
        -   Test without authentication, expecting `401 Unauthorized`.
8.  **Documentation**:
    -   Ensure the endpoint is correctly described in the OpenAPI documentation generated by FastAPI (descriptions, examples).
    -   Update any external API documentation if it exists.
