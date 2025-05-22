from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.apps.notes.dependencies import get_note_repository
from src.apps.notes.repositories.note_repository import NoteRepository
from src.apps.plans.adapters.travel_plan_prompt_adapter import TravelPlanPromptAdapter
from src.apps.plans.repositories.plan_repository import PlanRepository
from src.apps.plans.services.plan_generation_service import PlanGenerationService
from src.apps.plans.usecases.create_or_accept_plan_usecase import CreateOrAcceptPlanUseCase
from src.apps.plans.usecases.generate_plan_usercase import GeneratePlanUseCase
from src.apps.plans.usecases.get_active_plan_usecase import GetActivePlanUseCase
from src.apps.plans.usecases.update_plan_usecase import UpdatePlanUseCase
from src.apps.users.dependencies import get_profile_repository
from src.apps.users.repositories.profile_repository import UserProfileRepository
from src.config import settings
from src.database import get_async_session
from src.dependencies import get_ai_service
from src.insfrastructure.ai.interfaces import AIModelService


def get_plan_repository(session: Annotated[AsyncSession, Depends(get_async_session)]) -> PlanRepository:
    """Get an instance of the plan repository."""
    return PlanRepository(session)


def get_prompt_adapter() -> TravelPlanPromptAdapter:
    """Get an instance of the travel plan prompt adapter."""
    return TravelPlanPromptAdapter(model=settings.OPENROUTER_MODEL)


def get_plan_generation_service(
    ai_service: Annotated[AIModelService, Depends(get_ai_service)],
    prompt_adapter: Annotated[TravelPlanPromptAdapter, Depends(get_prompt_adapter)],
) -> PlanGenerationService:
    """Get an instance of the plan generation service."""
    return PlanGenerationService(
        ai_service=ai_service,
        prompt_adapter=prompt_adapter,
    )


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
        plan_max_length=settings.PLANS_TEXT_MAX_LENGTH,
    )


def get_create_or_accept_plan_usecase(
    plan_repository: Annotated[PlanRepository, Depends(get_plan_repository)],
    note_repository: Annotated[NoteRepository, Depends(get_note_repository)],
) -> CreateOrAcceptPlanUseCase:
    """Get an instance of the create or accept plan use case."""
    return CreateOrAcceptPlanUseCase(
        plan_repository=plan_repository,
        note_repository=note_repository,
    )


def get_active_plan_usecase(
    plan_repository: Annotated[PlanRepository, Depends(get_plan_repository)],
    note_repository: Annotated[NoteRepository, Depends(get_note_repository)],
) -> GetActivePlanUseCase:
    """Get an instance of the get active plan use case."""
    return GetActivePlanUseCase(
        plan_repository=plan_repository,
        note_repository=note_repository,
    )


def get_update_plan_usecase(
    plan_repository: Annotated[PlanRepository, Depends(get_plan_repository)],
    note_repository: Annotated[NoteRepository, Depends(get_note_repository)],
) -> UpdatePlanUseCase:
    """Get an instance of the update plan use case."""
    return UpdatePlanUseCase(
        plan_repository=plan_repository,
        note_repository=note_repository,
    )
