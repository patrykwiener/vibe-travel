import asyncio


class PlanGenerationService:
    """Service for generating travel plans using AI."""

    def __init__(self, timeout_seconds: int = 5):
        self.timeout_seconds = timeout_seconds

    async def generate_plan(self, note_content: str, user_preferences: dict | None = None) -> str:
        """
        Generate a travel plan based on note content and user preferences.

        This is a mock implementation that simulates AI generation.
        In the future, this will be replaced with actual OpenRouter SDK integration.

        Args:
            note_content: The content of the note to generate a plan from
            user_preferences: Optional user preferences to consider when generating the plan

        Returns:
            The generated travel plan text

        Raises:
            AIServiceTimeoutError: If the AI service takes too long to respond
            AIServiceUnavailableError: If the AI service is unavailable
        """
        # Simulate successful processing time
        await asyncio.sleep(1.0)

        # Mock plan text
        return """# Travel Plan
## Day 1
* Morning: Visit the main attractions in the city
* Afternoon: Explore local culture
* Evening: Dinner at a local restaurant

## Day 2
* Morning: Guided tour
* Afternoon: Free time for shopping
* Evening: Experience local nightlife

## Day 3
* Morning: Relaxation time
* Afternoon: Museum visit
* Evening: Farewell dinner
"""
