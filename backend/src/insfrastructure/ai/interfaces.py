from abc import ABC, abstractmethod

from src.insfrastructure.ai.prompts import AIPrompt


class AIModelService(ABC):
    """Abstract base class for AI model communication services."""

    @abstractmethod
    async def generate_completion(
        self,
        prompt: AIPrompt,
    ) -> str:
        """
        Generate a completion from the AI model.

        Args:
            prompt: The AIPrompt object containing messages, model, and parameters

        Returns:
            Generated text from the model

        Raises:
            AIServiceTimeoutError: If request times out
            AIServiceUnavailableError: If service is unavailable
            AIModelError: For other errors during generation
        """
