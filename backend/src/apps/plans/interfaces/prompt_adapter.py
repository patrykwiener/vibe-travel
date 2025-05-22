from abc import ABC, abstractmethod

from src.apps.plans.usecases.dto.plan_generation_dto import TravelPlanGenerationDTO
from src.insfrastructure.ai.prompts import AIPrompt


class AbstractTravelPlanPromptAdapter(ABC):
    """Port for adapting travel plan data to AI prompts."""

    @abstractmethod
    def build_prompt(
        self,
        travel_plan_dto: TravelPlanGenerationDTO,
        max_tokens: int | None = None,
        temperature: float | None = None,
    ) -> AIPrompt:
        """
        Build a complete prompt for travel plan generation.

        Args:
            travel_plan_dto: Combined DTO with note information and user preferences
            max_tokens: Optional maximum tokens for the AI response
            temperature: Optional temperature for the AI response

        Returns:
            AIPrompt object with all messages configured
        """
