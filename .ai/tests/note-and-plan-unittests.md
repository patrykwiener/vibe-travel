# Unit Test Cases Summary - VibeTravels

## Overview

This document outlines the comprehensive unit test cases for **Note Management** and **Plan Generation** functionalities in the VibeTravels application. These test cases cover both backend (Python/pytest) and frontend (Vitest) components following clean architecture principles.

## 🗒️ Note Management Test Cases

### Backend Unit Tests (Python/pytest)

#### 1. Create Note Use Case
**File:** `backend/tests/unit/usecases/test_create_note_usecase.py`

**Test Scenarios:**
- ✅ **Success Case** - Valid note creation with all required fields
- ❌ **Empty Title Validation** - Should raise `ValueError` for empty/whitespace title
- ❌ **Invalid Date Range** - End date before start date should raise `InvalidDateRangeError`
- ❌ **Past Dates Validation** - Dates in the past should raise `InvalidDateRangeError`
- ❌ **Invalid People Count** - Zero or negative people count should raise `ValueError`
- ❌ **Destination Validation** - Empty destination should raise `InvalidDestinationError`
- ❌ **Text Length Limits** - Key ideas exceeding max length should raise `ValueError`
- 🔒 **User Authorization** - Note created for correct user_id
- 📊 **Repository Interaction** - Verify repository.create() called with correct data

**Test Coverage:**
```python
# Use Case Logic
- validate_note_data()
- execute_creation()
- handle_validation_errors()

# Business Rules
- date_range_validation()
- title_requirements()
- people_count_limits()
- destination_format()
```

#### 2. Update Note Use Case
**File:** `backend/tests/unit/usecases/test_update_note_usecase.py`

**Test Scenarios:**
- ✅ **Success Case** - Valid note update with changed fields
- ❌ **Note Not Found** - Should raise `NoteNotFoundError` for non-existent note
- 🔒 **Ownership Validation** - User can only update their own notes
- ❌ **Same Validation Rules** - All create validations apply to updates
- 📊 **Partial Updates** - Only changed fields are updated in repository

#### 3. Delete Note Use Case
**File:** `backend/tests/unit/usecases/test_delete_note_usecase.py`

**Test Scenarios:**
- ✅ **Success Case** - Note successfully deleted
- ❌ **Note Not Found** - Should raise `NoteNotFoundError`
- 🔒 **Ownership Validation** - User can only delete their own notes
- 📊 **Repository Interaction** - Verify repository.delete() called

#### 4. Search Notes Use Case
**File:** `backend/tests/unit/usecases/test_search_notes_usecase.py`

**Test Scenarios:**
- ✅ **Success Case** - Find notes by title substring
- ✅ **Case Insensitive Search** - Should find notes regardless of case
- ✅ **Empty Results** - Return empty list when no matches
- ✅ **User Filtering** - Only return notes belonging to the user
- 📊 **Repository Interaction** - Verify search parameters passed correctly

#### 5. Note Repository Tests
**File:** `backend/tests/unit/repositories/test_note_repository.py`

**Test Scenarios:**
- ✅ **CRUD Operations** - Create, read, update, delete functionality
- 🔍 **Search Methods** - Title search, user filtering
- ❌ **Database Constraints** - Foreign key violations, unique constraints
- 📊 **Query Optimization** - Efficient database queries

### Frontend Unit Tests (Vitest)

#### 1. useCreateNote Composable
**File:** `frontend/tests/unit/composables/useCreateNote.test.ts`

**Test Scenarios:**
- ✅ **Success Case** - Note created and returned
- ❌ **Client-side Validation** - Validate before API call
- 🔄 **Loading States** - isLoading true during request, false after
- ❌ **API Error Handling** - Network errors handled gracefully
- 📊 **Form Data Transformation** - Dates formatted correctly for API

**Test Coverage:**
```typescript
// Composable Functions
- createNote()
- validateNoteData()
- handleApiErrors()
- formatDatesForApi()

// State Management
- isLoading
- error
- validationErrors
```

#### 2. useUpdateNote Composable
**File:** `frontend/tests/unit/composables/useUpdateNote.test.ts`

**Test Scenarios:**
- ✅ **Success Case** - Note updated successfully
- ❌ **Validation Errors** - Handle validation from backend
- 🔄 **Optimistic Updates** - UI updates immediately, rollback on error
- ❌ **Conflict Handling** - Handle concurrent update scenarios

#### 3. Notes Store (Pinia)
**File:** `frontend/tests/unit/stores/notesStore.test.ts`

