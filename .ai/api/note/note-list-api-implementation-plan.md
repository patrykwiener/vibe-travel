# API Endpoint Implementation Plan: List User Notes

## 1. Endpoint Overview
This document outlines the implementation plan for the `GET /notes` API endpoint. The endpoint is responsible for listing all travel notes associated with the authenticated user. It supports pagination and searching by note title, leveraging `fastapi-pagination`.

## 2. Request Details
-   **HTTP Method**: `GET`
-   **URL Path**: `/notes`
-   **Query Parameters**:
    -   `offset` (integer, optional, default: 0): Number of items to skip for pagination. Managed by `fastapi-pagination`.
    -   `limit` (integer, optional, default: 10): Maximum number of items to return per page. Managed by `fastapi-pagination`.
    -   `search_title` (string, optional): A string for case-insensitive partial search on the note's title.
-   **Headers**:
    -   `Cookie`: Expected to contain the JWT for authentication (handled by `fastapi-users`).

## 3. Response Details
-   **Success Code**: `200 OK`
-   **Response Payload Structure**: The endpoint will return a paginated list of notes. The structure is compatible with `fastapi_pagination.LimitOffsetPage[NoteListItemOutSchema]` and aligns with the provided `NoteListOutSchema`.
    ```json
    {
        "items": [
            {
                "id": 123,
                "title": "Trip to Paris",
                "place": "Paris, France",
                "date_from": "2025-07-10",
                "date_to": "2025-07-15",
                "number_of_people": 2
            }
            // ... other notes
        ],
        "total": 1, // Total number of notes matching the criteria
        "limit": 10, // Number of items per page
        "offset": 0 // Offset for the current page
    }
    ```
-   **Schemas Used**:
    -   `NoteListItemOutSchema` (for individual items in the list, from `backend/src/apps/notes/schemas/note.py`)
    -   The overall response structure will be `fastapi_pagination.LimitOffsetPage[NoteListItemOutSchema]`, which is compatible with `NoteListOutSchema` (from `backend/src/apps/notes/schemas/note.py`).

## 4. Data Flow
1.  The client sends a `GET` request to `/notes` with optional query parameters (`offset`, `limit`, `search_title`) and an authentication cookie.
2.  FastAPI routes the request to the `list_notes` endpoint handler in `backend/src/apps/notes/api.py`.
3.  `fastapi-users` middleware (specifically `CurrentUser()`) verifies the JWT from the cookie and provides the authenticated `User` object. If authentication fails, a `401 Unauthorized` response is returned.
4.  Pagination parameters (`LimitOffsetParams` from `fastapi_pagination.ext.async_sqlalchemy`) are injected via `Depends()`. The `search_title` parameter is extracted using `Query()` from FastAPI.
5.  The API handler instantiates `NoteRepository` (passing the `AsyncSession`) and then `ListNotesUseCase`, passing the repository instance to the use case.
6.  The API handler calls the `execute` method of `ListNotesUseCase`, passing the authenticated `user.id`, the `AsyncSession` (obtained from the `DbSession()` dependency), `pagination_params`, and `search_title`.
7.  Inside `ListNotesUseCase.execute()`:
    a.  It calls `note_repository.get_notes_query(user_id, search_title)` to obtain a SQLAlchemy `Selectable` (query object).
    b.  This query is constructed to:
        i.  Filter notes by `Note.user_id == user_id`.
        ii. If `search_title` is provided, apply a case-insensitive partial match filter: `Note.title.ilike(f"%{search_title}%")`.
        iii. Order the results (e.g., by `Note.created_at.desc()`).
    c.  The use case then uses `await paginate(db_session, query, params=pagination_params)` from `fastapi-pagination` to execute the query and retrieve a paginated list of `Note` model instances. `fastapi-pagination` handles mapping these to `NoteListItemOutSchema` objects (assuming `from_attributes=True` in the schema).
8.  The `paginate` function returns a `LimitOffsetPage[NoteListItemOutSchema]` object.
9.  The API handler returns this paginated result. FastAPI serializes it into a JSON response with a `200 OK` status.

## 5. Security Considerations
-   **Authentication**: Enforced by `fastapi-users` via JWT in cookies. All requests to this endpoint must include a valid JWT.
-   **Authorization**: User ownership is critical. The `user_id` from the authenticated JWT MUST be used to filter notes in the database query within the `NoteRepository`. This prevents users from accessing notes that do not belong to them.
-   **Input Validation**:
    -   Pagination parameters (`offset`, `limit`): Validated by `fastapi-pagination` for type (integer) and sensible defaults/limits.
    -   `search_title` (string): Type validation by FastAPI/Pydantic. SQLAlchemy ORM handles safe parameterization for SQL queries, mitigating SQL injection risks when `search_title` is used in `ilike`.
-   **Data Exposure**: Only fields defined in `NoteListItemOutSchema` are exposed in the API response, minimizing unnecessary data leakage.

## 6. Error Handling
-   **`200 OK`**: Successful retrieval of notes.
-   **`401 Unauthorized`**: Returned by `fastapi-users` if authentication fails (e.g., missing, invalid, or expired JWT).
-   **`422 Unprocessable Entity`**: Returned by FastAPI/Pydantic if query parameters (`offset`, `limit`) have invalid types (e.g., non-integer values).
-   **`500 Internal Server Error`**: For any unhandled exceptions or database errors. A global exception handler should be in place to return a generic error message and log the details.

