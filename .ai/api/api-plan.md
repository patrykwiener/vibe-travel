# REST API Plan

## 1. Resources

-   **User**: Represents application users. Primarily managed by FastAPI Users for authentication and basic user data.
    -   Database Table: `user`
-   **UserProfile**: Stores user-specific travel preferences.
    -   Database Table: `user_profile`
    -   Linked to: `User` (one-to-one)
-   **Note**: Represents user's travel notes, which form the basis for generating travel plans.
    -   Database Table: `Note`
    -   Linked to: `User` (many-to-one)
-   **Plan**: Represents the travel plan, either AI-generated, manually created, or a hybrid.
    -   Database Table: `Plan` (assumed, based on PRD and enums; linked one-to-one with a `Note` for its active/pending plan)
    -   Linked to: `Note` (one-to-one or one-to-many if history is kept, but PRD implies one primary plan per note)

## 2. Endpoints

### Authentication Endpoints (Handled by FastAPI Users)

-   `POST /auth/register`
-   `POST /auth/jwt/login`
-   `POST /auth/jwt/logout`
-   `GET /users/me` (To get current authenticated user's basic details)

### UserProfile Endpoints

#### `GET /profile`
-   **Description**: Retrieve the current authenticated user's travel profile.
-   **HTTP Method**: `GET`
-   **URL Path**: `/profile`
-   **Request Payload**: None
-   **Response Payload (JSON)**:
    ```json
    {
        "travel_style": "ADVENTURE", // or null
        "preferred_pace": "MODERATE", // or null
        "budget": "MEDIUM", // or null
        "updated_at": "2025-05-11T10:00:00Z"
    }
    ```
-   **Success Codes**:
    -   `200 OK`: Profile retrieved successfully.
-   **Error Codes**:
    -   `401 Unauthorized`: User not authenticated.
    -   `404 Not Found`: Profile not yet created for the user (or return empty/default values).

#### `PUT /profile`
-   **Description**: Create or update the current authenticated user's travel profile.
-   **HTTP Method**: `PUT`
-   **URL Path**: `/profile`
-   **Request Payload (JSON)**:
    ```json
    {
        "travel_style": "ADVENTURE", // 'RELAX', 'ADVENTURE', 'CULTURE', 'PARTY', or null
        "preferred_pace": "MODERATE", // 'CALM', 'MODERATE', 'INTENSE', or null
        "budget": "MEDIUM" // 'LOW', 'MEDIUM', 'HIGH', or null
    }
    ```
-   **Response Payload (JSON)**:
    ```json
    {
        "travel_style": "ADVENTURE",
        "preferred_pace": "MODERATE",
        "budget": "MEDIUM",
        "updated_at": "2025-05-11T10:00:00Z"
    }
    ```
-   **Success Codes**:
    -   `200 OK`: Profile updated successfully.
    -   `201 Created`: Profile created successfully (if it didn't exist).
-   **Error Codes**:
    -   `400 Bad Request`: Invalid input data (e.g., invalid enum values).
    -   `401 Unauthorized`: User not authenticated.
    -   `422 Unprocessable Entity`: Validation error.

### Note Endpoints

#### `POST /notes`
-   **Description**: Create a new travel note.
-   **HTTP Method**: `POST`
-   **URL Path**: `/notes`
-   **Request Payload (JSON)**:
    ```json
    {
        "title": "Trip to Paris", 
        "place": "Paris, France", 
        "date_from": "2025-07-10", 
        "date_to": "2025-07-15",   
        "number_of_people": 2,   
        "key_ideas": "Eiffel Tower, Louvre Museum, Seine River cruise" 
    }
    ```
-   **Response Payload (JSON)**:
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
-   **Success Codes**:
    -   `201 Created`: Note created successfully.
-   **Error Codes**:
    -   `400 Bad Request`: Invalid input data.
    -   `401 Unauthorized`: User not authenticated.
    -   `409 Conflict`: Note with the same title already exists for this user.
    -   `422 Unprocessable Entity`: Validation error (field constraints).

#### `GET /notes`
-   **Description**: List all travel notes for the authenticated user with pagination and search.
-   **HTTP Method**: `GET`
-   **URL Path**: `/notes`
-   **Query Parameters**:
    -   `offset` (integer, optional, default: 0): Number of items to skip.
    -   `limit` (integer, optional, default: 10): Maximum number of items to return.
    -   `search_title` (string, optional): Case-insensitive partial search string for the note title.
-   **Response Payload (JSON)**:
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
        ],
        "total": 1,
        "limit": 10,
        "offset": 0
    }
    ```
-   **Success Codes**:
    -   `200 OK`: Notes retrieved successfully.
-   **Error Codes**:
    -   `401 Unauthorized`: User not authenticated.

#### `GET /notes/{note_id}`
-   **Description**: Retrieve a specific travel note by its ID.
-   **HTTP Method**: `GET`
-   **URL Path**: `/notes/{note_id}`
-   **Request Payload**: None
-   **Response Payload (JSON)**:
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
-   **Success Codes**:
    -   `200 OK`: Note retrieved successfully.
-   **Error Codes**:
    -   `401 Unauthorized`: User not authenticated.
    -   `403 Forbidden`: User does not own this note.
    -   `404 Not Found`: Note with the given ID not found.

#### `PUT /notes/{note_id}`
-   **Description**: Update an existing travel note.
-   **HTTP Method**: `PUT`
-   **URL Path**: `/notes/{note_id}`
-   **Request Payload (JSON)**:
    ```json
    {
        "title": "Updated Trip to Paris",
        "place": "Paris, France",
        "date_from": "2025-07-10",
        "date_to": "2025-07-16",
        "number_of_people": 3,
        "key_ideas": "Updated key ideas."
    }
    ```
-   **Response Payload (JSON)**: (Updated note object, same as `GET /notes/{note_id}`)
-   **Success Codes**:
    -   `200 OK`: Note updated successfully.
-   **Error Codes**:
    -   `400 Bad Request`: Invalid input data.
    -   `401 Unauthorized`: User not authenticated.
    -   `403 Forbidden`: User does not own this note.
    -   `404 Not Found`: Note with the given ID not found.
    -   `409 Conflict`: Update would cause a title conflict with another note of the same user.
    -   `422 Unprocessable Entity`: Validation error.

#### `DELETE /notes/{note_id}`
-   **Description**: Delete a specific travel note by its ID (also deletes associated plan).
-   **HTTP Method**: `DELETE`
-   **URL Path**: `/notes/{note_id}`
-   **Request Payload**: None
-   **Response Payload**: None
-   **Success Codes**:
    -   `204 No Content`: Note deleted successfully.
-   **Error Codes**:
    -   `401 Unauthorized`: User not authenticated.
    -   `403 Forbidden`: User does not own this note.
    -   `404 Not Found`: Note with the given ID not found.

### Plan Endpoints (Nested under Notes)

#### `POST /notes/{note_id}/plan/generate`
-   **Description**: Generate an AI-powered travel plan proposal for a specific note.
    -   This endpoint will call the OpenRouter SDK to generate a plan based on the note and user profile.
    -   The generated plan will be stored with a status of `PENDING_AI`.
    -   The user can later accept, modify this plan or generate a new one.
-  **Note**: The AI generation will be done using the OpenRouter SDK, which is expected to be integrated into the backend.
-   **HTTP Method**: `POST`
-   **URL Path**: `/notes/{note_id}/plan/generate`
-   **Request Payload**: None
-   **Response Payload (JSON)**:
    ```json
    {
        "generation_id": "generated-plan-uuid-or-id",
        "plan_text": "Day 1: Morning - Eiffel Tower...", 
        "status": "PENDING_AI"
    }
    ```
-   **Success Codes**:
    -   `201 Created`: Plan proposal generated successfully.
-   **Error Codes**:
    -   `401 Unauthorized`: User not authenticated.
    -   `404 Not Found`: Note with the given ID not found or user does not own the note.
    -   `500 Internal Server Error`: Error during AI generation.
    -   `503 Service Unavailable`: AI service (OpenRouter) timeout or unavailable.
    -   `504 Gateway Timeout`: AI service took too long (respecting 5s timeout).

#### `GET /notes/{note_id}/plan`
-   **Description**: Retrieve the current plan (active or pending) associated with a note.
-   **HTTP Method**: `GET`
-   **URL Path**: `/notes/{note_id}/plan`
-   **Request Payload**: None
-   **Response Payload (JSON)**:
    ```json
    {
        "plan_id": "plan-uuid-or-id", 
        "note_id": 123,
        "plan_text": "Day 1: Eiffel Tower...", 
        "plan_type": "AI", 
        "plan_status": "ACTIVE", 
        "generation_id": "generated-plan-uuid-or-id", 
        "created_at": "2025-05-11T11:00:00Z",
        "updated_at": "2025-05-11T11:05:00Z"
    }
    ```
    Or `204 No Content` / `404 Not Found` if no plan exists yet.
-   **Success Codes**:
    -   `200 OK`: Plan retrieved successfully.
    -   `204 No Content`: No plan exists for this note yet.
-   **Error Codes**:
    -   `401 Unauthorized`: User not authenticated.
    -   `403 Forbidden`: User does not own this note.
    -   `404 Not Found`: Note with the given ID not found, or no plan associated and 204 is not used.

#### `POST /notes/{note_id}/plan`
-   **Description**: Create/Accept a plan for a note.
    -   If only `generation_id` is provided: Accepts the AI-generated plan proposal.
    -   If `generation_id` and `plan_text` are provided: Creates a hybrid plan (AI + manual).
    -   If only `plan_text` is provided: Creates a manual plan.
-   **HTTP Method**: `POST`
-   **URL Path**: `/notes/{note_id}/plan`
-   **Request Payload (JSON)**:
    ```json
    // For accepting AI plan:
    {
        "generation_id": "generated-plan-uuid-or-id",
    }
    // For hybrid plan:
    {
        "generation_id": "generated-plan-uuid-or-id",
        "plan_text": "Day 1: Eiffel Tower..." // passed in case of manual plan editing then the plan type is Hybrid.
    }
    // For creating manual plan:
    {
        "plan_text": "Manually created plan details..." 
    }
    ```
-   **Response Payload (JSON)**: (The created/accepted plan object, similar to `GET /notes/{note_id}/plan` response)
-   **Success Codes**:
    -   `201 Created`: Plan created/accepted successfully.
-   **Error Codes**:
    -   `400 Bad Request`: Invalid input (e.g., missing `plan_text` for manual, or `generation_id` not found/invalid).
    -   `401 Unauthorized`: User not authenticated.
    -   `403 Forbidden`: User does not own this note.
    -   `404 Not Found`: Note or `generation_id` not found.
    -   `409 Conflict`: An active plan already exists and system doesn't allow overwrite via POST (PUT should be used for update).
    -   `422 Unprocessable Entity`: Validation error (e.g. `plan_text` too long).

#### `PUT /notes/{note_id}/plan`
-   **Description**: Update the existing active plan for a note. If an AI plan is edited, its type may change to 'HYBRID'.
-   **HTTP Method**: `PUT`
-   **URL Path**: `/notes/{note_id}/plan`
-   **Request Payload (JSON)**:
    ```json
    {
        "plan_text": "Updated plan text..." 
    }
    ```
-   **Response Payload (JSON)**: (The updated plan object)
-   **Success Codes**:
    -   `200 OK`: Plan updated successfully.
-   **Error Codes**:
    -   `400 Bad Request`: Invalid input data.
    -   `401 Unauthorized`: User not authenticated.
    -   `403 Forbidden`: User does not own this note.
    -   `404 Not Found`: Note or active plan for the note not found.
    -   `422 Unprocessable Entity`: Validation error (e.g. `plan_text` too long).

## 3. Authentication and Authorization

-   **Mechanism**: JSON Web Tokens (JWT).
-   **Implementation**:
    -   FastAPI Users will handle JWT generation upon login (`/auth/jwt/login`) and token verification.
    -   Tokens will have a 30-day validity period as per PRD.
    -   All endpoints (except `/auth/jwt/register` and `/auth/jwt/login`) will require a valid JWT in the Cookie 
    -   Authorization logic within each endpoint will ensure that users can only access or modify their own resources (e.g., their own notes, profile, plans). This is typically done by comparing the `user_id` from the JWT with the `user_id` associated with the resource.

## 4. Validation and Business Logic

### Validation Conditions:

-   **UserProfile**:
    -   `travel_style`: Must be one of `RELAX`, `ADVENTURE`, `CULTURE`, `PARTY`, or `null`.
    -   `preferred_pace`: Must be one of `CALM`, `MODERATE`, `INTENSE`, or `null`.
    -   `budget`: Must be one of `LOW`, `MEDIUM`, `HIGH`, or `null`.
-   **Note**:
    -   `title`: Required, string, length 3-255 characters. Must be unique per user.
    -   `place`: Required, string, length 3-255 characters.
    -   `date_from`: Required, valid date.
    -   `date_to`: Required, valid date. Must be `date_from <= date_to`. The duration `date_to - date_from` must be <= 14 days.
    -   `number_of_people`: Required, integer, between 1 and 20 (inclusive).
    -   `key_ideas`: Optional string, max length 5000 characters (as per PRD).
-   **Plan**:
    -   `plan_text`: Required when creating/updating manually or when AI generates and user modifies it, string, max length 5000 characters.
    -   `generation_id`: Required string when accepting an AI plan.

Validation will be primarily handled by Pydantic models in FastAPI request bodies. Custom validators will be used for complex rules like date comparisons or uniqueness checks per user.

### Business Logic Implementation:

-   **User Ownership**: All resources (`Note`, `UserProfile`, `Plan`) are tied to a `user_id`. API endpoints will enforce that the authenticated user can only operate on their own resources.
-   **Note Title Uniqueness**: The service layer for creating/updating notes will check if the `title` is unique for the authenticated user.
-   **Date Logic for Notes**: `date_from <= date_to` and `(date_to - date_from).days <= 14` will be validated.
-   **AI Plan Generation**: The `POST /notes/{note_id}/plan/generate` endpoint will:
    1.  Authenticate the user and verify note ownership.
    2.  Fetch note details and user profile preferences.
    3.  Call the OpenRouter SDK with the combined information.
    4.  Handle a 5-second timeout for the OpenRouter call.
    5.  Store the AI-generated plan text in a `Plan` record with `status='PENDING_AI'`, `type='AI'`, and a unique `generation_id`.
    6.  Return the `generation_id` and `plan_text`.
-   **Plan Acceptance**: `POST /notes/{note_id}/plan` with `generation_id` will:
    1.  Find the `Plan` record by `generation_id` for that note with `status='PENDING_AI'`.
    2.  Change its status to `ACTIVE`.
-   **Plan Hybrid Creation**: `POST /notes/{note_id}/plan` with `generation_id` and `plan_text`:
    1.  Finds the `Plan` record by `generation_id` for that note with `status='PENDING_AI'`.
    2.  Updates its status to `ACTIVE`.
    3.  Creates a new `Plan` record with the provided `plan_text`, setting its type to `HYBRID`.
-   **Manual Plan Creation**: `POST /notes/{note_id}/plan` without `generation_id` (but with `plan_text`):
    1.  Creates a new `Plan` record with `type='MANUAL'` and `status='ACTIVE'`.
-   **Plan Editing**: `PUT /notes/{note_id}/plan`:
    1.  Updates the `plan_text` of the `ACTIVE` plan for the note.
    2.  If the plan's original `type` was `AI`, its `type` is changed to `HYBRID`.
-   **Note Deletion Cascade**: `DELETE /notes/{note_id}` will also delete the associated `Plan` record(s) (as per PRD US-009). This can be handled by database cascade (`ON DELETE CASCADE`) or explicitly in the service layer.
-   **HTTP Status Codes**: Endpoints will use appropriate HTTP status codes as defined (e.g., `200 OK`, `201 Created`, `204 No Content`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `422 Unprocessable Entity`).
