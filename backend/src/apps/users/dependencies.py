from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.apps.users.repositories.profile_repository import UserProfileRepository
from src.apps.users.usecases.profile_usecases import (
    CreateUserProfileUseCase,
    GetUserProfileUseCase,
    UpdateUserProfileUseCase,
)
from src.database import get_async_session


def get_profile_repository(
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> UserProfileRepository:
    """Get a UserProfileRepository instance."""
    return UserProfileRepository(session=session)


def get_user_profile_use_case(
    profile_repository: Annotated[UserProfileRepository, Depends(get_profile_repository)],
) -> GetUserProfileUseCase:
    """Get a GetUserProfileUseCase instance with injected dependencies."""
    return GetUserProfileUseCase(profile_repository=profile_repository)


def get_create_user_profile_use_case(
    profile_repository: Annotated[UserProfileRepository, Depends(get_profile_repository)],
) -> CreateUserProfileUseCase:
    """Get a CreateUserProfileUseCase instance with injected dependencies."""
    return CreateUserProfileUseCase(profile_repository=profile_repository)


def get_update_user_profile_use_case(
    profile_repository: Annotated[UserProfileRepository, Depends(get_profile_repository)],
) -> UpdateUserProfileUseCase:
    """Get an UpdateUserProfileUseCase instance with injected dependencies."""
    return UpdateUserProfileUseCase(profile_repository=profile_repository)
