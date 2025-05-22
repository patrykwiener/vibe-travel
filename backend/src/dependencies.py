from src.config import settings
from src.insfrastructure.ai.interfaces import AIModelService
from src.insfrastructure.ai.services.mock_ai_service import MockAIModelService
from src.insfrastructure.ai.services.openrouter_service import OpenRouterService


def get_ai_service() -> AIModelService:
    """Get an instance of the AI service based on settings."""
    if settings.USE_MOCK_AI:
        return MockAIModelService(delay_seconds=settings.MOCK_AI_GENERATION_TIME_SECONDS)

    return OpenRouterService(
        api_key=settings.OPENROUTER_API_KEY,
        base_url=settings.OPENROUTER_API_URL,
        timeout_seconds=settings.OPENROUTER_TIMEOUT_SECONDS,
    )
