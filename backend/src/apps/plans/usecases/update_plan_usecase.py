"""Use case for updating an existing plan."""

from uuid import UUID

from src.apps.notes.repositories.note_repository import NoteRepository
from src.apps.plans.enums import PlanStatusEnum
from src.apps.plans.exceptions import ActivePlanNotFoundError
from src.apps.plans.models.plan import Plan
from src.apps.plans.repositories.plan_repository import PlanRepository
from src.apps.plans.usecases.dto.plan_dtos import UpdatePlanInDTO, UpdatePlanOutDTO


class UpdatePlanUseCase:
    """Use case for updating an existing plan."""

    def __init__(self, plan_repository: PlanRepository, note_repository: NoteRepository):
        """Initialize the use case with required repositories."""
        self.plan_repository = plan_repository
        self.note_repository = note_repository

    async def execute(self, input_dto: UpdatePlanInDTO) -> UpdatePlanOutDTO:
        """
        Update an existing active plan for a note.

        Args:
            input_dto: Update plan input data

        Returns:
            The updated plan data

        Raises:
            NoteNotFoundError: When note doesn't exist or doesn't belong to the user
            ActivePlanNotFoundError: When no active plan exists for the note
        """
        await self._verify_note_exists(
            note_id=input_dto.note_id,
            user_id=input_dto.user_id,
        )

        plan = await self._fetch_active_plan(note_id=input_dto.note_id)

        updated_plan = await self._update_plan(
            plan=plan,
            new_plan_text=input_dto.plan_text,
        )

        return self._to_dto(updated_plan)

    async def _verify_note_exists(self, note_id: int, user_id: UUID) -> None:
        """Check if the note exists and belongs to the user."""
        await self.note_repository.get_by_id(note_id=note_id, user_id=user_id)

    async def _fetch_active_plan(self, note_id: int) -> Plan:
        """Fetch the active plan for a given note ID."""
        plan = await self.plan_repository.get_last_updated_by_note_id_and_status(
            note_id=note_id,
            status=PlanStatusEnum.ACTIVE,
        )
        if plan is None:
            raise ActivePlanNotFoundError(note_id=note_id)
        return plan

    async def _update_plan(self, plan: Plan, new_plan_text: str) -> Plan:
        """Update the plan with new text and change type if necessary."""
        plan.update(new_plan_text=new_plan_text)
        return await self.plan_repository.update_plan(plan)

    def _to_dto(self, plan: Plan) -> UpdatePlanOutDTO:
        """Convert a Plan object to a DTO."""
        return UpdatePlanOutDTO(
            id=plan.id,
            note_id=plan.note_id,
            plan_text=plan.plan_text,
            type=plan.type,
            status=plan.status,
            generation_id=plan.generation_id,
            created_at=plan.created_at,
            updated_at=plan.updated_at,
        )
