from typing import TYPE_CHECKING

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
        prompt = self._prompt_adapter.build_prompt(
            travel_plan_dto=travel_plan_dto,
            max_tokens=max_tokens,
            temperature=temperature,
        )
        try:
            return await self._ai_service.generate_completion(prompt)
        except AIBaseError as ai_error:
            raise PlanGenerationError(note_id=travel_plan_dto.note_id, message=ai_error.message) from ai_error
        except Exception as exc:
            raise PlanGenerationError(
                note_id=travel_plan_dto.note_id, message=f'Unexpected error during plan generation: {exc!s}'
            ) from exc
