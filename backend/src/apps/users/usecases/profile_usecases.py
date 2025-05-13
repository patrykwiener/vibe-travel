import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from src.apps.users.exceptions import ProfileNotFoundError
from src.apps.users.repositories.profile_repository import UserProfileRepository
from src.apps.users.usecases.dto.profile_dto import (
    CreateUserProfileOutDTO,
    GetUserProfileOutDTO,
)


class GetUserProfileUseCase:
    """Use case for retrieving a user's profile by their user ID."""

    def __init__(self, profile_repository: UserProfileRepository):
        """Initialize the use case with a profile repository."""
        self.profile_repository = profile_repository

    async def execute(self, db: AsyncSession, user_id: uuid.UUID) -> GetUserProfileOutDTO:
        """Execute the use case to retrieve a user profile."""
        profile = await self.profile_repository.get_by_user_id(db, user_id)
        if profile is None:
            raise ProfileNotFoundError
        return GetUserProfileOutDTO.model_validate(profile)


class CreateUserProfileUseCase:
    """Use case for creating a user profile."""

    def __init__(self, profile_repository: UserProfileRepository):
        """Initialize the use case with a profile repository."""
        self.profile_repository = profile_repository

    async def execute(self, db: AsyncSession, user_id: uuid.UUID) -> CreateUserProfileOutDTO:
        """Execute the use case to create a user profile."""
        existing_profile = await self.profile_repository.get_by_user_id(db, user_id)
        if existing_profile:
            return CreateUserProfileOutDTO.model_validate(existing_profile)

        profile = await self.profile_repository.create(db, user_id=user_id)
        return CreateUserProfileOutDTO.model_validate(profile)
