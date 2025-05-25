# UI Architecture for VibeTravels

## 1. UI Structure Overview

The User Interface (UI) architecture for VibeTravels is designed using Vue.js 3 with the Composition API, TypeScript, Tailwind CSS 4, and the Flowbite 3 component library. Application state management will be handled by Pinia, with dedicated stores for authentication, user profile, notes, and plans. The application will be browser-based (desktop-first, latest Chrome), and all UI texts will be in English.

The main architectural principles are:
-   **Component-Based:** Clear separation into Views, reusable Components, and BaseComponents.
-   **Separation of Concerns:** API logic encapsulated in Vue Composables, state managed centrally by Pinia.
-   **Visual Consistency:** Extensive use of Flowbite 3 components.
-   **User Experience (UX):** Clear feedback (loading indicators, toasts), intuitive navigation, user-centric error handling.
-   **Accessibility:** Basic standards (semantic HTML, keyboard navigation, ARIA labels, focus management).
-   **Security:** JWT authentication, route protection.

## 2. View List

The following is a list of key application views:

---

### 1. Registration View (`RegisterView`)
-   **View Name:** `RegisterView`
-   **View Path:** `/register`
-   **Main Purpose:** Allow new users to create an account in the application.
-   **Key Information to Display:** Registration form (email address, password, password confirmation).
-   **Key View Components:**
    -   `RegistrationForm` (form component)
        -   `EmailInput` (email field)
        -   `PasswordInput` (password field, with strength validation)
        -   `PasswordInput` (password confirmation field)
    -   `SubmitButton` ("Register" button with loading state handling)
    -   Link to `LoginView` ("Already have an account? Login")
-   **UX, Accessibility, and Security Considerations:**
    -   **UX:** Clear validation error messages (e.g., "Passwords do not match", "Email already exists"). Redirect to `LoginView` upon successful registration (as per decision). Loading indicator on the button during processing.
    -   **Accessibility:** Correct labels (`<label>`) for all form fields. Password requirement hints. Validation errors associated with fields via `aria-describedby`. Focus set to the first form field on view entry.
    -   **Security:** HTTPS communication. Passwords are not stored in client-side application state.

---

### 2. Login View (`LoginView`)
-   **View Name:** `LoginView`
-   **View Path:** `/login`
-   **Main Purpose:** Allow registered users to log into the application.
-   **Key Information to Display:** Login form (email address, password).
-   **Key View Components:**
    -   `LoginForm` (form component)
        -   `EmailInput` (email field)
        -   `PasswordInput` (password field)
    -   `SubmitButton` ("Login" button with loading state handling)
    -   Link to `RegisterView` ("Don't have an account? Register")
-   **UX, Accessibility, and Security Considerations:**
    -   **UX:** Incorrect login message (e.g., "Invalid email or password"). Redirect to `NotesListView` (or last visited protected page) upon successful login. Loading indicator on the button.
    -   **Accessibility:** Correct labels for fields. Login errors announced to the user (e.g., via toast or message near the form). Focus on the first field.
    -   **Security:** HTTPS communication. JWT token received from API will be managed by `authStore` and stored securely (e.g., `localStorage` with appropriate precautions).

---

### 3. User Profile View (`UserProfileView`)
-   **View Name:** `UserProfileView`
-   **View Path:** `/profile` (protected route)
-   **Main Purpose:** Allow users to view and update their travel preferences.
-   **Key Information to Display:** Form with preference fields: `travel_style`, `preferred_pace`, `budget`. Date of last profile update.
-   **Key View Components:**
    -   `UserProfileForm` (form component)
        -   `SelectInput` for `travel_style` (options: Relax, Adventure, Culture, Party, Not specified)
        -   `SelectInput` for `preferred_pace` (options: Calm, Moderate, Intense, Not specified)
        -   `SelectInput` for `budget` (options: Low, Medium, High, Not specified)
    -   `SubmitButton` ("Save Profile" button with loading state handling)
    -   Display of `updated_at` date.