## 7. Performance Considerations
-   **Database Indexing**: Ensure the `note` table has an index on `user_id`. Consider a composite index on `(user_id, title)` if `search_title` is frequently used, or `(user_id, created_at)` if sorting by creation date is standard.
-   **Pagination**: Handled by `fastapi-pagination`, which limits the number of records fetched from the database per request. This is crucial for performance with large datasets.
-   **Query Optimization**: The SQLAlchemy query generated by `NoteRepository` should be efficient. `fastapi-pagination` will execute this query.
-   **Asynchronous Operations**: The endpoint and all database interactions must be asynchronous (`async/await`) to ensure non-blocking I/O, improving application throughput.

## 8. Implementation Steps
1.  **Verify Schemas**:
    -   Confirm `NoteListItemOutSchema` in `backend/src/apps/notes/schemas/note.py` includes `model_config = ConfigDict(from_attributes=True)`.
    -   Confirm `NoteListOutSchema` is defined correctly (though `LimitOffsetPage[NoteListItemOutSchema]` will be the direct return type annotation in the endpoint).
2.  **Implement Repository Method**:
    -   In `backend/src/apps/notes/repositories/note_repository.py`, define or update the `NoteRepository` class. It should accept `AsyncSession` in its constructor.
    -   Add an async method: `async def get_notes_query(self, user_id: UUID, search_title: str | None) -> Selectable:` (where `Selectable` is from `sqlalchemy.sql.expression`).
        -   This method will construct and return a SQLAlchemy `select(Note)` statement.
        -   Filter by `Note.user_id == user_id`.
        -   If `search_title` is provided, add a filter: `Note.title.ilike(f"%{search_title}%")`.
        -   Add default ordering: `order_by(Note.created_at.desc())`.
3.  **Implement Use Case**:
    -   Create `backend/src/apps/notes/usecases/list_notes_usecase.py`.
    -   Define `ListNotesUseCase` class. Its constructor should accept an instance of `NoteRepository`.
    -   Implement an async method: `async def execute(self, user_id: UUID, db_session: AsyncSession, pagination_params: LimitOffsetParams, search_title: str | None) -> LimitOffsetPage[NoteListItemOutSchema]:` (import `LimitOffsetPage` from `fastapi_pagination` and `NoteListItemOutSchema`).
        -   Call `query = await self.note_repository.get_notes_query(user_id, search_title)` (ensure repository method is async or called appropriately).
        -   Use `paginated_result = await paginate(db_session, query, params=pagination_params)` (import `paginate` from `fastapi_pagination.ext.async_sqlalchemy`).
        -   Return `paginated_result`.
4.  **Implement API Endpoint**:
    -   In `backend/src/apps/notes/api.py`:
        -   Import necessary modules: `Depends` from `fastapi`, `APIRouter`, `Query`.
        -   Import `CurrentUser` from `src.apps.users.dependencies` (or wherever it's defined by `fastapi-users`).
        -   Import `DbSession` from `src.dependencies`.
        -   Import `LimitOffsetParams`, `LimitOffsetPage`, `add_pagination`, `paginate` from `fastapi_pagination` and `fastapi_pagination.ext.async_sqlalchemy`.
        -   Import `NoteListItemOutSchema` from `..schemas.note`.
        -   Import `ListNotesUseCase` from `..usecases.list_notes_usecase`.
        -   Import `NoteRepository` from `..repositories.note_repository`.
        -   Import the `User` model (e.g., `from src.apps.users.models import User`).
        -   Import `AsyncSession` from `sqlalchemy.ext.asyncio`.
        -   Import `UUID` from `uuid`.
        -   Define the router: `router = APIRouter(prefix="/notes", tags=["Notes"])`.
        -   Define the endpoint: `async def list_notes(user: User = Depends(CurrentUser()), db_session: AsyncSession = Depends(DbSession()), pagination_params: LimitOffsetParams = Depends(), search_title: str | None = Query(None, description="Search by note title")) -> LimitOffsetPage[NoteListItemOutSchema]:`.
        -   Instantiate `note_repository = NoteRepository(db_session)`.
        -   Instantiate `use_case = ListNotesUseCase(note_repository)`.
        -   Call and return `await use_case.execute(user_id=user.id, db_session=db_session, pagination_params=pagination_params, search_title=search_title)`.
5.  **Register Pagination Globally (if not already done)**:
    -   In `backend/src/main.py` (or wherever the FastAPI app is initialized), ensure `add_pagination(app)` is called.
6.  **Dependency Injection Review**:
    -   `NoteRepository` is instantiated directly in the endpoint with the `AsyncSession`.
    -   `ListNotesUseCase` is instantiated directly in the endpoint with the `NoteRepository` instance.
    -   FastAPI's `Depends` system will handle `CurrentUser`, `DbSession`, and `LimitOffsetParams` injection.
7.  **Testing**:
    -   **Unit Tests**:
        -   For `NoteRepository.get_notes_query`: Test that the generated SQL query string (or its structure if using a query builder verifier) is correct for different inputs (with/without `search_title`, correct user ID).
        -   For `ListNotesUseCase.execute`: Mock `NoteRepository` (to control the query returned) and the `paginate` function. Verify correct parameters are passed and the result from `paginate` is returned.
    -   **Integration Tests** (using `TestClient` from FastAPI):
        -   Test successful retrieval of notes (empty list and list with items for the authenticated user).
        -   Test correct pagination behavior (`limit`, `offset`).
        -   Test `search_title` functionality (case-insensitivity, partial match, no match for the user's notes).
        -   Test `401 Unauthorized` for requests without a valid token.
        -   Test `422 Unprocessable Entity` for invalid pagination parameter types (e.g., `limit="abc"`).
8.  **Documentation Review**:
    -   Verify that FastAPI's OpenAPI documentation for the endpoint is correctly generated (automatic via type hints and Pydantic models). Check descriptions for query parameters and the response schema.
