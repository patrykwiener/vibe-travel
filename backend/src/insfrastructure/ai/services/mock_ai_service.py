import asyncio

from src.insfrastructure.ai.interfaces import AIModelService
from src.insfrastructure.ai.prompts import AIPrompt


class MockAIModelService(AIModelService):
    """Mock implementation of AIModelService for testing and development."""

    def __init__(self, delay_seconds: float = 1.0) -> None:
        """
        Initialize mock AI service.

        Args:
            delay_seconds: Simulated processing delay in seconds
        """
        self.delay_seconds = delay_seconds

    async def generate_completion(
        self,
        prompt: AIPrompt,
    ) -> str:
        """Generate a mock completion with simulated delay."""
        # Simulate processing time
        await asyncio.sleep(self.delay_seconds)

        # Get last user message
        for msg in reversed(prompt.messages):
            if msg.role == 'user':
                user_msg = msg.content
                break
        else:
            user_msg = ''

        # Generate mock plan
        return self._build_mock_response(user_msg)

    def _build_mock_response(self, user_message: str) -> str:
        """Build a mock travel plan response."""
        return f"""# Travel Plan
Based on: {user_message}

## Day 1
* Morning: Visit the main attractions
* Afternoon: Cultural exploration
* Evening: Local dining experience

## Day 2
* Morning: Guided tour
* Afternoon: Free time for shopping
* Evening: Entertainment

## Day 3
* Morning: Relaxation
* Afternoon: Museum visit
* Evening: Farewell dinner

Travel Tips:
- Best time to visit: Spring/Fall
- Local transportation available
- Book accommodations in advance"""
