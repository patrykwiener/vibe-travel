import uuid
from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import Depends, Request
from fastapi_users import BaseUserManager, UUIDIDMixin
from fastapi_users.db import SQLAlchemyUserDatabase

from src.apps.users.db import get_user_db
from src.apps.users.models import User
from src.config import settings


class UserManager(UUIDIDMixin, BaseUserManager[User, uuid.UUID]):
    """User manager for FastAPI Users.

    This class handles user management operations such as registration,
    password reset, and email verification.
    """

    reset_password_token_secret = settings.JWT_SECRET_KEY
    verification_token_secret = settings.JWT_SECRET_KEY

    async def on_after_register(self, user: User, request: Request | None = None) -> None:
        """Called after a user registers."""
        print(f'User {user.id} has registered.')

    async def on_after_forgot_password(self, user: User, token: str, request: Request | None = None) -> None:
        """Called after a user requests a password reset."""
        print(f'User {user.id} has forgot their password. Reset token: {token}')

    async def on_after_request_verify(self, user: User, token: str, request: Request | None = None) -> None:
        """Called after a user requests email verification."""


async def get_user_manager(
    user_db: Annotated[SQLAlchemyUserDatabase, Depends(get_user_db)],
) -> AsyncGenerator[UserManager]:
    """
    Get the user manager.

    This function provides a dependency that yields a UserManager instance,
    which is required by FastAPI Users to handle user operations.
    """
    yield UserManager(user_db)
