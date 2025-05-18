import uuid

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from src.apps.users.enums import UserBudgetEnum, UserTravelPaceEnum, UserTravelStyleEnum
from src.apps.users.models.profile import UserProfile


class UserProfileRepository:
    """Repository for accessing and manipulating user profile data."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_user_id(self, user_id: uuid.UUID) -> UserProfile | None:
        """Get a user profile by user ID."""
        result = await self.session.execute(select(UserProfile).where(UserProfile.user_id == user_id))
        return result.scalars().first()

    async def create(self, user_id: uuid.UUID) -> UserProfile:
        """Create a new user profile."""
        db_profile = UserProfile(user_id=user_id)
        self.session.add(db_profile)
        await self.session.commit()
        await self.session.refresh(db_profile)
        return db_profile

    async def update(
        self,
        profile: UserProfile,
        travel_style: UserTravelStyleEnum | None,
        preferred_pace: UserTravelPaceEnum | None,
        budget: UserBudgetEnum | None,
    ) -> UserProfile:
        """Update an existing user profile with the given data."""
        profile.travel_style = travel_style
        profile.preferred_pace = preferred_pace
        profile.budget = budget

        await self.session.commit()
        await self.session.refresh(profile)
        return profile

    async def get_user_preferences(self, user_id: uuid.UUID) -> dict:
        """Get a user's travel preferences.

        Args:
            user_id: ID of the user

        Returns:
            Dictionary containing user travel preferences
        """
        profile = await self.get_by_user_id(user_id)

        if profile is None:
            return {}

        return {
            'travel_style': profile.travel_style,
            'budget': profile.budget,
            'preferred_pace': profile.preferred_pace,
        }
