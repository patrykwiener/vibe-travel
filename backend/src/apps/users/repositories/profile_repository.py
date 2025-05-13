import uuid

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from src.apps.users.models.profile import UserProfile


class UserProfileRepository:
    """Repository for accessing and manipulating user profile data."""

    async def get_by_user_id(self, db: AsyncSession, user_id: uuid.UUID) -> UserProfile | None:
        """Get a user profile by user ID."""
        result = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
        return result.scalars().first()

    async def create(self, db: AsyncSession, user_id: uuid.UUID) -> UserProfile:
        """Create a new user profile."""
        db_profile = UserProfile(user_id=user_id)
        db.add(db_profile)
        await db.commit()
        await db.refresh(db_profile)
        return db_profile
