"""Database utilities for user authentication."""

from typing import Annotated

from fastapi import Depends
from fastapi_users.db import SQLAlchemyUserDatabase
from sqlalchemy.ext.asyncio import AsyncSession

from src.apps.users.models import User
from src.database import get_async_session


async def get_user_db(session: Annotated[AsyncSession, Depends(get_async_session)]):
    """Dependency that provides a user database."""
    yield SQLAlchemyUserDatabase(session, User)
