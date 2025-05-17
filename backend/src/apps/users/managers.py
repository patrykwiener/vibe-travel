import uuid
from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import Depends, Request
from fastapi_users import BaseUserManager, UUIDIDMixin
from fastapi_users.db import SQLAlchemyUserDatabase

from src.apps.users.db import get_user_db
from src.apps.users.dependencies import get_create_user_profile_use_case
from src.apps.users.models.user import User
from src.apps.users.usecases.profile_usecases import CreateUserProfileUseCase
from src.config import settings


class UserManager(UUIDIDMixin, BaseUserManager[User, uuid.UUID]):
    """User manager for FastAPI Users.

    This class handles user management operations such as registration,
    password reset, and email verification.
    """

    user_db = SQLAlchemyUserDatabase[User, uuid.UUID]

    reset_password_token_secret = settings.JWT_SECRET_KEY
    verification_token_secret = settings.JWT_SECRET_KEY

    def __init__(
        self,
        user_db: SQLAlchemyUserDatabase[User, uuid.UUID],
        create_user_profile_use_case: CreateUserProfileUseCase,
    ) -> None:
        """Initialize the UserManager with a user database."""
        super().__init__(user_db)
        self.create_user_profile_use_case = create_user_profile_use_case

    async def on_after_register(self, user: User, request: Request | None = None) -> None:
        """Called after a user registers."""
        await self.create_user_profile_use_case.execute(user_id=user.id)


async def get_user_manager(
    user_db: Annotated[SQLAlchemyUserDatabase, Depends(get_user_db)],
    create_user_profile_use_case: Annotated[CreateUserProfileUseCase, Depends(get_create_user_profile_use_case)],
) -> AsyncGenerator[UserManager]:
    """
    Get the user manager.

    This function provides a dependency that yields a UserManager instance,
    which is required by FastAPI Users to handle user operations.
    """
    yield UserManager(user_db, create_user_profile_use_case)
