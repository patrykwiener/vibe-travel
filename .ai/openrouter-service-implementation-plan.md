# OpenRouter Service Implementation Plan

## 1. Overview

OpenRouter Service is an infrastructure service component responsible for communication with OpenRouter.ai, providing access to various AI models (OpenAI, Anthropic, Google, etc.) for converting simple travel notes into detailed travel plans. The service uses OpenAI SDK for type-safe communication with the API.

Key responsibilities:

- Managing communication with OpenRouter API through OpenAI SDK
- Structuring chat completion messages
- Error handling and timeout management
- Maintaining connection and configuration settings
- Providing a clean interface for use case layer integration

The prompt building is handled by a separate domain service to maintain clean architecture principles.

## 2. Constructor

The service constructor will accept required configuration parameters:

```python
def __init__(
    self,
    api_key: str,
    model: str,
    timeout_seconds: int = 5,
    default_model: str = "openai/gpt-3.5-turbo",
    max_tokens: int = 2000,
    temperature: float = 0.7
):
    """
    Initialize the OpenRouter service.
    
    Args:
        api_key: OpenRouter API key
        model: Model ID to use for generations
        timeout_seconds: Request timeout in seconds (default 5s)
        default_model: Default model ID to use for generations
        max_tokens: Maximum tokens in response
        temperature: Creativity parameter (higher = more random)
    
    Raises:
        ValueError: If API key is missing or invalid
    """
```

## 3. Public Methods and Fields

### 3.1 `async def generate_plan`

Main method for generating travel plans:

```python
async def generate_plan(
    self,
    ai_prompt: AIPrompt,
    max_tokens: int | None = None,
    temperature: float | None = None
) -> str:
    """
    Generate a travel plan from AI prompt.

    Args:
        ai_prompt: The AI prompt object containing prompt data
        max_tokens: Optional max tokens override
        temperature: Optional temperature override
    
    Returns:
        The generated travel plan text
        
    Raises:
        AIServiceTimeoutError: If request times out
        AIServiceUnavailableError: If service is unavailable
        PlanGenerationError: For other generation errors
    """
```

## 4. Private Methods and Fields

### 4.1 Fields

- `client: AsyncOpenAI` - OpenAI SDK client configured for OpenRouter
- `_model: str` - Model ID
- `_max_tokens: int` - Default max tokens
- `_temperature: float` - Default temperature

### 4.2 Methods

- `_build_messages()` - Builds chat completion messages from prompt and preferences
- `_handle_api_error()` - Maps OpenAI SDK errors to our domain exceptions
- `_validate_response()` - Validates completion response

## 5. Error Handling

The service implements comprehensive error handling:

1. **Connection Errors**
   - Network issues
   - DNS failures
   - Connection timeouts

2. **API Errors**
   - Authentication failures (401)
   - Rate limiting (429)
   - Server errors (500+)

3. **Timeouts**
   - Request timeouts (configurable)
   - Read/write timeouts

4. **Validation Errors**
   - Invalid input data
   - Response parsing failures

5. **Resource Errors**
   - Rate limits exceeded
   - Token limits exceeded
   - Financial limits reached

Custom exceptions:

- `AIServiceTimeoutError`
- `AIServiceUnavailableError`
- `PlanGenerationError`

## 6. Security Considerations

1. **API Key Security**
   - Store in environment variables
   - Never log or expose keys
   - Rotate keys periodically

2. **Rate Limiting**
   - Implement request throttling
   - Track usage per user
   - Set hard limits for resources

3. **Data Privacy**
   - Minimize personal data in prompts
   - Strip sensitive information
   - Use secure connections (HTTPS)

4. **Input Validation**
   - Sanitize user input
   - Validate request parameters
   - Prevent prompt injection

5. **Error Exposure**
   - Sanitize error messages
   - Log detailed errors internally
   - Return safe error messages to users

## 7. Implementation Steps

### 1. Environment Setup

a) Update config.py:

```python
# OpenRouter settings
OPENROUTER_API_KEY: str
OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
OPENROUTER_MODEL: str = "openai/gpt-3.5-turbo"
OPENROUTER_MAX_TOKENS: int = 2000
OPENROUTER_TEMPERATURE: float = 0.7
```

b) Update requirements.txt:

```python
# requirements.txt
pydantic-ai>=1.0.0
aiohttp>=3.9.1
```

### 2. Install OpenAI SDK

Install the OpenAI SDK and verify it's working:

```bash
pip install openai>=1.0.0
```

The OpenAI SDK provides all the necessary types and models for communication:

