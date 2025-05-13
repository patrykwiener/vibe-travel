from fastapi import APIRouter, Depends, HTTPException
from fastapi_utils.cbv import cbv
from sqlalchemy.ext.asyncio import AsyncSession

from src.apps.users.auth import current_active_user
from src.apps.users.dependencies import get_user_profile_use_case
from src.apps.users.exceptions import ProfileNotFoundError
from src.apps.users.models.user import User
from src.apps.users.schemas.profile import UserProfileOutSchema
from src.apps.users.usecases.profile_usecases import GetUserProfileUseCase
from src.database import get_async_session

router = APIRouter(prefix='/profile', tags=['profile'])


@cbv(router)
class UserProfileCBV:
    """Class-based view for user profile operations."""

    user: User = Depends(current_active_user)
    db: AsyncSession = Depends(get_async_session)
    use_case: GetUserProfileUseCase = Depends(get_user_profile_use_case)

    @router.get('/', response_model=UserProfileOutSchema)
    async def get_profile(self) -> UserProfileOutSchema:
        """Retrieve the authenticated user's profile."""
        try:
            profile_dto = await self.use_case.execute(self.db, self.user.id)
        except ProfileNotFoundError as exc:
            raise HTTPException(
                status_code=404,
                detail='User profile not found.',
            ) from exc
        return UserProfileOutSchema.model_validate(profile_dto)
