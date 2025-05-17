import uuid

from src.apps.users.exceptions import ProfileNotFoundError
from src.apps.users.models.profile import UserProfile
from src.apps.users.repositories.profile_repository import UserProfileRepository
from src.apps.users.usecases.dto.profile_dto import (
    CreateUserProfileOutDTO,
    GetUserProfileOutDTO,
    UpdateUserProfileInDTO,
    UpdateUserProfileOutDTO,
)


class GetUserProfileUseCase:
    """Use case for retrieving a user's profile by their user ID."""

    def __init__(self, profile_repository: UserProfileRepository):
        """Initialize the use case with a profile repository."""
        self.profile_repository = profile_repository

    async def execute(self, user_id: uuid.UUID) -> GetUserProfileOutDTO:
        """Execute the use case to retrieve a user profile."""
        profile = await self.profile_repository.get_by_user_id(user_id)
        if profile is None:
            raise ProfileNotFoundError
        return GetUserProfileOutDTO.model_validate(profile)


class CreateUserProfileUseCase:
    """Use case for creating a user profile."""

    def __init__(self, profile_repository: UserProfileRepository):
        """Initialize the use case with a profile repository."""
        self.profile_repository = profile_repository

    async def execute(self, user_id: uuid.UUID) -> CreateUserProfileOutDTO:
        """Execute the use case to create a user profile."""
        existing_profile = await self.profile_repository.get_by_user_id(user_id)
        if existing_profile:
            return CreateUserProfileOutDTO.model_validate(existing_profile)

        profile = await self.profile_repository.create(user_id=user_id)
        return CreateUserProfileOutDTO.model_validate(profile)


class UpdateUserProfileUseCase:
    """Use case for updating a user profile."""

    def __init__(self, profile_repository: UserProfileRepository):
        """Initialize the use case with a profile repository."""
        self.profile_repository = profile_repository

    async def execute(self, input_data: UpdateUserProfileInDTO) -> UpdateUserProfileOutDTO:
        """
        Execute the use case to update a user profile.

        This use case will first create a profile if one doesn't exist for the user,
        then update it with the provided data.
        """
        profile = await self._get_profile(input_data.user_id)

        updated_profile = await self.profile_repository.update(
            profile=profile,
            travel_style=input_data.travel_style,
            preferred_pace=input_data.preferred_pace,
            budget=input_data.budget,
        )

        return UpdateUserProfileOutDTO.model_validate(updated_profile)

    async def _get_profile(self, user_id: uuid.UUID) -> UserProfile:
        """Get a user profile by user ID."""
        profile = await self.profile_repository.get_by_user_id(user_id)
        if profile is None:
            profile = await self.profile_repository.create(user_id=user_id)
        return profile
