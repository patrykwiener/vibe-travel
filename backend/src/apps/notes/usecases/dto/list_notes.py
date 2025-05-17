"""Data Transfer Objects for Note use cases."""

from datetime import date
from uuid import UUID

from pydantic import BaseModel


class ListNotesInDTO(BaseModel):
    """Input DTO for listing notes."""

    user_id: UUID
    search_title: str | None = None


class NoteDetailsDTO(BaseModel):
    """DTO representing detailed information for a single note item when listing."""

    id: int
    title: str
    place: str
    date_from: date
    date_to: date
    number_of_people: int


class ListNotesOutDTO(BaseModel):
    """Output DTO for listing notes."""

    items: list[NoteDetailsDTO]
