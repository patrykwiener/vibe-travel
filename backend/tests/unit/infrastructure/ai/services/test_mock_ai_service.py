"""Unit tests for MockAIModelService.

This module tests the mock AI service implementation that is used for testing
and development environments. Tests verify mock response generation, delay
simulation, and response format consistency.
"""

import asyncio

import pytest

from src.insfrastructure.ai.prompts import AIPrompt, Message
from src.insfrastructure.ai.services.mock_ai_service import MockAIModelService


@pytest.mark.unit
class TestMockAIModelServiceInitialization:
    """Test MockAIModelService initialization and configuration."""

    def test_successful_initialization_with_default_delay(self):
        """Test successful service initialization with default delay."""
        # Act
        service = MockAIModelService()

        # Assert
        assert service.delay_seconds == 1.0

    def test_successful_initialization_with_custom_delay(self):
        """Test successful service initialization with custom delay."""
        # Arrange
        custom_delay = 2.5

        # Act
        service = MockAIModelService(delay_seconds=custom_delay)

        # Assert
        assert service.delay_seconds == custom_delay

    @pytest.mark.parametrize(
        'delay_seconds',
        [0.0, 0.5, 1.0, 2.0, 5.0],
    )
    def test_initialization_with_various_delay_values(self, delay_seconds):
        """Test initialization with different delay values."""
        # Act
        service = MockAIModelService(delay_seconds=delay_seconds)

        # Assert
        assert service.delay_seconds == delay_seconds


@pytest.mark.unit
class TestMockAIModelServiceGenerateCompletion:
    """Test MockAIModelService generate_completion method."""

    @pytest.fixture
    def service(self):
        """Create MockAIModelService instance with minimal delay for testing."""
        return MockAIModelService(delay_seconds=0.1)

    @pytest.fixture
    def sample_prompt(self):
        """Create sample AIPrompt for testing."""
        return AIPrompt(
            messages=[
                Message(role='system', content='You are a travel planning assistant.'),
                Message(role='user', content='Plan a trip to Paris for 3 days.'),
            ],
            model='mock-model',
            max_tokens=1000,
            temperature=0.7,
        )

    @pytest.mark.asyncio
    async def test_successful_completion_generation(self, service, sample_prompt):
        """Test successful completion generation with valid prompt."""
        # Act
        result = await service.generate_completion(sample_prompt)

        # Assert
        assert isinstance(result, str)
        assert len(result) > 0
        assert '# Travel Plan' in result
        assert 'Based on: Plan a trip to Paris for 3 days.' in result

    @pytest.mark.asyncio
    async def test_completion_contains_expected_structure(self, service, sample_prompt):
        """Test that generated completion contains expected structure."""
        # Act
        result = await service.generate_completion(sample_prompt)

        # Assert
        assert '# Travel Plan' in result
        assert '## Day 1' in result
        assert '## Day 2' in result
        assert '## Day 3' in result
        assert 'Travel Tips:' in result
        assert 'Morning:' in result
        assert 'Afternoon:' in result
        assert 'Evening:' in result

    @pytest.mark.asyncio
    async def test_completion_includes_user_message_content(self, service):
        """Test that completion includes content from user message."""
        # Arrange
        user_message = 'Plan a romantic weekend in Rome'
        prompt = AIPrompt(
            messages=[
                Message(role='system', content='You are a helpful assistant.'),
                Message(role='user', content=user_message),
            ],
            model='mock-model',
        )

        # Act
        result = await service.generate_completion(prompt)

        # Assert
        assert user_message in result

    @pytest.mark.asyncio
    async def test_completion_with_multiple_user_messages(self, service):
        """Test completion with multiple user messages uses the last one."""
        # Arrange
        prompt = AIPrompt(
            messages=[
                Message(role='system', content='You are a helpful assistant.'),
                Message(role='user', content='First message'),
                Message(role='assistant', content='Assistant response'),
                Message(role='user', content='Plan a trip to Tokyo'),
            ],
            model='mock-model',
        )

        # Act
        result = await service.generate_completion(prompt)

        # Assert
        assert 'Plan a trip to Tokyo' in result
        assert 'First message' not in result

    @pytest.mark.asyncio
    async def test_completion_with_no_user_messages(self, service):
        """Test completion when no user messages are present."""
        # Arrange
        prompt = AIPrompt(
            messages=[
                Message(role='system', content='You are a helpful assistant.'),
            ],
            model='mock-model',
        )

        # Act
        result = await service.generate_completion(prompt)

        # Assert
        assert isinstance(result, str)
        assert 'Based on: ' in result
        # Should still generate a valid travel plan structure

    @pytest.mark.asyncio
    async def test_completion_with_empty_messages(self, service):
        """Test completion with empty messages list."""
        # Arrange
        prompt = AIPrompt(
            messages=[],
            model='mock-model',
        )

        # Act
        result = await service.generate_completion(prompt)

        # Assert
        assert isinstance(result, str)
        assert '# Travel Plan' in result

    @pytest.mark.asyncio
    async def test_delay_simulation(self):
        """Test that the service simulates processing delay."""
        # Arrange
        delay_seconds = 0.5
        service = MockAIModelService(delay_seconds=delay_seconds)
        prompt = AIPrompt(
            messages=[Message(role='user', content='Test message')],
            model='mock-model',
        )

        # Act
        start_time = asyncio.get_event_loop().time()
        await service.generate_completion(prompt)
        end_time = asyncio.get_event_loop().time()

        # Assert
        elapsed_time = end_time - start_time
        assert elapsed_time >= delay_seconds
        assert elapsed_time < delay_seconds + 0.1  # Allow small margin

    @pytest.mark.asyncio
    async def test_zero_delay_completion(self):
        """Test completion with zero delay."""
        # Arrange
        service = MockAIModelService(delay_seconds=0.0)
        prompt = AIPrompt(
            messages=[Message(role='user', content='Test message')],
            model='mock-model',
        )

        # Act
        start_time = asyncio.get_event_loop().time()
        result = await service.generate_completion(prompt)
        end_time = asyncio.get_event_loop().time()

        # Assert
        elapsed_time = end_time - start_time
        assert elapsed_time < 0.1  # Should be very fast
        assert isinstance(result, str)

    @pytest.mark.asyncio
    async def test_concurrent_completions(self, service):
        """Test multiple concurrent completion requests."""
        # Arrange
        prompts = [
            AIPrompt(
                messages=[Message(role='user', content=f'Plan trip {i}')],
                model='mock-model',
            )
            for i in range(3)
        ]

        # Act
        tasks = [service.generate_completion(prompt) for prompt in prompts]
        results = await asyncio.gather(*tasks)

        # Assert
        assert len(results) == 3
        for i, result in enumerate(results):
            assert isinstance(result, str)
            assert f'Plan trip {i}' in result

    @pytest.mark.parametrize(
        ('user_content', 'expected_in_response'),
        [
            ('Plan a trip to London', 'Plan a trip to London'),
            ('Weekend getaway to mountains', 'Weekend getaway to mountains'),
            ('Business trip to New York', 'Business trip to New York'),
            ('Family vacation in Spain', 'Family vacation in Spain'),
        ],
    )
    @pytest.mark.asyncio
    async def test_completion_with_various_user_inputs(self, service, user_content, expected_in_response):
        """Test completion generation with various user input content."""
        # Arrange
        prompt = AIPrompt(
            messages=[Message(role='user', content=user_content)],
            model='mock-model',
        )

        # Act
        result = await service.generate_completion(prompt)

        # Assert
        assert expected_in_response in result
        assert '# Travel Plan' in result


