from uuid import UUID

from src.apps.notes.repositories.note_repository import NoteRepository
from src.apps.plans.enums import PlanStatusEnum
from src.apps.plans.exceptions import PlanConflictError
from src.apps.plans.models.plan import Plan
from src.apps.plans.repositories.plan_repository import PlanRepository
from src.apps.plans.usecases.dto.plan_dtos import PlanCreateInDTO, PlanCreateOutDTO
from src.apps.plans.usecases.strategies.create_plan_strategies import (
    AcceptAIPlanStrategy,
    CreateHybridPlanStrategy,
    CreateManualPlanStrategy,
    PlanStrategy,
)


class CreateOrAcceptPlanUseCase:
    """Use case for creating or accepting a plan."""

    def __init__(
        self,
        plan_repository: PlanRepository,
        note_repository: NoteRepository,
    ):
        self.plan_repository = plan_repository
        self.note_repository = note_repository

        self.strategies = {
            'accept_ai': AcceptAIPlanStrategy(plan_repository),
            'create_hybrid': CreateHybridPlanStrategy(plan_repository),
            'create_manual': CreateManualPlanStrategy(plan_repository),
        }

    async def execute(self, input_dto: PlanCreateInDTO) -> PlanCreateOutDTO:
        """
        Create a new plan or accept/modify an existing AI-generated plan.

        Args:
            input_dto: The input data containing note_id, user_id, and optional generation_id and plan_text

        Returns:
            DTO with the created/updated plan details
        """
        await self._validate_note_exists(
            note_id=input_dto.note_id,
            user_id=input_dto.user_id,
        )
        await self._validate_no_active_plan_conflict(input_dto)

        strategy = self._select_strategy(input_dto)

        plan = await strategy.execute(
            note_id=input_dto.note_id,
            generation_id=input_dto.generation_id,
            plan_text=input_dto.plan_text,
        )

        return self._to_dto(plan)

    async def _validate_note_exists(self, note_id: int, user_id: UUID) -> None:
        """Check if the note exists and belongs to the user."""
        await self.note_repository.get_by_id(note_id=note_id, user_id=user_id)

    async def _validate_no_active_plan_conflict(self, input_dto: PlanCreateInDTO) -> None:
        """Check if an active plan exists and raise exception if needed."""
        if input_dto.generation_id is not None:
            return  # No need to check for active plan if generation_id is provided

        # Check if an active plan already exists for the note
        active_plan = await self.plan_repository.get_last_updated_by_note_id_and_status(
            note_id=input_dto.note_id,
            status=PlanStatusEnum.ACTIVE,
        )
        if active_plan:
            raise PlanConflictError(note_id=input_dto.note_id)

    def _select_strategy(self, input_dto: PlanCreateInDTO) -> PlanStrategy:
        """Select the appropriate strategy based on input parameters."""
        if input_dto.generation_id is not None:
            if input_dto.plan_text is None:
                return AcceptAIPlanStrategy(self.plan_repository)
            return CreateHybridPlanStrategy(self.plan_repository)

        if input_dto.plan_text is None:
            raise ValueError('plan_text must be provided for manual plans')

        return CreateManualPlanStrategy(self.plan_repository)

    def _to_dto(self, plan: Plan) -> PlanCreateOutDTO:
        """Convert a Plan model to PlanCreateOutDTO."""
        return PlanCreateOutDTO(
            id=plan.id,
            note_id=plan.note_id,
            plan_text=plan.plan_text,
            type=plan.type,
            status=plan.status,
            generation_id=plan.generation_id,
            created_at=plan.created_at,
            updated_at=plan.updated_at,
        )
