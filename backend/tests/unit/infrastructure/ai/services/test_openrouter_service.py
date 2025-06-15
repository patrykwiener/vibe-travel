"""Unit tests for OpenRouterService.

This module tests the OpenRouter AI service implementation following the test plan
guidelines from note-and-plan-unittests.md. Tests cover success cases, error handling,
timeout scenarios, and API integration patterns.
"""

from unittest.mock import AsyncMock, patch

import pytest
from openai import AsyncOpenAI
from openai.types.chat import ChatCompletion
from openai.types.chat.chat_completion import Choice
from openai.types.chat.chat_completion_message import ChatCompletionMessage
from openai.types.completion_usage import CompletionUsage

from src.insfrastructure.ai.exceptions import (
    AIModelError,
    AIServiceTimeoutError,
    AIServiceUnavailableError,
)
from src.insfrastructure.ai.prompts import AIPrompt, Message
from src.insfrastructure.ai.services.openrouter_service import OpenRouterService


@pytest.mark.unit
class TestOpenRouterServiceInitialization:
    """Test OpenRouterService initialization and configuration."""

    def test_successful_initialization(self):
        """Test successful service initialization with valid parameters."""
        # Arrange
        api_key = 'test_api_key_12345'
        base_url = 'https://openrouter.ai/api/v1'
        timeout_seconds = 30

        # Act
        service = OpenRouterService(
            api_key=api_key,
            base_url=base_url,
            timeout_seconds=timeout_seconds,
        )

        # Assert
        assert service._timeout_seconds == timeout_seconds
        assert service.client is not None
        assert isinstance(service.client, AsyncOpenAI)

    def test_initialization_with_empty_api_key_raises_error(self):
        """Test that empty API key raises ValueError during initialization."""
        # Arrange
        empty_api_key = ''
        base_url = 'https://openrouter.ai/api/v1'
        timeout_seconds = 30

        # Act & Assert
        with pytest.raises(ValueError, match='OpenRouter API key is required'):
            OpenRouterService(
                api_key=empty_api_key,
                base_url=base_url,
                timeout_seconds=timeout_seconds,
            )

    def test_initialization_with_none_api_key_raises_error(self):
        """Test that None API key raises ValueError during initialization."""
        # Arrange
        none_api_key = None
        base_url = 'https://openrouter.ai/api/v1'
        timeout_seconds = 30

        # Act & Assert
        with pytest.raises(ValueError, match='OpenRouter API key is required'):
            OpenRouterService(
                api_key=none_api_key,
                base_url=base_url,
                timeout_seconds=timeout_seconds,
            )

    @pytest.mark.parametrize(
        'timeout_seconds',
        [5, 10, 30, 60, 120],
    )
    def test_initialization_with_various_timeout_values(self, timeout_seconds):
        """Test initialization with different timeout values."""
        # Arrange
        api_key = 'test_api_key'
        base_url = 'https://openrouter.ai/api/v1'

        # Act
        service = OpenRouterService(
            api_key=api_key,
            base_url=base_url,
            timeout_seconds=timeout_seconds,
        )

        # Assert
        assert service._timeout_seconds == timeout_seconds


