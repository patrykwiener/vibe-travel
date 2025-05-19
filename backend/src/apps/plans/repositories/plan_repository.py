from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.apps.plans.enums import PlanStatusEnum
from src.apps.plans.exceptions import PlanNotFoundError
from src.apps.plans.models.plan import Plan


class PlanRepository:
    """Repository for plan operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, plan: Plan) -> Plan:
        """
        Create a new plan.

        Args:
            plan: The plan object to create

        Returns:
            The ID of the newly created plan
        """
        self.session.add(plan)
        await self.session.commit()
        await self.session.refresh(plan)
        return plan

    async def update_plan(self, plan: Plan) -> Plan:
        """
        Update a plan in the database.

        Args:
            plan: The plan object to update

        Returns:
            The updated plan
        """
        await self.session.commit()
        await self.session.refresh(plan)
        return plan

    async def get_by_generation_id_and_note_id_and_status(
        self,
        generation_id: UUID,
        note_id: int,
        status: PlanStatusEnum,
        for_update: bool = False,
    ) -> Plan:
        """
        Get a plan by its generation ID, note ID, and status.

        Args:
            generation_id: The UUID of the generated plan
            note_id: The note ID the plan belongs to
            status: The status of the plan
            for_update: Whether to lock the row for update

        Returns:
            The plan if found

        Raises:
            PlanNotFoundError: If no plan matches the criteria
        """
        query = select(Plan).where(
            Plan.generation_id == generation_id,
            Plan.note_id == note_id,
            Plan.status == status,
        )

        if for_update:
            query = query.with_for_update()

        result = await self.session.execute(query)
        plan = result.scalar_one_or_none()

        if plan is None:
            raise PlanNotFoundError(generation_id=generation_id, note_id=note_id)

        return plan

    async def get_last_updated_by_note_id_and_status(self, note_id: int, status: PlanStatusEnum) -> Plan | None:
        """Get the last plan by note ID and status."""
        query = (
            select(Plan)
            .where(
                Plan.note_id == note_id,
                Plan.status == status,
            )
            .order_by(Plan.updated_at.desc())
            .limit(1)
        )

        result = await self.session.execute(query)
        return result.scalar_one_or_none()
