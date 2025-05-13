from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from src.apps.users.enums import UserBudgetEnum, UserTravelPaceEnum, UserTravelStyleEnum


class UserProfileInSchema(BaseModel):
    """Schema for updating or creating a user profile.

    This schema is used as input for the PUT /profile endpoint to update
    the authenticated user's travel preferences.
    """

    travel_style: UserTravelStyleEnum | None = Field(
        None,
        description="User's preferred travel style - Can be RELAX, ADVENTURE, CULTURE, PARTY, or null",
    )
    preferred_pace: UserTravelPaceEnum | None = Field(
        None,
        description="User's preferred travel pace - Can be CALM, MODERATE, INTENSE, or null",
    )
    budget: UserBudgetEnum | None = Field(
        None,
        description="User's preferred budget - Can be LOW, MEDIUM, HIGH, or null",
    )

    model_config = ConfigDict(
        json_schema_extra={
            'example': {
                'travel_style': 'ADVENTURE',
                'preferred_pace': 'MODERATE',
                'budget': 'MEDIUM',
            }
        }
    )


class UserProfileOutSchema(BaseModel):
    """Schema for user profile responses.

    This schema is used as output for the GET /profile and PUT /profile endpoints.
    """

    travel_style: UserTravelStyleEnum | None = Field(
        None,
        description="User's preferred travel style",
    )
    preferred_pace: UserTravelPaceEnum | None = Field(
        None,
        description="User's preferred travel pace",
    )
    budget: UserBudgetEnum | None = Field(
        None,
        description="User's preferred budget",
    )
    updated_at: datetime = Field(
        ...,
        description='Timestamp of the last profile update',
    )

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            'example': {
                'travel_style': 'ADVENTURE',
                'preferred_pace': 'MODERATE',
                'budget': 'MEDIUM',
                'updated_at': '2025-05-11T10:00:00Z',
            }
        },
    )
