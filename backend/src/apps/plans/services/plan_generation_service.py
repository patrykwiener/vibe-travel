from typing import TYPE_CHECKING

from loguru import logger

from src.apps.plans.exceptions import PlanGenerationError
from src.apps.plans.interfaces.prompt_adapter import AbstractTravelPlanPromptAdapter
from src.insfrastructure.ai.exceptions import AIBaseError
from src.insfrastructure.ai.interfaces import AIModelService

if TYPE_CHECKING:
    from src.apps.plans.usecases.dto.plan_generation_dto import TravelPlanGenerationDTO


class PlanGenerationService:
    """Service for generating travel plans using AI."""

    def __init__(
        self,
        ai_service: AIModelService,
        prompt_adapter: AbstractTravelPlanPromptAdapter,
    ) -> None:
        self._ai_service = ai_service
        self._prompt_adapter = prompt_adapter

    async def generate_plan(
        self,
        travel_plan_dto: 'TravelPlanGenerationDTO',
        max_tokens: int | None = None,
        temperature: float | None = None,
    ) -> str:
        """
        Generate a travel plan based on note travel information and user preferences.

        Args:
            travel_plan_dto: Combined DTO with note information and user preferences
            max_tokens: Optional max tokens override
            temperature: Optional temperature override for creativity

        Returns:
            The generated travel plan text

        Raises:
            PlanGenerationError: If there is an error generating the plan
        """
        note_id = travel_plan_dto.note_id
        user_id = getattr(travel_plan_dto, 'user_id', None)

        logger.info(
            'Starting travel plan generation',
            extra={
                'note_id': note_id,
                'user_id': user_id,
                'max_tokens': max_tokens,
                'temperature': temperature,
                'has_preferences': (
                    hasattr(travel_plan_dto, 'user_preferences') and travel_plan_dto.user_preferences is not None
                ),
            },
        )

        try:
            prompt = self._prompt_adapter.build_prompt(
                travel_plan_dto=travel_plan_dto,
                max_tokens=max_tokens,
                temperature=temperature,
            )

            logger.info(
                'Requesting AI completion for travel plan',
                note_id=note_id,
                ai_service_type=type(self._ai_service).__name__,
            )

            result = await self._ai_service.generate_completion(prompt)
        except AIBaseError as ai_error:
            logger.error(
                'AI service error during plan generation',
                note_id=note_id,
                error_type=type(ai_error).__name__,
                error_message=ai_error.message,
            )
            raise PlanGenerationError(note_id=note_id, message=ai_error.message) from ai_error

        except Exception as exc:
            logger.exception(
                'Unexpected error during plan generation',
                note_id=note_id,
            )
            raise PlanGenerationError(
                note_id=note_id, message=f'Unexpected error during plan generation: {exc!s}'
            ) from exc
        else:
            logger.info(
                'Travel plan generated successfully',
                note_id=note_id,
                plan_length=len(result),
                plan_word_count=len(result.split()),
            )

            return result