@pytest.mark.unit
class TestOpenRouterServiceGenerateCompletion:
    """Test OpenRouterService generate_completion method."""

    @pytest.fixture
    def service(self):
        """Create OpenRouterService instance for testing."""
        return OpenRouterService(
            api_key='test_api_key',
            base_url='https://openrouter.ai/api/v1',
            timeout_seconds=30,
        )

    @pytest.fixture
    def sample_prompt(self):
        """Create sample AIPrompt for testing."""
        return AIPrompt(
            messages=[
                Message(role='system', content='You are a travel planning assistant.'),
                Message(role='user', content='Plan a trip to Paris for 3 days.'),
            ],
            model='openai/gpt-3.5-turbo',
            max_tokens=1000,
            temperature=0.7,
        )

    @pytest.fixture
    def mock_completion_response(self):
        """Create mock ChatCompletion response."""
        return ChatCompletion(
            id='test_completion_id',
            object='chat.completion',
            created=1234567890,
            model='openai/gpt-3.5-turbo',
            choices=[
                Choice(
                    index=0,
                    message=ChatCompletionMessage(
                        role='assistant',
                        content=(
                            '# Paris Travel Plan\n\n'
                            'Day 1: Visit Eiffel Tower\n'
                            'Day 2: Louvre Museum\n'
                            'Day 3: Seine River cruise'
                        ),
                    ),
                    finish_reason='stop',
                )
            ],
            usage=CompletionUsage(
                prompt_tokens=45,
                completion_tokens=123,
                total_tokens=168,
            ),
        )

    @pytest.mark.asyncio
    async def test_successful_completion_generation(self, service, sample_prompt, mock_completion_response):
        """Test successful completion generation with valid prompt."""
        # Arrange
        from unittest.mock import AsyncMock

        async_mock = AsyncMock(return_value=mock_completion_response)

        with patch.object(service.client.chat.completions, 'create', async_mock):
            # Act
            result = await service.generate_completion(sample_prompt)

            # Assert
            assert result == (
                '# Paris Travel Plan\n\nDay 1: Visit Eiffel Tower\nDay 2: Louvre Museum\nDay 3: Seine River cruise'
            )
            async_mock.assert_called_once()

            # Verify the call arguments
            call_args = async_mock.call_args
            assert call_args.kwargs['model'] == 'openai/gpt-3.5-turbo'
            assert call_args.kwargs['max_tokens'] == 1000
            assert call_args.kwargs['temperature'] == 0.7
            assert len(call_args.kwargs['messages']) == 2

    @pytest.mark.asyncio
    async def test_completion_with_usage_logging(self, service, sample_prompt, mock_completion_response):
        """Test that completion logs usage information correctly."""
        # Arrange
        from unittest.mock import AsyncMock

        async_mock = AsyncMock(return_value=mock_completion_response)

        with patch.object(service.client.chat.completions, 'create', async_mock):
            # Act
            result = await service.generate_completion(sample_prompt)

            # Assert
            assert result is not None
            # Usage logging is verified through the response structure
            assert mock_completion_response.usage.total_tokens == 168

    @pytest.mark.asyncio
    async def test_completion_without_usage_information(self, service, sample_prompt):
        """Test completion handling when usage information is not provided."""
        # Arrange
        completion_without_usage = ChatCompletion(
            id='test_completion_id',
            object='chat.completion',
            created=1234567890,
            model='openai/gpt-3.5-turbo',
            choices=[
                Choice(
                    index=0,
                    message=ChatCompletionMessage(
                        role='assistant',
                        content='Travel plan content',
                    ),
                    finish_reason='stop',
                )
            ],
            usage=None,  # No usage information
        )

        from unittest.mock import AsyncMock

        async_mock = AsyncMock(return_value=completion_without_usage)

        with patch.object(service.client.chat.completions, 'create', async_mock):
            # Act
            result = await service.generate_completion(sample_prompt)

            # Assert
            assert result == 'Travel plan content'

    @pytest.mark.asyncio
    async def test_timeout_error_handling(self, service, sample_prompt):
        """Test handling of timeout errors during API calls."""
        # Arrange
        from unittest.mock import AsyncMock

        async_mock = AsyncMock(side_effect=TimeoutError('Request timed out'))

        with (
            patch.object(service.client.chat.completions, 'create', async_mock),
            pytest.raises(AIServiceTimeoutError) as exc_info,
        ):
            # Act
            await service.generate_completion(sample_prompt)

        assert exc_info.value.timeout_seconds == 30
        assert 'timed out after 30 seconds' in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_connection_error_handling(self, service, sample_prompt):
        """Test handling of connection errors during API calls."""
        # Arrange
        from unittest.mock import AsyncMock

        async_mock = AsyncMock(side_effect=ConnectionError('Connection failed'))

        with (
            patch.object(service.client.chat.completions, 'create', async_mock),
            pytest.raises(AIServiceUnavailableError),
        ):
            # Act
            await service.generate_completion(sample_prompt)

    @pytest.mark.asyncio
    async def test_generic_exception_handling(self, service, sample_prompt):
        """Test handling of unexpected exceptions during API calls."""
        # Arrange
        from unittest.mock import AsyncMock

        async_mock = AsyncMock(side_effect=Exception('Unexpected error'))

        with (
            patch.object(service.client.chat.completions, 'create', async_mock),
            pytest.raises(AIModelError) as exc_info,
        ):
            # Act
            await service.generate_completion(sample_prompt)

        assert 'Unexpected error' in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_empty_response_handling(self, service, sample_prompt):
        """Test handling of empty responses from the API."""
        # Arrange
        empty_completion = ChatCompletion(
            id='test_completion_id',
            object='chat.completion',
            created=1234567890,
            model='openai/gpt-3.5-turbo',
            choices=[],  # Empty choices
            usage=None,
        )

        from unittest.mock import AsyncMock

        async_mock = AsyncMock(return_value=empty_completion)

        with (
            patch.object(service.client.chat.completions, 'create', async_mock),
            pytest.raises(AIModelError, match='Empty response from AI service'),
        ):
            # Act
            await service.generate_completion(sample_prompt)

    @pytest.mark.asyncio
    async def test_empty_message_content_handling(self, service, sample_prompt):
        """Test handling of responses with empty message content."""
        # Arrange
        empty_content_completion = ChatCompletion(
            id='test_completion_id',
            object='chat.completion',
            created=1234567890,
            model='openai/gpt-3.5-turbo',
            choices=[
                Choice(
                    index=0,
                    message=ChatCompletionMessage(
                        role='assistant',
                        content=None,  # Empty content
                    ),
                    finish_reason='stop',
                )
            ],
            usage=None,
        )

        from unittest.mock import AsyncMock

        async_mock = AsyncMock(return_value=empty_content_completion)

        with (
            patch.object(service.client.chat.completions, 'create', async_mock),
            pytest.raises(AIModelError, match='Empty response from AI service'),
        ):
            # Act
            await service.generate_completion(sample_prompt)

    @pytest.mark.asyncio
    async def test_prompt_message_conversion(self, service, sample_prompt):
        """Test that AIPrompt messages are correctly converted to OpenAI format."""
        # Arrange
        mock_completion = ChatCompletion(
            id='test_id',
            object='chat.completion',
            created=1234567890,
            model='openai/gpt-3.5-turbo',
            choices=[
                Choice(
                    index=0,
                    message=ChatCompletionMessage(
                        role='assistant',
                        content='Test response',
                    ),
                    finish_reason='stop',
                )
            ],
            usage=None,
        )

        with patch.object(service.client.chat.completions, 'create', new_callable=AsyncMock) as mock_create:
            mock_create.return_value = mock_completion

            # Act
            await service.generate_completion(sample_prompt)

            # Assert - verify the message format conversion
            call_args = mock_create.call_args
            messages = call_args.kwargs['messages']

            assert len(messages) == 2
            assert messages[0]['role'] == 'system'
            assert messages[0]['content'] == 'You are a travel planning assistant.'
            assert messages[1]['role'] == 'user'
            assert messages[1]['content'] == 'Plan a trip to Paris for 3 days.'

    @pytest.mark.parametrize(
        ('model', 'max_tokens', 'temperature'),
        [
            ('openai/gpt-4', 2000, 0.5),
            ('anthropic/claude-3-haiku', 1500, 0.8),
            ('google/gemini-pro', 1000, 0.3),
        ],
    )
    @pytest.mark.asyncio
    async def test_different_model_parameters(self, service, model, max_tokens, temperature):
        """Test completion generation with different model parameters."""
        # Arrange
        prompt = AIPrompt(
            messages=[Message(role='user', content='Test message')],
            model=model,
            max_tokens=max_tokens,
            temperature=temperature,
        )

        mock_completion = ChatCompletion(
            id='test_id',
            object='chat.completion',
            created=1234567890,
            model=model,
            choices=[
                Choice(
                    index=0,
                    message=ChatCompletionMessage(
                        role='assistant',
                        content='Test response',
                    ),
                    finish_reason='stop',
                )
            ],
            usage=None,
        )

        with patch.object(service.client.chat.completions, 'create', new_callable=AsyncMock) as mock_create:
            mock_create.return_value = mock_completion

            # Act
            result = await service.generate_completion(prompt)

            # Assert
            assert result == 'Test response'
            call_args = mock_create.call_args
            assert call_args.kwargs['model'] == model
            assert call_args.kwargs['max_tokens'] == max_tokens
            assert call_args.kwargs['temperature'] == temperature


