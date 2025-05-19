"""Pydantic schemas for notes related functionality."""

from datetime import date, datetime
from typing import Self
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

from src.config import settings


class NoteCreateInSchema(BaseModel):
    """Schema for creating a new note.

    This schema is used as input for the POST /notes endpoint to create
    a new travel note.
    """

    title: str = Field(
        ...,
        description='Title of the note',
        min_length=settings.NOTES_TITLE_MIN_LENGTH,
        max_length=settings.NOTES_TITLE_MAX_LENGTH,
    )
    place: str = Field(
        ...,
        description='Location or place for the trip',
        min_length=settings.NOTES_PLACE_MIN_LENGTH,
        max_length=settings.NOTES_PLACE_MAX_LENGTH,
    )
    date_from: date = Field(
        ...,
        description='Start date of the trip',
    )
    date_to: date = Field(
        ...,
        description='End date of the trip',
    )
    number_of_people: int = Field(
        ...,
        description='Number of people for the trip',
        ge=settings.NOTES_MIN_PEOPLE,
        le=settings.NOTES_MAX_PEOPLE,
    )
    key_ideas: str | None = Field(
        None,
        description='Key ideas or additional notes for the trip',
        max_length=settings.NOTES_KEY_IDEAS_MAX_LENGTH,
    )

    @model_validator(mode='after')
    def validate_dates(self) -> Self:
        """Validate that date_from <= date_to and duration <= 14 days."""
        if self.date_from > self.date_to:
            raise ValueError('Start date must be before or equal to end date')

        duration = (self.date_to - self.date_from).days
        if duration > settings.NOTES_MAX_TRIP_DURATION_DAYS:
            raise ValueError(f'Trip duration cannot exceed {settings.NOTES_MAX_TRIP_DURATION_DAYS} days')

        return self

    model_config = ConfigDict(
        json_schema_extra={
            'example': {
                'title': 'Trip to Paris',
                'place': 'Paris, France',
                'date_from': '2025-07-10',
                'date_to': '2025-07-15',
                'number_of_people': 2,
                'key_ideas': 'Eiffel Tower, Louvre Museum, Seine River cruise',
            }
        }
    )


class NoteUpdateInSchema(NoteCreateInSchema):
    """Schema for updating an existing note.

    This schema is used as input for the PUT /notes/{note_id} endpoint to update
    an existing travel note.
    """


class NoteOutSchema(BaseModel):
    """Schema for detailed note responses.

    This schema is used as output for the GET /notes/{note_id}, POST /notes,
    and PUT /notes/{note_id} endpoints.
    """

    id: int = Field(..., description="Note's unique identifier")
    user_id: UUID = Field(..., description='ID of the user who owns the note')
    title: str = Field(..., description='Title of the note')
    place: str = Field(..., description='Location or place for the trip')
    date_from: date = Field(..., description='Start date of the trip')
    date_to: date = Field(..., description='End date of the trip')
    number_of_people: int = Field(..., description='Number of people for the trip')
    key_ideas: str | None = Field(None, description='Key ideas or additional notes for the trip')
    created_at: datetime = Field(..., description='Timestamp of note creation')
    updated_at: datetime = Field(..., description='Timestamp of last note update')

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            'example': {
                'id': 123,
                'user_id': '550e8400-e29b-41d4-a716-446655440000',
                'title': 'Trip to Paris',
                'place': 'Paris, France',
                'date_from': '2025-07-10',
                'date_to': '2025-07-15',
                'number_of_people': 2,
                'key_ideas': 'Eiffel Tower, Louvre Museum, Seine River cruise',
                'created_at': '2025-05-11T10:00:00Z',
                'updated_at': '2025-05-11T10:00:00Z',
            }
        },
    )


class NoteListItemOutSchema(BaseModel):
    """Schema for note list item responses.

    This schema is used for individual items in the GET /notes response.
    """

    id: int = Field(..., description="Note's unique identifier")
    title: str = Field(..., description='Title of the note')
    place: str = Field(..., description='Location or place for the trip')
    date_from: date = Field(..., description='Start date of the trip')
    date_to: date = Field(..., description='End date of the trip')
    number_of_people: int = Field(..., description='Number of people for the trip')

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            'example': {
                'id': 123,
                'title': 'Trip to Paris',
                'place': 'Paris, France',
                'date_from': '2025-07-10',
                'date_to': '2025-07-15',
                'number_of_people': 2,
            }
        },
    )
