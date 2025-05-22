from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi_utils.cbv import cbv

from src.apps.notes.exceptions import NoteNotFoundError
from src.apps.plans.dependencies import (
    get_active_plan_usecase,
    get_create_or_accept_plan_usecase,
    get_generate_plan_usecase,
    get_update_plan_usecase,
)
from src.apps.plans.exceptions import (
    ActivePlanNotFoundError,
    PlanConflictError,
    PlanGenerationError,
    PlanNotFoundError,
)
from src.apps.plans.schemas.plan import PlanCreateInSchema, PlanGenerateOutSchema, PlanOutSchema, PlanUpdateInSchema
from src.apps.plans.usecases.create_or_accept_plan_usecase import CreateOrAcceptPlanUseCase
from src.apps.plans.usecases.dto.plan_dtos import (
    GeneratePlanInDTO,
    GetActivePlanInDTO,
    PlanCreateInDTO,
    UpdatePlanInDTO,
)
from src.apps.plans.usecases.generate_plan_usercase import GeneratePlanUseCase
from src.apps.plans.usecases.get_active_plan_usecase import GetActivePlanUseCase
from src.apps.plans.usecases.update_plan_usecase import UpdatePlanUseCase
from src.apps.users.auth import current_active_user
from src.apps.users.models.user import User

plan_router = APIRouter(prefix='/notes', tags=['notes', 'plans'])


