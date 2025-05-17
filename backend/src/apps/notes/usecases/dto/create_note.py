"""Data Transfer Objects for note use cases."""

from datetime import date
from uuid import UUID

from pydantic import BaseModel


class CreateNoteDTO(BaseModel):
    """DTO for creating a new note."""

    user_id: UUID
    title: str
    place: str
    date_from: date
    date_to: date
    number_of_people: int
    key_ideas: str | None = None
