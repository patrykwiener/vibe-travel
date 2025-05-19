from abc import ABC, abstractmethod
from uuid import UUID

from src.apps.plans.enums import PlanStatusEnum
from src.apps.plans.models.plan import Plan
from src.apps.plans.repositories.plan_repository import PlanRepository


class PlanStrategy(ABC):
    """Abstract base strategy for plan creation/acceptance."""

    def __init__(
        self,
        plan_repository: PlanRepository,
    ):
        self.plan_repository = plan_repository

    @abstractmethod
    async def execute(self, note_id: int, **kwargs) -> Plan:
        """Execute the strategy."""
        raise NotImplementedError


class AcceptAIPlanStrategy(PlanStrategy):
    """Strategy for accepting an AI plan."""

    async def execute(self, note_id: int, generation_id: UUID, **kwargs) -> Plan:  # type: ignore[override]
        """Accept an AI-generated plan."""
        plan = await self.plan_repository.get_by_generation_id_and_note_id_and_status(
            generation_id=generation_id,
            note_id=note_id,
            status=PlanStatusEnum.PENDING_AI,
            for_update=True,
        )
        plan.accept_ai_proposal()
        return await self.plan_repository.update_plan(plan)


class CreateHybridPlanStrategy(PlanStrategy):
    """Strategy for creating a hybrid plan."""

    async def execute(self, note_id: int, generation_id: UUID, plan_text: str, **kwargs) -> Plan:  # type: ignore[override]
        """Create a hybrid plan by modifying an AI-generated plan."""
        plan = await self.plan_repository.get_by_generation_id_and_note_id_and_status(
            generation_id=generation_id,
            note_id=note_id,
            status=PlanStatusEnum.PENDING_AI,
            for_update=True,
        )

        plan.convert_to_hybrid(new_plan_text=plan_text)
        return await self.plan_repository.update_plan(plan)


class CreateManualPlanStrategy(PlanStrategy):
    """Strategy for creating a manual plan."""

    async def execute(self, note_id: int, plan_text: str, **kwargs) -> Plan:  # type: ignore[override]
        """Create a manual plan."""
        return await self.plan_repository.create(
            plan=Plan.create_manual(
                note_id=note_id,
                plan_text=plan_text,
            ),
        )