-   **UX, Accessibility, and Security Considerations:**
    -   **UX:** Feedback (Flowbite toast) after successful save ("Profile updated successfully"). `null` values from API (selected as "Not specified") will be displayed as "-" if a read-only mode were implemented (here it's an edit form). Loading indicator during data fetch and save.
    -   **Accessibility:** Labels for all `select` fields. Changes confirmed with a message for screen readers.
    -   **Security:** View accessible only to logged-in users (route protection by Vue Router).

---

### 4. Notes List View (`NotesListView`)
-   **View Name:** `NotesListView`
-   **View Path:** `/notes` (protected route, default after login)
-   **Main Purpose:** Display a list of the user's travel notes, allow searching, filtering, and navigation to note details or new note creation.
-   **Key Information to Display:** List of notes (each note as a card with title, place, dates, number of people). Search field.
-   **Key View Components:**
    -   `SearchInput` (text field for searching by title, with an "X" button to clear filter and refresh list)
    -   `NoteCard` (component for a single note in the list, clickable, leads to `NoteDetailView`)
    -   `CreateNoteButton` (button leading to `NoteCreateView`)
    -   "Endless Scroll" mechanism for loading more notes (10 at a time).
    -   `LoadingSpinner` (Flowbite spinner at the bottom of the list while loading more notes).
    -   "No notes found" message (when the list is empty or no search results).
    -   "All notes loaded." message (when all notes have been loaded).
-   **UX, Accessibility, and Security Considerations:**
    -   **UX:** Smooth loading of notes during scroll. Instant (debounced) list filtering upon typing in the search field. Clear indicator for no notes or end of list.
    -   **Accessibility:** Note cards are navigational elements (e.g., links) and keyboard accessible. Search field has a label. Loading indicators are appropriately announced (e.g., `aria-live`).
    -   **Security:** Access only for logged-in users. API ensures only notes belonging to the user are loaded.

---

### 5. Create Note View (`NoteCreateView`)
-   **View Name:** `NoteCreateView`
-   **View Path:** `/notes/new` (protected route)
-   **Main Purpose:** Allow users to create a new travel note.
-   **Key Information to Display:** Note creation form with fields: `title`, `place`, `date_from`, `date_to`, `number_of_people`, `key_ideas`.
-   **Key View Components:**
    -   `NoteForm` (reusable note form component)
        -   `TextInput` for `title` (validation: 3-255 chars, unique per user - uniqueness validated server-side)
        -   `TextInput` for `place` (validation: 3-255 chars)
        -   `DateInput` for `date_from` and `date_to` (format YYYY-MM-DD, validation: `date_from <= date_to <= date_from + 14 days`)
        -   `NumberInput` for `number_of_people` (validation: 1-20)
        -   `TextareaInput` for `key_ideas` (validation: max 5000 chars, with counter)
    -   `SubmitButton` ("Create Note" button with loading state handling)
    -   `CancelButton` ("Cancel" button, returns to `NotesListView`)
    -   Static helper texts under fields indicating constraints (e.g., "Title must be 3-255 characters long").
-   **UX, Accessibility, and Security Considerations:**
    -   **UX:** Client-side (basic, e.g., required fields) and server-side (detailed, e.g., title uniqueness) validation. Error messages displayed next to respective fields. Redirect to `NoteDetailView` of the newly created note upon success. Loading indicator on button. Focus on the first field with an error after server-side validation.
    -   **Accessibility:** All form fields have labels. Error messages are associated with fields via `aria-describedby`. `DateInput` components (Flowbite calendars) are keyboard accessible.
    -   **Security:** Access only for logged-in users.

---

### 6. Edit Note View (`NoteEditView`)
-   **View Name:** `NoteEditView`
-   **View Path:** `/notes/:noteId/edit` (protected route)
-   **Main Purpose:** Allow users to edit an existing travel note.
-   **Key Information to Display:** Note editing form, pre-filled with the selected note's data.
-   **Key View Components:**
    -   `NoteForm` (same as in `NoteCreateView`, filled with data)
    -   `SubmitButton` ("Save Changes" button with loading state handling)
    -   `CancelButton` ("Cancel" button, returns to `NoteDetailView`)
-   **UX, Accessibility, and Security Considerations:**
    -   **UX:** Similar to `NoteCreateView`. Redirect to `NoteDetailView` upon successful save. Loading indicator during note data fetch and saving changes.
    -   **Accessibility:** Similar to `NoteCreateView`.
    -   **Security:** Access only for logged-in users who own the note (verified by API; UI might block access if `noteStore` has no data or after a 403 error).

---

### 7. Note Detail View (`NoteDetailView`)
-   **View Name:** `NoteDetailView`
-   **View Path:** `/notes/:noteId` (protected route)
-   **Main Purpose:** Display details of a selected note and manage its associated travel plan (AI generation, manual editing, saving).
-   **Key Information to Display:**
    -   Note details section (read-only): `title`, `place`, `date_from`, `date_to`, `number_of_people`, `key_ideas`.
    -   Plan management section.
-   **Key View Components:**
    -   `NoteDisplaySection` (component displaying note data)
    -   `EditNoteButton` (button/link leading to `NoteEditView`)
    -   `DeleteNoteButton` (button opening a `ConfirmationModal` before deletion)
    -   `PlanSection` (main component for plan interaction):
        -   `PlanTypeLabel` (displays plan type: "Type: AI", "Type: MANUAL", "Type: HYBRID", dynamically updated)
        -   `PlanEditorTextarea` (`<textarea>` for entering/editing plan text, max 5000 chars)
        -   `CharacterCounter` (character counter for `PlanEditorTextarea`, e.g., "123 / 5000", turns red at limit)
        -   `GeneratePlanButton` ("Generate Plan" button, always active, with loading state and Flowbite spinner)
        -   `SaveChangesPlanButton` ("Save Changes" button, active if `planText` is modified or if an unsaved AI proposal exists; with loading state handling)
    -   `ConfirmationModal` (Flowbite modal, used for confirming note deletion and warning about overwriting AI plan)
-   **UX, Accessibility, and Security Considerations:**
    -   **UX:** Clear separation of note information from the interactive plan section. Smooth interactions for plan generation and editing. Clear messages (Flowbite toasts) about operation results (plan generated, saved, generation error, etc.). Warning modal (`OverwritePlanModal`) before overwriting an existing AI proposal in the editor if the user clicks "Generate Plan". Focus remains in the plan editor after saving.
    -   **Accessibility:** Logical heading structure for sections. All buttons have clear labels. Modals are accessible (focus management, Esc to close). Changes in `PlanTypeLabel` and `CharacterCounter` are accessible to screen readers (e.g., via `aria-live`).
    -   **Security:** Access only for logged-in users and note owners. Confirmation before critical operations (note deletion).

## 3. User Journey Map

Describes typical user flows through the application.

**A. New User (Registration and First Login):**
1.  User lands on the main page -> redirect to `LoginView`.
2.  `LoginView`: Clicks "Register" link -> navigates to `RegisterView`.
3.  `RegisterView`: Fills form (email, password, confirm password), clicks "Register".
    *   **Success:** "Registration successful" toast. Redirect to `LoginView` (as per decision).
    *   **Error:** Validation errors displayed next to form fields.
4.  `LoginView`: Fills form with registration credentials, clicks "Login".
    *   **Success:** JWT token is stored (`authStore`). Redirect to `NotesListView`. "Login successful" toast.
    *   **Error:** Error message displayed (e.g., "Invalid credentials").
5.  `NotesListView`: User sees an empty list of notes (or a prompt to create the first one).
6.  (Optional) User navigates to `UserProfileView` (e.g., via user menu in header).
7.  `UserProfileView`: User fills in their preferences, clicks "Save Profile".
    *   **Success:** "Profile updated successfully" toast.
    *   **Error:** Error message toast.

**B. Main Use Case: Creating a Note, Generating AI Plan, Editing, and Saving:**
1.  User is logged in and on `NotesListView`.
2.  Clicks `CreateNoteButton` -> navigates to `NoteCreateView`.
3.  `NoteCreateView`: Fills note details (`title`, `place`, `dates`, `key_ideas`, etc.), clicks "Create Note".
    *   **Success:** Note is created via API. Redirect to `NoteDetailView` for the new note. "Note created successfully" toast.
    *   **Error:** Validation errors displayed next to fields.
4.  `NoteDetailView` (for new note, plan section is empty):
    *   User views note details.
    *   In `PlanSection`, clicks `GeneratePlanButton`.
        *   If `planText` exists in `planStore` (e.g., from a previous, unsaved AI proposal that was modified) or `currentPlanType` is `AI`/`HYBRID`, a `ConfirmationModal` appears asking to overwrite.
            *   User selects "Overwrite and Generate": process continues.
            *   User selects "Cancel": modal closes, focus returns to `GeneratePlanButton`.
        *   `GeneratePlanButton` shows a loading indicator and is disabled.
        *   API `POST /notes/:noteId/plan/generate` is called.
        *   **API Success (HTTP 201):**
            *   Received `plan_text` is displayed in `PlanEditorTextarea`.
            *   `generation_id` is stored in `planStore`.
            *   `currentPlanType` in `planStore` is set to `AI`.
            *   `originalPlanText` in `planStore` is set to the received text.
            *   `isModified` in `planStore` is set to `false`.
            *   `SaveChangesPlanButton` becomes active (as there's an unsaved AI proposal).
            *   "AI plan generated successfully" toast.
        *   **API Error (e.g., timeout, 5xx):**
            *   "Failed to generate plan. Please try again." toast.
            *   `GeneratePlanButton` is re-enabled.
5.  `NoteDetailView` (with generated AI plan in `PlanEditorTextarea`):
    *   User reviews the plan.
    *   **Scenario 1: Save AI plan without changes.**
        *   User clicks `SaveChangesPlanButton` (which is active).
        *   API `POST /notes/:noteId/plan` is called with `generation_id` and `plan_text`.
        *   **API Success:** `plan_id` is stored in `planStore`, `generation_id` is cleared. "Plan saved successfully" toast. `isModified` to `false`.
    *   **Scenario 2: Edit AI plan and save as HYBRID.**
        *   User modifies text in `PlanEditorTextarea`.
        *   `isModified` in `planStore` becomes `true`.
        *   `currentPlanType` in `planStore` changes to `HYBRID`.
        *   `SaveChangesPlanButton` is (or remains) active.
        *   User clicks `SaveChangesPlanButton`.
        *   API `POST /notes/:noteId/plan` is called with the original `generation_id` (if it was a modification of an AI proposal) and new `plan_text`.
        *   **API Success:** `plan_id` stored, `generation_id` cleared. `currentPlanType` confirmed as `HYBRID`. "Plan saved successfully" toast.
    *   **Scenario 3: Reject AI proposal and create a manual plan.**
        *   User clears `PlanEditorTextarea` and starts writing their own plan.
        *   `isModified` to `true`. `currentPlanType` to `MANUAL`. `generation_id` is ignored or cleared.
        *   Clicks `SaveChangesPlanButton`.
        *   API `POST /notes/:noteId/plan` is called with `plan_text` (without `generation_id`).
        *   **API Success:** `plan_id` stored. `currentPlanType` confirmed as `MANUAL`. "Plan saved successfully" toast.
6.  `NoteDetailView` (with a saved plan):
    *   User can edit the plan again. Changes activate `SaveChangesPlanButton`.
    *   Clicking `SaveChangesPlanButton` will call `PUT /notes/:noteId/plan` (using `plan_id` from `planStore`).
    *   **API Success:** "Plan updated successfully" toast.

**C. Deleting a Note:**
1.  User is on `NoteDetailView` or `NotesListView` (if delete button were available there).
2.  Clicks `DeleteNoteButton` (in `NoteDetailView`).
3.  `ConfirmationModal` appears ("Are you sure you want to delete this note? This will also delete any associated plan.").
4.  User clicks "Delete".
    *   API `DELETE /notes/:noteId` is called.
    *   **API Success:** Note and plan are deleted. Redirect to `NotesListView`. "Note deleted successfully" toast.
    *   **API Error:** Error toast.
5.  User clicks "Cancel" in modal: modal closes, nothing happens.

## 4. Layout and Navigation Structure

*   **Main Application Layout (`AppLayout.vue`):**
    *   This component will wrap all views after login.
    *   It will contain:
        *   `AppHeader.vue`: Top navigation bar.
        *   Main content area for the view (`<router-view>`).
        *   `ToastContainer.vue`: Global container for toast notifications (Flowbite Toasts, e.g., top-right).
*   **Navigation for Unauthenticated Users:**
    *   Available paths: `/login`, `/register`.
    *   Attempting to access a protected path (e.g., `/notes`) results in a redirect to `/login`.
*   **Navigation for Authenticated Users (`AppHeader.vue`):**
    *   **Application Logo (VibeTravels):** Link to `NotesListView` (`/notes`).
    *   **"My Notes":** Link to `NotesListView` (`/notes`).
    *   **"My Profile":** Link to `UserProfileView` (`/profile`).
    *   **"Logout" (button):**
        *   Calls logout action in `authStore` (clears JWT token, resets user state).
        *   Redirects to `LoginView` (`/login`).
*   **In-View Navigation:**
    *   From `NotesListView`:
        *   Clicking a `NoteCard` -> navigates to `NoteDetailView` (`/notes/:noteId`).
        *   Clicking `CreateNoteButton` -> navigates to `NoteCreateView` (`/notes/new`).
    *   From `NoteDetailView`:
        *   Clicking `EditNoteButton` -> navigates to `NoteEditView` (`/notes/:noteId/edit`).
    *   "Cancel" buttons in forms (`NoteCreateView`, `NoteEditView`) typically lead to the previous view (e.g., `NotesListView` or `NoteDetailView`) or use `router.back()`.
*   **Vue Router:**
    *   Manages all application routes.
    *   Navigation guards to protect routes requiring authentication (checking JWT presence and validity in `authStore`).
    *   404 error handling for non-existent routes (e.g., redirect to `NotesListView` or a dedicated 404 view).

## 5. Key Components

A list of key, reusable UI components that will be used across various parts of the application:

*   **`AppHeader.vue`**:
    *   Description: Main application navigation bar displayed to logged-in users. Contains logo, navigation links, and logout button.
*   **`NoteForm.vue`**:
    *   Description: Form used for creating (`NoteCreateView`) and editing (`NoteEditView`) notes. Contains note field validation logic and emits save/cancel events.
    *   Includes sub-components: `TextInput.vue`, `DateInput.vue` (with Flowbite datepicker), `NumberInput.vue`, `TextareaInput.vue`.
*   **`PlanSection.vue`**:
    *   Description: Central component in `NoteDetailView` responsible for displaying, AI generating, editing, and saving the travel plan. Manages plan editor state, plan type, and interactions with the plan API.
    *   Includes: `PlanEditorTextarea.vue`, `GeneratePlanButton.vue`, `SaveChangesPlanButton.vue`, `PlanTypeLabel.vue`, `CharacterCounter.vue`.
*   **`NoteCard.vue`**:
    *   Description: Card component displaying summary information for a single note in the `NotesListView`. It's clickable and leads to `NoteDetailView`.
*   **`ConfirmationModal.vue`**:
    *   Description: Generic modal component (Flowbite Modal) used to get user confirmation before critical actions (e.g., deleting a note, overwriting a
