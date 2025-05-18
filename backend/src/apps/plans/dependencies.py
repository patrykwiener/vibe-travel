from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.apps.notes.dependencies import get_note_repository
from src.apps.notes.repositories.note_repository import NoteRepository
from src.apps.plans.repositories.plan_repository import PlanRepository
from src.apps.plans.services.plan_generation_service import PlanGenerationService
from src.apps.plans.usecases.generate_plan_usercase import GeneratePlanUseCase
from src.apps.users.dependencies import get_profile_repository
from src.apps.users.repositories.profile_repository import UserProfileRepository
from src.config import settings
from src.database import get_async_session


def get_plan_repository(session: Annotated[AsyncSession, Depends(get_async_session)]) -> PlanRepository:
    """Get an instance of the plan repository."""
    return PlanRepository(session)


def get_plan_generation_service() -> PlanGenerationService:
    """Get an instance of the plan generation service."""
    return PlanGenerationService(timeout_seconds=settings.PLAN_GENERATION_TIMEOUT_SECONDS)


def get_generate_plan_usecase(
    plan_repository: Annotated[PlanRepository, Depends(get_plan_repository)],
    note_repository: Annotated[NoteRepository, Depends(get_note_repository)],
    user_profile_repository: Annotated[UserProfileRepository, Depends(get_profile_repository)],
    plan_generation_service: Annotated[PlanGenerationService, Depends(get_plan_generation_service)],
) -> GeneratePlanUseCase:
    """Get an instance of the generate plan use case."""
    return GeneratePlanUseCase(
        plan_repository=plan_repository,
        note_repository=note_repository,
        user_profile_repository=user_profile_repository,
        plan_generation_service=plan_generation_service,
    )
