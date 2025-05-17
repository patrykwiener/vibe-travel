from fastapi import APIRouter, Depends, HTTPException
from fastapi_utils.cbv import cbv

from src.apps.users.auth import current_active_user
from src.apps.users.dependencies import get_update_user_profile_use_case, get_user_profile_use_case
from src.apps.users.exceptions import ProfileNotFoundError
from src.apps.users.models.user import User
from src.apps.users.schemas.profile import UserProfileInSchema, UserProfileOutSchema
from src.apps.users.usecases.dto.profile_dto import UpdateUserProfileInDTO
from src.apps.users.usecases.profile_usecases import GetUserProfileUseCase, UpdateUserProfileUseCase

router = APIRouter(prefix='/profile', tags=['profile'])


@cbv(router)
class UserProfileCBV:
    """Class-based view for user profile operations."""

    user: User = Depends(current_active_user)
    get_profile_use_case: GetUserProfileUseCase = Depends(get_user_profile_use_case)
    update_profile_use_case: UpdateUserProfileUseCase = Depends(get_update_user_profile_use_case)

    @router.get('/', response_model=UserProfileOutSchema)
    async def get_profile(self) -> UserProfileOutSchema:
        """Retrieve the user's profile."""
        try:
            profile_dto = await self.get_profile_use_case.execute(user_id=self.user.id)
        except ProfileNotFoundError as exc:
            raise HTTPException(
                status_code=404,
                detail='User profile not found.',
            ) from exc
        return UserProfileOutSchema.model_validate(profile_dto)

    @router.put('/', response_model=UserProfileOutSchema)
    async def update_profile(self, profile_data: UserProfileInSchema) -> UserProfileOutSchema:
        """Update the user's profile."""
        update_dto = UpdateUserProfileInDTO(
            user_id=self.user.id,
            travel_style=profile_data.travel_style,
            preferred_pace=profile_data.preferred_pace,
            budget=profile_data.budget,
        )

        updated_profile = await self.update_profile_use_case.execute(input_data=update_dto)

        return UserProfileOutSchema.model_validate(updated_profile)