**Test Scenarios:**
- ✅ **State Management** - Notes list maintained correctly
- 🔍 **Search Functionality** - Real-time filtering with debounce
- 📄 **Pagination** - Handle large note lists
- 🔄 **CRUD Operations** - All operations update store state
- ❌ **Error States** - Error handling for all operations

**Test Coverage:**
```typescript
// Store Actions
- fetchNotes()
- createNote()
- updateNote()
- deleteNote()
- searchNotes()

// Store Getters
- filteredNotes
- searchResults
- isLoading
- currentNote

// State Mutations
- SET_NOTES
- ADD_NOTE
- UPDATE_NOTE
- REMOVE_NOTE
- SET_SEARCH_QUERY
```

## 🤖 Plan Generation Test Cases

### Backend Unit Tests (Python/pytest)

#### 1. Generate Plan Use Case
**File:** `backend/tests/unit/usecases/test_generate_plan_usecase.py`

**Test Scenarios:**
- ✅ **Success Case** - Plan generated from valid note
- ❌ **Note Not Found** - Should raise `NoteNotFoundError`
- 🔒 **Ownership Validation** - User can only generate plans for their notes
- ❌ **Missing User Preferences** - Should raise `UserPreferencesNotConfiguredError`
- 🤖 **AI Service Integration** - Verify OpenRouter service called correctly
- ❌ **AI Service Timeout** - Handle 30s timeout gracefully
- ❌ **AI Service Rate Limit** - Handle rate limiting errors
- ❌ **AI Service Failure** - Fallback to default plan template
- 📊 **Plan Persistence** - Generated plan saved to database
- 🏷️ **Plan Metadata** - Plan marked as "AI Generated" type

**Test Coverage:**
```python
# Use Case Logic
- validate_prerequisites()
- call_ai_service()
- handle_ai_response()
- save_generated_plan()

# Error Handling
- timeout_handling()
- rate_limit_handling()
- fallback_mechanisms()
```

#### 2. AI Service (OpenRouter Integration)
**File:** `backend/tests/unit/services/test_openrouter_service.py`

**Test Scenarios:**
- ✅ **Prompt Building** - User preferences + note data = correct prompt
- ✅ **Response Parsing** - AI response converted to structured plan
- ❌ **Malformed Response** - Handle invalid AI responses
- ❌ **API Authentication** - Handle invalid API keys
- ❌ **Request Timeout** - 30s timeout handling
- 🔄 **Retry Logic** - Automatic retry for transient failures
- 📊 **Token Usage Tracking** - Monitor API usage

**Test Coverage:**
```python
# Service Methods
- build_travel_prompt()
- call_openrouter_api()
- parse_ai_response()
- handle_api_errors()

# Configuration
- api_key_validation()
- endpoint_configuration()
- timeout_settings()
```

#### 3. Edit Plan Use Case
**File:** `backend/tests/unit/usecases/test_edit_plan_usecase.py`

**Test Scenarios:**
- ✅ **Success Case** - Plan content updated
- ❌ **Plan Not Found** - Should raise `PlanNotFoundError`
- 🔒 **Ownership Validation** - User can only edit their plans
- 🏷️ **Type Change** - Plan type changes from "AI Generated" to "Hybrid"
- 📝 **Version History** - Changes tracked in history
- 📊 **Content Validation** - Plan content meets format requirements

#### 4. Plan Repository Tests
**File:** `backend/tests/unit/repositories/test_plan_repository.py`

**Test Scenarios:**
- ✅ **CRUD Operations** - Create, read, update, delete functionality
- 🏷️ **Plan Type Management** - Handle different plan types
- 📝 **Version Tracking** - History and versioning
- 🔗 **Note Association** - Plan-note relationships

### Frontend Unit Tests (Vitest)

#### 1. useGeneratePlan Composable
**File:** `frontend/tests/unit/composables/useGeneratePlan.test.ts`

**Test Scenarios:**
- ✅ **Success Case** - Plan generated and displayed
- 🔄 **Loading States** - Show progress during 30s generation
- ❌ **Timeout Handling** - Handle 30s timeout with user message
- ❌ **API Errors** - Network and validation errors
- 🔄 **Progress Indicators** - Show generation progress to user
- ❌ **User Cancellation** - Allow user to cancel generation

**Test Coverage:**
```typescript
// Composable Functions
- generatePlan()
- cancelGeneration()
- handleTimeout()
- showProgress()

// State Management
- isGenerating
- progress
- error
- generatedPlan
```

#### 2. usePlanEditor Composable
**File:** `frontend/tests/unit/composables/usePlanEditor.test.ts`

**Test Scenarios:**
- ✅ **Success Case** - Plan edited and saved
- 🔄 **Auto-save** - Periodic saving of changes
- 📝 **Change Tracking** - Track unsaved changes
- ❌ **Concurrent Editing** - Handle multiple editors
- 🎨 **Rich Text Editing** - Handle formatted content

