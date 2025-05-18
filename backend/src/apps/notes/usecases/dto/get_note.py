"""DTOs for retrieving note details."""

import uuid
from dataclasses import dataclass
from datetime import date, datetime


@dataclass
class GetNoteInDTO:
    """Input DTO for the GetNoteUseCase."""

    note_id: int
    user_id: uuid.UUID


@dataclass
class GetNoteOutDTO:
    """Output DTO for the GetNoteUseCase."""

    id: int
    user_id: uuid.UUID
    title: str
    place: str
    date_from: date
    date_to: date
    number_of_people: int
    key_ideas: str | None
    created_at: datetime
    updated_at: datetime
