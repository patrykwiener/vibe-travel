"""Data Transfer Objects for plan generation combining note and user information."""

from dataclasses import dataclass
from datetime import date
from typing import Self

from src.apps.notes.models.note import Note
from src.apps.users.enums import UserBudgetEnum, UserTravelPaceEnum, UserTravelStyleEnum
from src.apps.users.models.profile import UserProfile


@dataclass
class TravelPlanGenerationDTO:
    """DTO containing combined note travel information and user preferences for prompt generation."""

    note_id: int
    title: str
    place: str
    date_from: date
    date_to: date
    number_of_people: int
    max_length: int
    key_ideas: str | None = None
    travel_style: UserTravelStyleEnum | None = None
    preferred_pace: UserTravelPaceEnum | None = None
    budget: UserBudgetEnum | None = None

    @classmethod
    def from_note_and_profile(cls, note: Note, user_profile: UserProfile, max_length: int) -> Self:
        """Create DTO from Note entity and user profile."""
        return cls(
            # Note information
            note_id=note.id,
            title=note.title,
            place=note.place,
            date_from=note.date_from,
            date_to=note.date_to,
            number_of_people=note.number_of_people,
            key_ideas=note.key_ideas,
            # User preferences
            travel_style=user_profile.travel_style,
            preferred_pace=user_profile.preferred_pace,
            budget=user_profile.budget,
            # technical settings
            max_length=max_length,
        )