#### 3. Plans Store (Pinia)
**File:** `frontend/tests/unit/stores/plansStore.test.ts`

**Test Scenarios:**
- ✅ **State Management** - Plans list and current plan
- 🔄 **Generation Status** - Track generation progress
- 🏷️ **Plan Types** - Handle different plan types (AI, Manual, Hybrid)
- 📝 **Edit States** - Track editing status and changes
- ❌ **Error Handling** - All error scenarios covered

**Test Coverage:**
```typescript
// Store Actions
- generatePlan()
- editPlan()
- savePlan()
- cancelGeneration()

// Store Getters
- currentPlan
- isGenerating
- generationProgress
- hasUnsavedChanges

// State Mutations
- SET_CURRENT_PLAN
- SET_GENERATION_STATUS
- UPDATE_PLAN_CONTENT
- SET_PLAN_TYPE
```

## Cross-Cutting Test Cases

### 1. Data Validation
**Files:** Various validation test files

**Test Scenarios:**
- 📅 **Date Formats** - ISO date format validation
- 🌍 **Destination Formats** - Valid destination strings
- 📊 **Data Serialization** - DTO transformations
- 🔤 **Text Encoding** - Unicode and special characters

### 2. Error Handling
**Files:** Error handling test files

**Test Scenarios:**
- 🌐 **Network Errors** - Connection failures, timeouts
- ⚠️ **Validation Errors** - Client and server-side validation
- 🔒 **Authorization Errors** - Unauthorized access attempts
- 📊 **Data Consistency** - Concurrent modification handling

### 3. Performance
**Files:** Performance test files

**Test Scenarios:**
- ⏱️ **Response Times** - All operations under performance thresholds
- 🔍 **Search Performance** - Efficient note searching
- 🤖 **AI Generation Time** - 30s timeout respected
- 💾 **Memory Usage** - Efficient data handling

### 4. Security
**Files:** Security test files

**Test Scenarios:**
- 🔒 **User Isolation** - Users can only access their data
- 🛡️ **Input Sanitization** - XSS and injection prevention
- 🔑 **Authentication** - JWT token validation
- 🚫 **Rate Limiting** - API abuse prevention

## Test Implementation Guidelines

### Backend Testing Patterns

```python
# Use Case Test Structure
class TestCreateNoteUseCase:
    def test_success_case(self):
        # Arrange - Mock dependencies
        # Act - Execute use case
        # Assert - Verify results

    def test_validation_error(self):
        # Arrange - Invalid data
        # Act & Assert - Expect exception

    @pytest.mark.parametrize("invalid_input,expected_error", [
        # Test multiple invalid inputs
    ])
    def test_parametrized_validation(self, invalid_input, expected_error):
        # Parameterized test for multiple scenarios
```

### Frontend Testing Patterns

```typescript
// Composable Test Structure
describe('useCreateNote', () => {
  it('should create note successfully', async () => {
    // Arrange - Mock API client
    // Act - Call composable function
    // Assert - Verify state and API calls
  })

  it('should handle validation errors', async () => {
    // Test error scenarios
  })
})

// Store Test Structure
describe('NotesStore', () => {
  beforeEach(() => {
    // Setup fresh store instance
  })

  it('should manage state correctly', () => {
    // Test state mutations and getters
  })
})
```

## Coverage Requirements

### Backend Coverage Targets
- **Use Cases:** 100% coverage (core business logic)
- **Repositories:** 95% coverage (data access layer)
- **Services:** 90% coverage (domain services)
- **Overall Backend:** ≥80% coverage

### Frontend Coverage Targets
- **Composables:** 95% coverage (business logic)
- **Stores:** 90% coverage (state management)
- **Utils:** 85% coverage (utility functions)
- **Overall Frontend:** ≥70% coverage

## Test Execution Strategy

### Development Phase
1. **TDD Approach** - Write tests before implementation
2. **Continuous Testing** - Run tests on every change
3. **Mock External Dependencies** - Isolate units under test

### CI/CD Integration
1. **Automated Test Runs** - On every commit and PR
2. **Coverage Reports** - Generate and track coverage metrics
3. **Quality Gates** - Block deployment if tests fail

### Test Maintenance
1. **Regular Updates** - Keep tests aligned with code changes
2. **Refactoring** - Improve test quality and maintainability
3. **Documentation** - Maintain test documentation

---

This comprehensive test plan ensures robust coverage of both Note Management and Plan Generation functionalities, following clean architecture principles and best practices for both backend and frontend testing.