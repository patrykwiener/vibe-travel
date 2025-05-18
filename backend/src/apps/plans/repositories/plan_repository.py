from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from src.apps.plans.enums import PlanStatusEnum, PlanTypeEnum
from src.apps.plans.models.plan import Plan


class PlanRepository:
    """Repository for plan operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_plan_proposal(
        self,
        note_id: int,
        plan_text: str,
        status: str = PlanStatusEnum.PENDING_AI,
        plan_type: str = PlanTypeEnum.AI,
    ) -> Plan:
        """
        Create a new plan proposal.

        Args:
            note_id: ID of the note this plan is for
            plan_text: The content of the plan
            status: Status of the plan (default: 'PENDING_AI')
            plan_type: Type of the plan (default: 'AI')

        Returns:
            The ID of the newly created plan
        """
        plan = Plan(
            plan_text=plan_text,
            status=status,
            type=plan_type,
            generation_id=uuid4(),
            note_id=note_id,
        )
        self.session.add(plan)
        await self.session.commit()
        await self.session.refresh(plan)
        return plan
