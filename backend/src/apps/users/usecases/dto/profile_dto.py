import uuid
from datetime import datetime

from pydantic import BaseModel

from src.apps.users.enums import UserBudgetEnum, UserTravelPaceEnum, UserTravelStyleEnum


class GetUserProfileOutDTO(BaseModel):
    """Output DTO for GetUserProfileUseCase."""

    travel_style: UserTravelStyleEnum | None
    preferred_pace: UserTravelPaceEnum | None
    budget: UserBudgetEnum | None
    updated_at: datetime

    class Config:
        from_attributes = True


class CreateUserProfileOutDTO(BaseModel):
    """Output DTO for CreateUserProfileUseCase."""

    id: int
    user_id: uuid.UUID
    travel_style: UserTravelStyleEnum | None
    preferred_pace: UserTravelPaceEnum | None
    budget: UserBudgetEnum | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
