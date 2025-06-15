"""Unit tests for PlanGenerationService."""

from datetime import date
from unittest.mock import AsyncMock, MagicMock

import pytest

from src.apps.plans.exceptions import PlanGenerationError
from src.apps.plans.interfaces.prompt_adapter import AbstractTravelPlanPromptAdapter
from src.apps.plans.services.plan_generation_service import PlanGenerationService
from src.apps.plans.usecases.dto.plan_generation_dto import TravelPlanGenerationDTO
from src.insfrastructure.ai.exceptions import AIBaseError
from src.insfrastructure.ai.interfaces import AIModelService
from src.insfrastructure.ai.prompts import AIPrompt


@pytest.mark.unit
class TestPlanGenerationService:
    """Test cases for PlanGenerationService."""

    @pytest.fixture
    def mock_ai_service(self) -> AIModelService:
        """Return a mock AIModelService."""
        return AsyncMock(spec=AIModelService)

    @pytest.fixture
    def mock_prompt_adapter(self) -> AbstractTravelPlanPromptAdapter:
        """Return a mock AbstractTravelPlanPromptAdapter."""
        adapter = AsyncMock(spec=AbstractTravelPlanPromptAdapter)
        # Ensure build_prompt is a MagicMock
        adapter.build_prompt = MagicMock(return_value=AIPrompt(messages=[], model='test-model'))
        return adapter

    @pytest.fixture
    def plan_generation_service(
        self, mock_ai_service: AIModelService, mock_prompt_adapter: AbstractTravelPlanPromptAdapter
    ) -> PlanGenerationService:
        """Return a PlanGenerationService instance."""
        return PlanGenerationService(ai_service=mock_ai_service, prompt_adapter=mock_prompt_adapter)

    @pytest.fixture
    def sample_travel_plan_dto(self) -> TravelPlanGenerationDTO:
        """Return a sample TravelPlanGenerationDTO."""
        return TravelPlanGenerationDTO(
            note_id=1,
            place='Test City',
            date_from=date(2025, 1, 1),
            date_to=date(2025, 1, 5),
            number_of_people=2,
            title='Test Trip',
            max_length=1000,
        )

    @pytest.mark.asyncio
    async def test_generate_plan_success(
        self,
        plan_generation_service: PlanGenerationService,
        mock_ai_service: AIModelService,
        mock_prompt_adapter: AbstractTravelPlanPromptAdapter,
        sample_travel_plan_dto: TravelPlanGenerationDTO,
    ):
        """Test successful plan generation."""
        expected_plan_text = 'This is a generated travel plan.'
        mock_ai_service.generate_completion.return_value = expected_plan_text
        mock_prompt_adapter.build_prompt.return_value = AIPrompt(messages=[], model='test-model')

        result = await plan_generation_service.generate_plan(travel_plan_dto=sample_travel_plan_dto)

        mock_prompt_adapter.build_prompt.assert_called_once_with(
            travel_plan_dto=sample_travel_plan_dto, max_tokens=None, temperature=None
        )
        mock_ai_service.generate_completion.assert_called_once_with(mock_prompt_adapter.build_prompt.return_value)
        assert result == expected_plan_text

    @pytest.mark.asyncio
    async def test_generate_plan_with_overrides(
        self,
        plan_generation_service: PlanGenerationService,
        mock_ai_service: AIModelService,
        mock_prompt_adapter: AbstractTravelPlanPromptAdapter,
        sample_travel_plan_dto: TravelPlanGenerationDTO,
    ):
        """Test plan generation with max_tokens and temperature overrides."""
        max_tokens = 500
        temperature = 0.5
        expected_plan_text = 'Generated plan with overrides.'
        mock_ai_service.generate_completion.return_value = expected_plan_text
        mock_prompt_adapter.build_prompt.return_value = AIPrompt(messages=[], model='test-model')

        result = await plan_generation_service.generate_plan(
            travel_plan_dto=sample_travel_plan_dto, max_tokens=max_tokens, temperature=temperature
        )

        mock_prompt_adapter.build_prompt.assert_called_once_with(
            travel_plan_dto=sample_travel_plan_dto, max_tokens=max_tokens, temperature=temperature
        )
        mock_ai_service.generate_completion.assert_called_once_with(mock_prompt_adapter.build_prompt.return_value)
        assert result == expected_plan_text

    @pytest.mark.asyncio
    async def test_generate_plan_ai_service_error(
        self,
        plan_generation_service: PlanGenerationService,
        mock_ai_service: AIModelService,
        mock_prompt_adapter: AbstractTravelPlanPromptAdapter,
        sample_travel_plan_dto: TravelPlanGenerationDTO,
    ):
        """Test plan generation when AI service raises an error."""
        ai_error_message = 'AI service unavailable'
        mock_ai_service.generate_completion.side_effect = AIBaseError(message=ai_error_message)
        mock_prompt_adapter.build_prompt.return_value = AIPrompt(messages=[], model='test-model')

        with pytest.raises(PlanGenerationError) as exc_info:
            await plan_generation_service.generate_plan(travel_plan_dto=sample_travel_plan_dto)

        assert ai_error_message in exc_info.value.message

    @pytest.mark.asyncio
    async def test_generate_plan_prompt_adapter_error(
        self,
        plan_generation_service: PlanGenerationService,
        mock_prompt_adapter: AbstractTravelPlanPromptAdapter,
        sample_travel_plan_dto: TravelPlanGenerationDTO,
    ):
        """Test plan generation when prompt adapter raises an error."""
        adapter_error_message = 'Failed to build prompt'
        mock_prompt_adapter.build_prompt.side_effect = ValueError(adapter_error_message)

        with pytest.raises(PlanGenerationError) as exc_info:
            await plan_generation_service.generate_plan(travel_plan_dto=sample_travel_plan_dto)

        assert f'Unexpected error during plan generation: {adapter_error_message}' in exc_info.value.message

    @pytest.mark.asyncio
    async def test_generate_plan_unexpected_error(
        self,
        plan_generation_service: PlanGenerationService,
        mock_ai_service: AIModelService,
        mock_prompt_adapter: AbstractTravelPlanPromptAdapter,
        sample_travel_plan_dto: TravelPlanGenerationDTO,
    ):
        """Test plan generation when an unexpected error occurs."""
        unexpected_error_message = 'Something went wrong'
        mock_ai_service.generate_completion.side_effect = Exception(unexpected_error_message)
        mock_prompt_adapter.build_prompt.return_value = AIPrompt(messages=[], model='test-model')

        with pytest.raises(PlanGenerationError) as exc_info:
            await plan_generation_service.generate_plan(travel_plan_dto=sample_travel_plan_dto)

        assert f'Unexpected error during plan generation: {unexpected_error_message}' in exc_info.value.message
