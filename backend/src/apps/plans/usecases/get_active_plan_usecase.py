from uuid import UUID

from src.apps.notes.repositories.note_repository import NoteRepository
from src.apps.plans.enums import PlanStatusEnum
from src.apps.plans.exceptions import ActivePlanNotFoundError
from src.apps.plans.models.plan import Plan
from src.apps.plans.repositories.plan_repository import PlanRepository
from src.apps.plans.usecases.dto.plan_dtos import GetActivePlanInDTO, GetActivePlanOutDTO


class GetActivePlanUseCase:
    """Use case for retrieving the active plan for a note."""

    def __init__(self, note_repository: NoteRepository, plan_repository: PlanRepository):
        """Initialize the use case with required repositories."""
        self.note_repository = note_repository
        self.plan_repository = plan_repository

    async def execute(self, input_dto: GetActivePlanInDTO) -> GetActivePlanOutDTO:
        """
        Retrieve the active plan for a note.

        Args:
            input_dto: Contains note_id and user_id for the request

        Returns:
            The active plan details if found, None otherwise

        Raises:
            NoteNotFoundError: If the note doesn't exist or isn't owned by the user
        """
        await self._validate_note_exists(
            note_id=input_dto.note_id,
            user_id=input_dto.user_id,
        )

        plan = await self._fetch_active_plan(note_id=input_dto.note_id)

        return self._to_dto(plan)

    async def _validate_note_exists(self, note_id: int, user_id: UUID) -> None:
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

    def _to_dto(self, plan: Plan) -> GetActivePlanOutDTO:
        """Convert a Plan object to a DTO."""
        return GetActivePlanOutDTO(
            id=plan.id,
            note_id=plan.note_id,
            plan_text=plan.plan_text,
            type=plan.type,
            status=plan.status,
            generation_id=plan.generation_id,
            created_at=plan.created_at,
            updated_at=plan.updated_at,
        )