```python
from openai import AsyncOpenAI
from openai.types.chat import ChatCompletion, ChatCompletionMessageParam

# These types provide full type safety and validation
messages: list[ChatCompletionMessageParam] = [
    {"role": "system", "content": "You are a travel planner..."},
    {"role": "user", "content": "Plan a trip to..."}
]
```

### 3. Create Service Module

Create `backend/src/apps/plans/services/openrouter_service.py` implementing the service class as described in sections 2-4.

### 4. Setup Dependency Injection

Update `backend/src/apps/plans/dependencies.py`:

```python
from src.apps.plans.services.openrouter_service import OpenRouterService
from src.config import settings

def get_openrouter_service() -> OpenRouterService:
    return OpenRouterService(
        api_key=settings.OPENROUTER_API_KEY,
        model=settings.OPENROUTER_MODEL,
        timeout_seconds=settings.PLAN_GENERATION_TIMEOUT_SECONDS,
        default_model=settings.OPENROUTER_DEFAULT_MODEL,
        max_tokens=settings.OPENROUTER_MAX_TOKENS,
        temperature=settings.OPENROUTER_TEMPERATURE,
    )
```

### 5. Update PlanGenerationService

Update `backend/src/apps/plans/services/plan_generation_service.py` to use OpenRouterService:

```python
class PlanGenerationService:
    def __init__(self, timeout_seconds: int = settings.PLAN_GENERATION_TIMEOUT_SECONDS):
        self.timeout_seconds = timeout_seconds
        self._openrouter_service = None

    async def _ensure_openrouter_service(self) -> OpenRouterService:
        if self._openrouter_service is None:
            self._openrouter_service = OpenRouterService(
                api_key=settings.OPENROUTER_API_KEY,
                timeout_seconds=self.timeout_seconds
            )
        return self._openrouter_service

    async def generate_plan(self, note_content: str, user_preferences: Optional[Dict] = None) -> str:
        try:
            openrouter = await self._ensure_openrouter_service()
            return await openrouter.generate_plan(note_content, user_preferences)
        except Exception as e:
            raise PlanGenerationError(message=str(e))
```

### 8. Error Handling Setup

Create custom exceptions in `backend/src/apps/plans/exceptions.py`:

```python
class AIServiceError(Exception):
    """Base exception for AI service errors."""
    pass

class AIServiceTimeoutError(AIServiceError):
    def __init__(self, timeout_seconds: int):
        self.timeout_seconds = timeout_seconds
        super().__init__(f"AI service request timed out after {timeout_seconds} seconds")

class AIServiceUnavailableError(AIServiceError):
    def __init__(self):
        super().__init__("AI service is currently unavailable")

class PlanGenerationError(AIServiceError):
    def __init__(self, message: str):
        super().__init__(f"Plan generation failed: {message}")
```

### 9. Documentation Updates

a) Update OpenAPI documentation in API endpoints
b) Update README.md with new environment variables
c) Create ADR for OpenRouter integration

## Using OpenAI SDK

The implementation leverages OpenAI SDK for type-safe API communication:

1. Request/Response Handling
   - Uses OpenAI's built-in types for messages and parameters
   - Provides async support with AsyncOpenAI client
   - Built-in validation and error handling

2. Structured Completions
   - Uses ChatCompletion types for requests and responses
   - Built-in parameter validation
   - Proper error handling and timeouts

Example usage:

```python
from openai.types.chat import ChatCompletion, ChatCompletionMessageParam

async def generate_with_openai_sdk(self, messages: list[ChatCompletionMessageParam]) -> str:
    completion: ChatCompletion = await self.client.chat.completions.create(
        model=self._default_model,
        messages=messages,
        max_tokens=self._max_tokens,
        temperature=self._temperature,
    )
    return completion.choices[0].message.content or ""
```

## Integration Guidelines

1. **Error Handling**
   - Always wrap OpenRouter calls in try/except
   - Use custom exceptions for different error types
   - Log detailed errors, return user-friendly messages

2. **Performance**
   - Reuse HTTP sessions
   - Implement appropriate timeouts
   - Cache model information when possible

3. **Monitoring**
   - Log all API calls
   - Track token usage
   - Monitor error rates

4. **Testing**
   - Mock API responses in unit tests
   - Use integration tests for API validation
   - Test error scenarios thoroughly

## Domain Layer Components

### 1. AI Prompt Value Objects

Create `backend/src/apps/plans/domain/prompts.py`:

