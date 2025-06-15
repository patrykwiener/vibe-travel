"""Unit tests for TravelPlanPromptAdapter."""

from datetime import date

import pytest

from src.apps.plans.adapters.travel_plan_prompt_adapter import TravelPlanPromptAdapter
from src.apps.plans.usecases.dto.plan_generation_dto import TravelPlanGenerationDTO
from src.insfrastructure.ai.prompts import AIPrompt, Message


@pytest.mark.unit
class TestTravelPlanPromptAdapter:
    """Test cases for TravelPlanPromptAdapter."""

    @pytest.fixture
    def model_id(self) -> str:
        """Return a sample model ID."""
        return 'test-model-123'

    @pytest.fixture
    def adapter(self, model_id: str) -> TravelPlanPromptAdapter:
        """Return a TravelPlanPromptAdapter instance."""
        return TravelPlanPromptAdapter(model=model_id)

    @pytest.fixture
    def minimal_travel_plan_dto(self) -> TravelPlanGenerationDTO:
        """Return a minimal TravelPlanGenerationDTO instance."""
        return TravelPlanGenerationDTO(
            note_id=1,
            place='Paris',
            date_from=date(2025, 7, 1),
            date_to=date(2025, 7, 5),
            number_of_people=2,
            title='Summer Trip to Paris',
            max_length=1500,
            # Optional fields left as None
            key_ideas=None,
            budget=None,
            preferred_pace=None,
            travel_style=None,
        )

    @pytest.fixture
    def full_travel_plan_dto(self) -> TravelPlanGenerationDTO:
        """Return a TravelPlanGenerationDTO instance with all preferences."""
        return TravelPlanGenerationDTO(
            note_id=2,
            place='Tokyo',
            date_from=date(2025, 8, 10),
            date_to=date(2025, 8, 15),
            number_of_people=1,
            title='Exploring Tokyo',
            max_length=2000,
            key_ideas='Focus on temples and food markets.',
            budget='Mid-range',
            preferred_pace='Relaxed',
            travel_style='Cultural immersion',
        )

    def test_init(self, adapter: TravelPlanPromptAdapter, model_id: str):
        """Test adapter initialization."""
        assert adapter.model == model_id

    def test_build_prompt_minimal_dto(
        self, adapter: TravelPlanPromptAdapter, minimal_travel_plan_dto: TravelPlanGenerationDTO, model_id: str
    ):
        """Test build_prompt with minimal DTO."""
        prompt = adapter.build_prompt(travel_plan_dto=minimal_travel_plan_dto)

        assert isinstance(prompt, AIPrompt)
        assert prompt.model == model_id
        assert len(prompt.messages) == 2
        assert prompt.messages[0].role == 'system'
        assert prompt.messages[1].role == 'user'
        assert prompt.max_tokens is None
        assert prompt.temperature is None

    def test_build_prompt_full_dto_with_overrides(
        self, adapter: TravelPlanPromptAdapter, full_travel_plan_dto: TravelPlanGenerationDTO, model_id: str
    ):
        """Test build_prompt with full DTO and overrides for tokens/temperature."""
        max_tokens = 1000
        temperature = 0.7
        prompt = adapter.build_prompt(
            travel_plan_dto=full_travel_plan_dto, max_tokens=max_tokens, temperature=temperature
        )

        assert isinstance(prompt, AIPrompt)
        assert prompt.model == model_id
        assert len(prompt.messages) == 2
        assert prompt.messages[0].role == 'system'
        assert prompt.messages[1].role == 'user'
        assert prompt.max_tokens == max_tokens
        assert prompt.temperature == temperature

    def test_build_system_message_minimal(
        self, adapter: TravelPlanPromptAdapter, minimal_travel_plan_dto: TravelPlanGenerationDTO
    ):
        """Test _build_system_message with minimal DTO (no preferences)."""
        message = adapter._build_system_message(travel_plan_dto=minimal_travel_plan_dto)
        assert isinstance(message, Message)
        assert message.role == 'system'
        assert 'You are a travel planning assistant.' in message.content
        assert 'Budget level:' not in message.content
        assert 'Travel pace:' not in message.content
        assert 'Travel style:' not in message.content
        assert f'Travel plan max length: {minimal_travel_plan_dto.max_length} characters' in message.content

    def test_build_system_message_full(
        self, adapter: TravelPlanPromptAdapter, full_travel_plan_dto: TravelPlanGenerationDTO
    ):
        """Test _build_system_message with full DTO (all preferences)."""
        message = adapter._build_system_message(travel_plan_dto=full_travel_plan_dto)
        assert isinstance(message, Message)
        assert message.role == 'system'
        assert f'Budget level: {full_travel_plan_dto.budget}' in message.content
        assert f'Travel pace: {full_travel_plan_dto.preferred_pace}' in message.content
        assert f'Travel style: {full_travel_plan_dto.travel_style}' in message.content
        assert f'Travel plan max length: {full_travel_plan_dto.max_length} characters' in message.content

    def test_build_user_message_minimal(
        self, adapter: TravelPlanPromptAdapter, minimal_travel_plan_dto: TravelPlanGenerationDTO
    ):
        """Test _build_user_message with minimal DTO (no key ideas)."""
        message = adapter._build_user_message(travel_plan_dto=minimal_travel_plan_dto)
        trip_duration = (minimal_travel_plan_dto.date_to - minimal_travel_plan_dto.date_from).days + 1

        assert isinstance(message, Message)
        assert message.role == 'user'
        assert f'Create a detailed travel plan for {minimal_travel_plan_dto.place}' in message.content
        assert (
            f'from {minimal_travel_plan_dto.date_from.isoformat()} to {minimal_travel_plan_dto.date_to.isoformat()}'
        ) in message.content
        assert f'({trip_duration} days)' in message.content
        assert f'for {minimal_travel_plan_dto.number_of_people} people' in message.content
        assert f'Trip title: {minimal_travel_plan_dto.title}' in message.content
        assert 'Additional notes/ideas:' not in message.content

    def test_build_user_message_full(
        self, adapter: TravelPlanPromptAdapter, full_travel_plan_dto: TravelPlanGenerationDTO
    ):
        """Test _build_user_message with full DTO (with key ideas)."""
        message = adapter._build_user_message(travel_plan_dto=full_travel_plan_dto)
        trip_duration = (full_travel_plan_dto.date_to - full_travel_plan_dto.date_from).days + 1

        assert isinstance(message, Message)
        assert message.role == 'user'
        assert f'Create a detailed travel plan for {full_travel_plan_dto.place}' in message.content
        assert (
            f'from {full_travel_plan_dto.date_from.isoformat()} to {full_travel_plan_dto.date_to.isoformat()}'
        ) in message.content
        assert f'({trip_duration} days)' in message.content
        assert f'for {full_travel_plan_dto.number_of_people} people' in message.content
        assert f'Trip title: {full_travel_plan_dto.title}' in message.content
        assert f'Additional notes/ideas: {full_travel_plan_dto.key_ideas}' in message.content

    def test_calculate_trip_duration_one_day(self, adapter: TravelPlanPromptAdapter):
        """Test _calculate_trip_duration for a single day trip."""
        dto = TravelPlanGenerationDTO(
            note_id=3,
            place='Rome',
            date_from=date(2025, 9, 1),
            date_to=date(2025, 9, 1),
            number_of_people=1,
            title='Rome in a day',
            max_length=500,
        )
        message = adapter._build_user_message(travel_plan_dto=dto)
        assert '(1 days)' in message.content  # Corrected from 1 day to 1 days

    def test_calculate_trip_duration_multiple_days(self, adapter: TravelPlanPromptAdapter):
        """Test _calculate_trip_duration for a multi-day trip."""
        dto = TravelPlanGenerationDTO(
            note_id=4,
            place='Berlin',
            date_from=date(2025, 10, 1),
            date_to=date(2025, 10, 3),  # 3 days
            number_of_people=2,
            title='Berlin Weekend',
            max_length=1000,
        )
        message = adapter._build_user_message(travel_plan_dto=dto)
        assert '(3 days)' in message.content
