
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi_utils.cbv import cbv

from src.apps.notes.exceptions import NoteNotFoundError
from src.apps.plans.dependencies import get_generate_plan_usecase
from src.apps.plans.exceptions import (
    AIServiceTimeoutError,
    AIServiceUnavailableError,
    PlanGenerationError,
)
from src.apps.plans.schemas.plan import PlanGenerateOutSchema
from src.apps.plans.usecases.dto.plan_dtos import GeneratePlanInDTO
from src.apps.plans.usecases.generate_plan_usercase import GeneratePlanUseCase
from src.apps.users.auth import current_active_user
from src.apps.users.models.user import User

plan_router = APIRouter(prefix='/notes', tags=['notes', 'plans'])


@cbv(plan_router)
class PlanRouter:
    """Class-based views for plan operations."""

    current_user: User = Depends(current_active_user)
    generate_plan_usecase: GeneratePlanUseCase = Depends(get_generate_plan_usecase)

    @plan_router.post(
        '/{note_id}/plan/generate',
        response_model=PlanGenerateOutSchema,
        status_code=status.HTTP_201_CREATED,
        summary='Generate an AI-powered travel plan based on a note',
        description='Generates a plan proposal based on the content of the specified note and user preferences.',
    )
    async def generate_plan(self, note_id: int) -> PlanGenerateOutSchema:
        """Generate a travel plan for the specified note."""
        input_dto = GeneratePlanInDTO(note_id=note_id, user_id=self.current_user.id)

        try:
            result = await self.generate_plan_usecase.execute(input_dto)
        except NoteNotFoundError as exc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(exc),
            ) from exc
        except AIServiceTimeoutError as exc:
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail=str(exc),
            ) from exc
        except AIServiceUnavailableError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=str(exc),
            ) from exc
        except PlanGenerationError as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=str(exc),
            ) from exc

        return PlanGenerateOutSchema(
            generation_id=result.generation_id,
            plan_text=result.plan_text,
            status=result.status,
        )
