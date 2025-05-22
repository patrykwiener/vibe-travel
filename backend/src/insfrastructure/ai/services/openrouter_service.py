from openai import AsyncOpenAI
from openai.types.chat import ChatCompletion, ChatCompletionMessageParam

from src.insfrastructure.ai.exceptions import (
    AIModelError,
    AIServiceTimeoutError,
    AIServiceUnavailableError,
)
from src.insfrastructure.ai.interfaces import AIModelService
from src.insfrastructure.ai.prompts import AIPrompt


class OpenRouterService(AIModelService):
    """Service for communication with OpenRouter.ai through OpenAI SDK.

    This service provides a clean interface for generating text through the OpenRouter API,
    which provides access to various AI models (OpenAI, Anthropic, Google, etc.).
    """

    def __init__(
        self,
        api_key: str,
        base_url: str,
        timeout_seconds: int,
    ) -> None:
        """
        Initialize the OpenRouter service.

        Args:
            api_key: OpenRouter API key
            base_url: Base URL for OpenRouter API
            timeout_seconds: Request timeout in seconds

        Raises:
            ValueError: If API key is missing or invalid
        """
        if not api_key:
            raise ValueError('OpenRouter API key is required')

        self._timeout_seconds = timeout_seconds

        self.client = AsyncOpenAI(
            api_key=api_key,
            base_url=base_url,
            timeout=timeout_seconds,
        )

    async def generate_completion(
        self,
        prompt: AIPrompt,
    ) -> str:
        """
        Generate a completion from the OpenRouter API.

        Args:
            prompt: AIPrompt containing messages, model, and parameters

        Returns:
            Generated text from the model

        Raises:
            AIServiceTimeoutError: If request times out
            AIServiceUnavailableError: If service is unavailable
            AIModelError: For other generation errors
        """
        try:
            openai_messages: list[ChatCompletionMessageParam] = [
                {  # type: ignore[misc]
                    'role': msg.role,
                    'content': msg.content,
                }
                for msg in prompt.messages
            ]

            completion: ChatCompletion = await self.client.chat.completions.create(
                model=prompt.model,
                messages=openai_messages,
                max_tokens=prompt.max_tokens,
                temperature=prompt.temperature,
            )

            return self._validate_response(completion)

        except TimeoutError as timeout_err:
            raise AIServiceTimeoutError(timeout_seconds=self._timeout_seconds) from timeout_err
        except ConnectionError as conn_err:
            raise AIServiceUnavailableError from conn_err
        except Exception as exc:
            raise AIModelError(message=str(exc)) from exc

    def _validate_response(self, completion: ChatCompletion) -> str:
        """Validate completion response and extract content."""
        if not completion.choices or not completion.choices[0].message.content:
            raise AIModelError(message='Empty response from AI service')
        return completion.choices[0].message.content