```python
from typing import List, Optional
from dataclasses import dataclass

@dataclass(frozen=True)
class Message:
    """Value object representing a single message in the conversation."""
    role: str
    content: str

@dataclass(frozen=True)
class AIPrompt:
    """Value object representing a complete prompt for AI generation."""
    messages: List[Message]
    model: str
    max_tokens: Optional[int] = None
    temperature: Optional[float] = None

    def with_model_params(self, max_tokens: Optional[int] = None, temperature: Optional[float] = None) -> 'AIPrompt':
        """Create new prompt with updated model parameters."""
        return AIPrompt(
            messages=self.messages,
            model=self.model,
            max_tokens=max_tokens or self.max_tokens,
            temperature=temperature or self.temperature
        )
```

### 2. Prompt Builder

Create `backend/src/apps/plans/domain/prompt_builder.py`:

```python
from typing import Dict, Optional
from src.apps.plans.domain.prompts import Message, AIPrompt

class TravelPlanPromptBuilder:
    """Domain service responsible for building travel plan prompts."""

    def __init__(self, model: str):
        self.model = model

    def build_prompt(self, note_content: str, user_preferences: Optional[Dict] = None) -> AIPrompt:
        """
        Build a complete prompt for travel plan generation.
        
        Args:
            note_content: Travel note content
            user_preferences: Optional user preferences to customize the plan
            
        Returns:
            AIPrompt object with all messages configured
        """
        messages = [
            self._build_system_message(user_preferences),
            self._build_user_message(note_content)
        ]

        return AIPrompt(messages=messages, model=self.model)

    def _build_system_message(self, user_preferences: Optional[Dict] = None) -> Message:
        """Build system message incorporating user preferences."""
        content = (
            "You are a travel planning assistant. Create detailed travel plans that include:"
            "\n- Daily activities and attractions"
            "\n- Dining recommendations"
            "\n- Accommodation suggestions"
            "\n- Transportation tips"
        )

        if user_preferences:
            pref_lines = []
            if user_preferences.get("budget"):
                pref_lines.append(f"Budget level: {user_preferences['budget']}")
            if user_preferences.get("pace"):
                pref_lines.append(f"Travel pace: {user_preferences['pace']}")
            if user_preferences.get("interests"):
                pref_lines.append(f"Interests: {', '.join(user_preferences['interests'])}")
            
            if pref_lines:
                content += "\n\nConsider these preferences:\n" + "\n".join(pref_lines)

        return Message(role="system", content=content)

    def _build_user_message(self, note_content: str) -> Message:
        """Build user message with note content."""
        return Message(
            role="user",
            content=(
                f"Create a detailed travel plan based on this note:\n\n{note_content}\n\n"
                "Organize the plan by days and include specific recommendations."
            )
        )
```

### 3. Updated Use Case Implementation

Update the use case to use the domain prompt builder with clean architecture:

```python
from src.apps.plans.domain.prompt_builder import TravelPlanPromptBuilder
from src.apps.plans.services.openrouter_service import OpenRouterService

class GenerateTravelPlanUseCase:
    """Application use case for generating travel plans."""
    
    def __init__(
        self,
        openrouter_service: OpenRouterService,
        prompt_builder: TravelPlanPromptBuilder
    ):
        self._openrouter_service = openrouter_service
        self._prompt_builder = prompt_builder
        
    async def execute(
        self,
        note_content: str,
        user_preferences: Optional[Dict] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None
    ) -> str:
        """
        Execute the use case to generate a travel plan.
        
        This method:
        1. Builds the prompt using domain service
        2. Configures generation parameters
        3. Calls infrastructure service
        4. Returns generated plan
        """
        # Build prompt using domain service
        prompt = self._prompt_builder.build_prompt(note_content, user_preferences)
        
        # Apply any generation parameter overrides
        if max_tokens is not None or temperature is not None:
            prompt = prompt.with_model_params(max_tokens, temperature)
            
        # Use infrastructure service to generate
        return await self._openrouter_service.generate(prompt)
```

### 4. Updated Dependency Injection

Update the dependency injection to include the prompt builder:

```python
from src.apps.plans.domain.prompt_builder import TravelPlanPromptBuilder
from src.apps.plans.services.openrouter_service import OpenRouterService
from src.apps.plans.usecases.generate_travel_plan import GenerateTravelPlanUseCase
from src.config import settings

def get_prompt_builder() -> TravelPlanPromptBuilder:
    return TravelPlanPromptBuilder(model=settings.OPENROUTER_MODEL)

def get_generate_travel_plan_use_case(
    openrouter_service: OpenRouterService = Depends(get_openrouter_service),
    prompt_builder: TravelPlanPromptBuilder = Depends(get_prompt_builder)
) -> GenerateTravelPlanUseCase:
    return GenerateTravelPlanUseCase(
        openrouter_service=openrouter_service,
        prompt_builder=prompt_builder
    )
```
