# API Endpoint Implementation Plan: POST /notes/{note_id}/plan/generate

## 1. Endpoint Overview
This endpoint allows users to generate an AI-powered travel plan proposal based on a specific note. The system will use the OpenRouter AI service to analyze the note content and user preferences to create a detailed travel plan. The generated plan proposal will be stored with a status of `PENDING_AI` and can later be accepted, modified, or replaced by a new generation.

## 2. Request Details
- **HTTP Method**: `POST`
- **URL Structure**: `/notes/{note_id}/plan/generate`
- **Parameters**:
  - **Required**: 
    - `note_id` (path parameter): The ID of the note for which to generate a plan
  - **Optional**: None
- **Request Body**: None
- **Authentication**: JWT token required in cookie (handled by FastAPI Users)

## 3. Required Types

### DTOs
- `GeneratePlanInDTO`: Contains note_id and user_id
- `GeneratePlanOutDTO`: Contains generation_id, plan_text, and status

### Models
- Use existing `Plan` model
- Use existing `PlanGenerateOutSchema` for API response

## 4. Response Details
- **Status Code**: `201 Created` on successful plan proposal generation
- **Response Body**:
  ```json
  {
    "generation_id": "550e8400-e29b-41d4-a716-446655440000",
    "plan_text": "Day 1: Morning - Eiffel Tower...",
    "status": "PENDING_AI"
  }
  ```
- **Response Format**: JSON as per the PlanGenerateOutSchema
- **Error Responses**:
  - `401 Unauthorized`: User not authenticated
  - `404 Not Found`: Note with given ID not found or does not belong to the user
  - `500 Internal Server Error`: Error during plan generation
  - `503 Service Unavailable`: OpenRouter service unavailable
  - `504 Gateway Timeout`: OpenRouter service timeout

## 5. Data Flow
1. The API endpoint receives the request with note_id.
2. The endpoint validates user authentication and authorization to access the note.
3. The generate plan use case is executed with the provided note_id and authenticated user_id.
4. The use case retrieves the note details from the note repository.
5. A mock AI service generates a travel plan proposal based on note content (in future this will use the OpenRouter SDK).
6. The use case creates a new plan proposal with status `PENDING_AI` and type `AI` using the plan repository.
7. The endpoint returns the plan proposal details to the client.

## 6. Security Considerations
1. **Authentication**: Use the existing JWT token authentication mechanism.
2. **Authorization**: Verify that the authenticated user owns the note before generating a plan.
3. **Input Validation**: Validate that the note exists and belongs to the authenticated user.
4. **Error Handling**: Implement proper error handling for HTTP errors and business logic exceptions.
5. **Rate Limiting**: Consider adding rate limiting to prevent abuse of the AI service.
6. **Service Timeout**: Implement a 5-second timeout for the AI generation service as specified.
7. **API Key Security**: When integrated with OpenRouter, ensure API keys are securely stored in environment variables.

## 7. Error Handling
- **Note Not Found**:
  - Create a `NoteNotFoundError` exception to be raised by the repository layer
  - Handle in API layer by converting to HTTPException with status code 404
- **Plan Generation Error**:
  - Create `PlanGenerationError` exception for errors during plan generation
  - Handle in API layer by converting to HTTPException with status code 500
- **OpenRouter Service Unavailable**:
  - Create `AIServiceUnavailableError` exception for when the AI service is unavailable
  - Handle in API layer by converting to HTTPException with status code 503
- **OpenRouter Timeout**:
  - Create `AIServiceTimeoutError` exception for when the AI service times out
  - Handle in API layer by converting to HTTPException with status code 504

## 8. Performance Considerations
1. **Asynchronous Processing**: Use async/await for all database operations to avoid blocking the event loop.
2. **Timeout Management**: Ensure the 5-second timeout for the AI service is properly enforced.
3. **Database Efficiency**: Use optimized queries to retrieve note data.
4. **Error Recovery**: Implement proper error handling and database transaction rollback on failure.
5. **Monitoring**: Add logging for performance monitoring and debugging.

## 9. Implementation Steps

### 1. Create Plan Repository
- Develop a `PlanRepository` class with a method to create plan proposals
- Include method for storing AI-generated plans with status `PENDING_AI`

### 2. Create AI Generation Service
- Develop a mock `AIGenerationService` class that simulates AI plan generation
- Include timeout handling and appropriate error scenarios
- Design for future replacement with actual OpenRouter SDK integration

### 3. Create Use Case for Plan Generation
- Develop a `GeneratePlanUseCase` class that orchestrates:
  - Retrieving note details
  - Generating plan using AI service
  - Storing the plan with appropriate status
  - Returning DTO with generation results

### 4. Create DTOs for Plan Generation
- Define input and output DTOs for the use case
- Ensure proper data transfer between layers

### 5. Create Custom Exceptions
- Define exceptions for various error scenarios
- Ensure exceptions provide meaningful error messages

### 6. Configure Dependencies
- Set up dependency injection for repositories and services
- Create factory functions for use case instantiation

### 7. Implement API Endpoint
- Create the endpoint in the plans router
- Handle authentication and authorization
- Implement error handling by converting domain exceptions to HTTP responses
- Return appropriate status codes and response bodies

### 8. Update Routes Configuration
- Ensure the new endpoint is registered in the application routes
