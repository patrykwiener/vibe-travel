# Product Requirements Document (PRD) - VibeTravels

## 1. Product Overview
VibeTravels is an MVP application for planning engaging trips by transforming simple notes into detailed travel itineraries using AI. Core features include note management, a user profile with travel preferences, and integration with an AI engine (OpenRouter).

## 2. User Problem
- Planning interesting trips requires time, knowledge, and creativity.
- Users struggle with finding attractions, logistics, and tailoring plans to their preferences.
- There's a lack of a tool that combines loose ideas into a coherent, ready-to-execute plan.

## 3. Functional Requirements
3.1 Notes (CRUD)
- fields:
  - `title`: 3–255 characters, unique per user
  - `place`: 3–255 characters
  - `date_from` and `date_to`: format DDMMYYYY, must satisfy `date_from ≤ date_to ≤ date_from + 14 days`
  - `number_of_people`: 1–20
  - `key_ideas`: max 5000 characters

3.2 User Profile
- optional fields: `travel_style`, `preferred_pace`, `budget` (nullable)
- user can save and update preferences

3.3 Notes List
- case-insensitive partial search by `title`
- offset/limit pagination
- display title, place, dates, and number of people

3.4 Plan Generation
- "Generate Plan" button triggers `POST /notes/:id/plan/generate`
- synchronization with OpenRouter SDK, 5s timeout
- result is text (≤ 5000 characters) with a breakdown by days/hours
- plan type: `AI` (automatically generated), `MANUAL` (manually entered), or `HYBRID` (combination of both)

3.5 Plan Management
- accepting a proposal saves the plan via `POST /notes/:id/plan` with `generation_id`
- editing the generated plan in the same editor
- rejecting clears the plan and allows for regeneration
- manual plan creation via `POST /notes/:id/plan` without `generation_id`

3.6 API and Validation
- `POST /notes/:id/plan/generate` → HTTP 201
- `POST /notes/:id/plan` → HTTP 201
- `plan_text` length validation ≤ 5000 characters
- handling validation errors (HTTP 4xx)

3.7 Authorization and Browser Support
- JWT with 30-day validity
- endpoints accessible only to authenticated users
- support only for the latest Chrome
- no offline mode or mobile support

## 4. Product Boundaries
- no sharing of plans between accounts
- no advanced multimedia processing
- no advanced logistics planning
- no password reset or email confirmation
- no support for multiple browsers or offline mode

## 5. User Stories
- ID: US-001
  Title: Registration and Login
  Description: As a new user, I want to create an account and log in to access my notes and trip plans.
  Acceptance Criteria:
    - The user can register by providing a unique email address and password.
    - After registration, the user is automatically logged in or redirected to the login screen.
    - The user can log in with correct credentials and receives a JWT token.
    - Attempting to log in with incorrect credentials displays an appropriate error message.

- ID: US-002
  Title: Completing Travel Profile
  Description: As a registered user, I want to fill in my preferences (travel style, pace, budget) so that AI generates tailored plans.
  Acceptance Criteria:
    - The profile includes fields: travel_style (choices: Relax, Adventure, Culture, Party), preferred_pace (choices: Calm, Moderate, Intense), budget (choices: Low, Medium, High). All fields are nullable and default to null.
    - The user can save and update their preferences.
    - Fields can remain empty.
    - Saving preferences is confirmed with a success message.

- ID: US-003
  Title: Creating a Trip Note
  Description: As an occasional traveler, I want to create a note (title, place, dates, number of people, ideas) to be able to generate a plan.
  Acceptance Criteria:
    - The user can create a note with the required fields.
    - Title and place have a length of 3–255 characters.
    - date_from ≤ date_to ≤ date_from + 14 days.
    - number_of_people is in the range of 1–20.
    - key_ideas max 5000 characters.
    - In case of invalid data, an error message is displayed, and no data is saved.

- ID: US-004
  Title: Browsing and Searching Notes
  Description: As a user, I want to browse a list of notes with a search function and pagination to quickly find an interesting note.
  Acceptance Criteria:
    - The list of notes displays the title, place, dates, and number of people.
    - Search works case-insensitively and with partial match on the title.
    - Offset/limit pagination allows navigating between pages.
    - No search results display a "No notes found" message.

- ID: US-005
  Title: Generating AI Plan
  Description: As a user, I want to generate a plan proposal based on a note and preferences to receive a detailed trip itinerary.
  Acceptance Criteria:
    - Clicking "Generate Plan" calls `POST /notes/:id/plan/generate`.
    - Generation uses OpenRouter SDK and completes within a maximum of 5 seconds.
    - AI returns plan text (≤ 5000 characters) with a breakdown by days/hours.
    - In case of an error or timeout, the user receives a message "An error occurred while generating the plan."
    - The button only generates a plan proposal. If the user does not accept it, the plan will not be saved or assigned to the note.

- ID: US-006
  Title: Accepting and Editing Plan
  Description: As a user, I want to accept or edit the generated plan before saving it.
  Acceptance Criteria:
    - The user can accept the plan, which saves it via `POST /notes/:id/plan` with the provided generation_id.
    - The user can edit the plan in the same editor and save it again.
    - After saving the plan, the "Generate Plan" button remains available for regenerating the same note.

- ID: US-007
  Title: Rejecting and Regenerating Plan
  Description: As a user, I want to reject a proposal that doesn't suit me and generate a new one.
  Acceptance Criteria:
    - The user can reject the plan proposal by pressing a button and then click "Generate Plan" again.
    - The interface clears the previous text before sending a new request.
    - Until the plan proposal is accepted, the plan is not assigned to the note; therefore, even after generating a new proposal, the previous one is not deleted until the new proposal is accepted.
    - The user can reject the plan and click "Generate Plan" again, which will generate a new plan.

- ID: US-008
  Title: Manual Plan Creation
  Description: As a user, I want to manually enter a plan if I am not using AI.
  Acceptance Criteria:
    - The absence of a generation_id in the request means manual plan saving.
    - The user can enter a plan up to 10000 characters long.
    - The manual plan is saved via `POST /notes/:id/plan` and displayed in the note view.

- ID: US-009
  Title: Deleting a Note
  Description: As a user, I want to delete an unnecessary note to keep things organized.
  Acceptance Criteria:
    - The user can delete a note via `DELETE /notes/:id`.
    - The system asks for confirmation before deletion.
    - After confirmation, the note is deleted and disappears from the list.
    - The corresponding plan is also deleted along with the note.

- ID: US-010
  Title: Session Management with JWT Token
  Description: As a user, I want my session to be secure and time-limited.
  Acceptance Criteria:
    - After logging in, the user receives a JWT token valid for 30 days.
    - Endpoints are accessible only after providing a valid token.
    - The token expires after 30 days, and the user is asked to log in again.

- ID: US-011
  Title: Note Data Validation
  Description: As a user, I want to receive clear error messages when providing invalid data.
  Acceptance Criteria:
    - For incorrect title lengths, dates, and number of people, error messages are displayed.
    - The backend returns HTTP 400 with a validation description.
    - The interface blocks saving the note if there are data errors.

## 6. Success Metrics
- 90% of users complete their preference profile (metric `profile_complete`)
- 75% of users generate at least 3 trip plans annually (metric `AI_generation_count`)