from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel


class UpdateNoteInDTO(BaseModel):
    """DTO for creating a new note."""

    id: int
    user_id: UUID
    title: str
    place: str
    date_from: date
    date_to: date
    number_of_people: int
    key_ideas: str | None = None


class UpdateNoteOutDTO(BaseModel):
    """DTO for the output of the update note use case."""

    id: int
    user_id: UUID
    title: str
    place: str
    date_from: date
    date_to: date
    number_of_people: int
    key_ideas: str | None = None
    created_at: datetime
    updated_at: datetime