@pytest.mark.unit
class TestMockAIModelServiceBuildMockResponse:
    """Test MockAIModelService._build_mock_response method."""

    @pytest.fixture
    def service(self):
        """Create MockAIModelService instance for testing."""
        return MockAIModelService()

    def test_build_mock_response_with_user_message(self, service):
        """Test building mock response with user message."""
        # Arrange
        user_message = 'Plan a trip to Barcelona'

        # Act
        result = service._build_mock_response(user_message)

        # Assert
        assert isinstance(result, str)
        assert '# Travel Plan' in result
        assert f'Based on: {user_message}' in result

    def test_build_mock_response_with_empty_message(self, service):
        """Test building mock response with empty message."""
        # Arrange
        user_message = ''

        # Act
        result = service._build_mock_response(user_message)

        # Assert
        assert isinstance(result, str)
        assert '# Travel Plan' in result
        assert 'Based on: ' in result

    def test_mock_response_structure_consistency(self, service):
        """Test that mock response always has consistent structure."""
        # Arrange
        user_message = 'Test trip planning'

        # Act
        result = service._build_mock_response(user_message)

        # Assert
        lines = result.split('\n')
        assert lines[0] == '# Travel Plan'
        assert lines[1] == f'Based on: {user_message}'

        # Check for day sections
        day_sections = [line for line in lines if line.startswith('## Day')]
        assert len(day_sections) == 3
        assert '## Day 1' in result
        assert '## Day 2' in result
        assert '## Day 3' in result

        # Check for travel tips section
        assert 'Travel Tips:' in result

    def test_mock_response_contains_realistic_content(self, service):
        """Test that mock response contains realistic travel content."""
        # Arrange
        user_message = 'Plan a cultural trip'

        # Act
        result = service._build_mock_response(user_message)

        # Assert
        # Check for realistic travel activities
        assert 'attractions' in result.lower() or 'museum' in result.lower()
        assert 'morning' in result.lower()
        assert 'afternoon' in result.lower()
        assert 'evening' in result.lower()

        # Check for practical travel advice
        assert 'best time' in result.lower() or 'transportation' in result.lower()
        assert 'book' in result.lower() or 'advance' in result.lower()

    @pytest.mark.parametrize(
        'input_message',
        [
            'Short trip',
            'A very long detailed message about planning an extensive multi-week journey across multiple countries',
            'Trip with special characters: àáâãäåæçèéêë',
            '123 numeric trip planning',
            'UPPERCASE TRIP PLANNING',
        ],
    )
    def test_mock_response_handles_various_input_types(self, service, input_message):
        """Test mock response generation with various input message types."""
        # Act
        result = service._build_mock_response(input_message)

        # Assert
        assert isinstance(result, str)
        assert len(result) > 0
        assert '# Travel Plan' in result
        assert input_message in result