@pytest.mark.unit
class TestOpenRouterServiceValidateResponse:
    """Test OpenRouterService._validate_response method."""

    @pytest.fixture
    def service(self):
        """Create OpenRouterService instance for testing."""
        return OpenRouterService(
            api_key='test_api_key',
            base_url='https://openrouter.ai/api/v1',
            timeout_seconds=30,
        )

    def test_validate_response_success(self, service):
        """Test successful response validation."""
        # Arrange
        completion = ChatCompletion(
            id='test_id',
            object='chat.completion',
            created=1234567890,
            model='openai/gpt-3.5-turbo',
            choices=[
                Choice(
                    index=0,
                    message=ChatCompletionMessage(
                        role='assistant',
                        content='Valid response content',
                    ),
                    finish_reason='stop',
                )
            ],
            usage=None,
        )

        # Act
        result = service._validate_response(completion)

        # Assert
        assert result == 'Valid response content'

    def test_validate_response_empty_choices(self, service):
        """Test validation with empty choices."""
        # Arrange
        completion = ChatCompletion(
            id='test_id',
            object='chat.completion',
            created=1234567890,
            model='openai/gpt-3.5-turbo',
            choices=[],
            usage=None,
        )

        # Act & Assert
        with pytest.raises(AIModelError, match='Empty response from AI service'):
            service._validate_response(completion)

    def test_validate_response_none_content(self, service):
        """Test validation with None message content."""
        # Arrange
        completion = ChatCompletion(
            id='test_id',
            object='chat.completion',
            created=1234567890,
            model='openai/gpt-3.5-turbo',
            choices=[
                Choice(
                    index=0,
                    message=ChatCompletionMessage(
                        role='assistant',
                        content=None,
                    ),
                    finish_reason='stop',
                )
            ],
            usage=None,
        )

        # Act & Assert
        with pytest.raises(AIModelError, match='Empty response from AI service'):
            service._validate_response(completion)

    def test_validate_response_empty_string_content(self, service):
        """Test validation with empty string content."""
        # Arrange
        completion = ChatCompletion(
            id='test_id',
            object='chat.completion',
            created=1234567890,
            model='openai/gpt-3.5-turbo',
            choices=[
                Choice(
                    index=0,
                    message=ChatCompletionMessage(
                        role='assistant',
                        content='',
                    ),
                    finish_reason='stop',
                )
            ],
            usage=None,
        )

        # Act & Assert
        with pytest.raises(AIModelError, match='Empty response from AI service'):
            service._validate_response(completion)
