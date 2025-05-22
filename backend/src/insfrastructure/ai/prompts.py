from dataclasses import dataclass
from typing import Literal


@dataclass(frozen=True)
class Message:
    """Value object representing a single message in the conversation."""

    role: Literal['system', 'user']
    content: str


@dataclass(frozen=True)
class AIPrompt:
    """Value object representing a complete prompt for AI generation."""

    messages: list[Message] | list
    model: str
    max_tokens: int | None = None
    temperature: float | None = None
