from loguru import logger
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
            logger.error('OpenRouter API key is required but not provided')
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
        logger.info(
            'Starting OpenRouter API request',
            model=prompt.model,
            message_count=len(prompt.messages),
            max_tokens=prompt.max_tokens,
            temperature=prompt.temperature,
            timeout_seconds=self._timeout_seconds,
        )

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

            # Log response details
            if completion.usage:
                logger.info(
                    'OpenRouter API request completed successfully',
                    prompt_tokens=completion.usage.prompt_tokens,
                    completion_tokens=completion.usage.completion_tokens,
                    total_tokens=completion.usage.total_tokens,
                    model=completion.model,
                    finish_reason=(completion.choices[0].finish_reason if completion.choices else None),
                )
            else:
                logger.info(
                    'OpenRouter API request completed successfully',
                    model=completion.model,
                    finish_reason=(completion.choices[0].finish_reason if completion.choices else None),
                )

            return self._validate_response(completion)

        except TimeoutError as timeout_err:
            logger.exception(
                'OpenRouter API request timed out',
                timeout_seconds=self._timeout_seconds,
                model=prompt.model,
            )
            raise AIServiceTimeoutError(timeout_seconds=self._timeout_seconds) from timeout_err

        except ConnectionError as conn_err:
            logger.exception(
                'OpenRouter API connection failed',
                model=prompt.model,
            )
            raise AIServiceUnavailableError from conn_err

        except Exception as exc:
            logger.exception(
                'Unexpected error during OpenRouter API request',
                model=prompt.model,
            )
            raise AIModelError(message=str(exc)) from exc

    def _validate_response(self, completion: ChatCompletion) -> str:
        """Validate completion response and extract content."""
        if not completion.choices or not completion.choices[0].message.content:
            logger.error(
                'Empty response from OpenRouter API',
                choices_available=bool(completion.choices),
                message_content_available=(
                    bool(completion.choices[0].message.content) if completion.choices else False
                ),
                model=completion.model,
            )
            raise AIModelError(message='Empty response from AI service')

        return completion.choices[0].message.content