@cbv(plan_router)
class PlanRouter:
    """Class-based views for plan operations."""

    current_user: User = Depends(current_active_user)
    generate_plan_usecase: GeneratePlanUseCase = Depends(get_generate_plan_usecase)
    create_or_accept_plan_usecase: CreateOrAcceptPlanUseCase = Depends(get_create_or_accept_plan_usecase)
    get_active_plan_usecase: GetActivePlanUseCase = Depends(get_active_plan_usecase)
    update_plan_usecase: UpdatePlanUseCase = Depends(get_update_plan_usecase)

    @plan_router.post(
        '/{note_id}/plan/generate',
        response_model=PlanGenerateOutSchema,
        status_code=status.HTTP_201_CREATED,
        summary='Generate an AI-powered travel plan based on a note',
        description='Generates a plan proposal based on the content of the specified note and user preferences.',
        responses={
            status.HTTP_201_CREATED: {
                'description': 'Successfully generated a plan proposal',
                'model': PlanGenerateOutSchema,
            },
            status.HTTP_404_NOT_FOUND: {
                'description': 'Note not found or not owned by current user',
            },
            status.HTTP_500_INTERNAL_SERVER_ERROR: {
                'description': 'Failed to generate plan due to internal error',
            },
        },
    )
    async def generate_plan(self, note_id: int) -> PlanGenerateOutSchema:
        """Generate a travel plan for the specified note."""
        input_dto = GeneratePlanInDTO(note_id=note_id, user_id=self.current_user.id)

        try:
            plan_proposal = await self.generate_plan_usecase.execute(input_dto)
        except NoteNotFoundError as exc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(exc),
            ) from exc
        except PlanGenerationError as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=str(exc),
            ) from exc

        return PlanGenerateOutSchema.model_validate(plan_proposal)

    @plan_router.post(
        '/{note_id}/plan',
        response_model=PlanOutSchema,
        status_code=status.HTTP_201_CREATED,
        summary='Create or accept a travel plan for a note',
        description='Creates a new travel plan or accepts/modifies an AI-generated plan proposal.',
        responses={
            status.HTTP_201_CREATED: {
                'description': 'Successfully created or accepted a plan',
                'model': PlanOutSchema,
            },
            status.HTTP_400_BAD_REQUEST: {
                'description': 'Invalid input combinations',
            },
            status.HTTP_404_NOT_FOUND: {
                'description': 'Note not found, not owned by current user, or plan proposal not found',
            },
            status.HTTP_409_CONFLICT: {
                'description': 'An active plan already exists for this note',
            },
            status.HTTP_422_UNPROCESSABLE_ENTITY: {
                'description': 'Invalid input data',
            },
        },
    )
    async def create_or_accept_plan(self, note_id: int, plan_data: PlanCreateInSchema) -> PlanOutSchema:
        """
        Create a new travel plan or accept/modify an AI-generated plan proposal.

        This endpoint supports three scenarios:
        1. Accept AI Plan: When only generation_id is provided
        2. Hybrid Plan: When both generation_id and plan_text are provided
        3. Manual Plan: When only plan_text is provided

        Args:
            note_id: ID of the note to create/accept a plan for
            plan_data: The plan data containing generation_id and/or plan_text

        Returns:
            The created or accepted plan

        Raises:
            400: For invalid input combinations
            404: If note or AI plan generation not found
            409: If an active plan already exists for this note
            422: If the input data is invalid
        """
        try:
            plan = await self.create_or_accept_plan_usecase.execute(
                PlanCreateInDTO(
                    note_id=note_id,
                    user_id=self.current_user.id,
                    generation_id=plan_data.generation_id,
                    plan_text=plan_data.plan_text,
                )
            )
        except NoteNotFoundError as exc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f'Note with ID {note_id} not found or not owned by current user',
            ) from exc
        except PlanNotFoundError as exc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Plan proposal not found',
            ) from exc
        except PlanConflictError as exc:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f'An active plan already exists for note {note_id}',
            ) from exc

        return PlanOutSchema.model_validate(plan)

    @plan_router.get(
        '/{note_id}/plan',
        response_model=PlanOutSchema,
        status_code=status.HTTP_200_OK,
        summary='Get the active plan for a note',
        description='Retrieves the most recently updated active plan for the specified note.',
        responses={
            status.HTTP_200_OK: {
                'description': 'Successfully retrieved the active plan',
                'model': PlanOutSchema,
            },
            status.HTTP_204_NO_CONTENT: {
                'description': 'No active plan exists for the note',
            },
            status.HTTP_404_NOT_FOUND: {
                'description': 'Note not found or not owned by the current user',
            },
        },
    )
    async def get_active_plan(self, note_id: int) -> PlanOutSchema | Response:
        """
        Get the active plan for a note.

        This endpoint retrieves the current active plan for a note. It returns a 204 No Content
        response if no active plan exists for the note.

        Args:
            note_id: ID of the note to get the active plan for

        Returns:
            The active plan details if found, otherwise a 204 No Content response

        Raises:
            HTTPException: If the note is not found or not owned by the current user (404)
        """
        try:
            plan = await self.get_active_plan_usecase.execute(
                input_dto=GetActivePlanInDTO(
                    note_id=note_id,
                    user_id=self.current_user.id,
                ),
            )
        except ActivePlanNotFoundError:
            return Response(status_code=status.HTTP_204_NO_CONTENT)
        except NoteNotFoundError as exc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f'Note with ID {note_id} not found',
            ) from exc

        return PlanOutSchema.model_validate(plan)

    @plan_router.put(
        '/{note_id}/plan',
        response_model=PlanOutSchema,
        status_code=status.HTTP_200_OK,
        summary='Update an existing active plan for a note',
        description='Updates the text of an existing active plan for the specified note.',
        responses={
            status.HTTP_200_OK: {
                'description': 'Successfully updated the active plan',
                'model': PlanOutSchema,
            },
            status.HTTP_404_NOT_FOUND: {
                'description': 'Note not found or no active plan exists for the note',
            },
        },
    )
    async def update_plan(
        self,
        note_id: int,
        plan_data: PlanUpdateInSchema,
    ) -> PlanOutSchema:
        """
        Update an existing active plan for a note.

        This endpoint allows users to update the text of an existing active plan.
        If the plan was originally AI-generated (type is 'AI'), its type will be
        changed to 'HYBRID' to reflect the manual modifications.

        Args:
            note_id: The ID of the note whose plan is being updated
            plan_data: The updated plan data containing the new plan text

        Returns:
            The updated plan with all its details

        Raises:
            404: If the note doesn't exist, doesn't belong to the user, or has no active plan
            422: If the input data is invalid (e.g., plan text too long)
        """
        try:
            plan = await self.update_plan_usecase.execute(
                input_dto=UpdatePlanInDTO(
                    note_id=note_id,
                    user_id=self.current_user.id,
                    plan_text=plan_data.plan_text,
                ),
            )
        except NoteNotFoundError as exc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f'Note with ID {note_id} not found',
            ) from exc
        except ActivePlanNotFoundError as exc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f'No active plan found for note with ID {note_id}',
            ) from exc

        return PlanOutSchema.model_validate(plan)
