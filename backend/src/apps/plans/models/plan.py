import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Self

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.apps.common.models import Base
from src.apps.plans.enums import PlanStatusEnum, PlanTypeEnum
from src.config import settings

if TYPE_CHECKING:
    from src.apps.notes.models.note import Note  # pragma: no cover


class Plan(Base):
    """Plan model for storing travel plans.

    This model stores the detailed travel plans generated from notes,
    either by AI, manually, or through a hybrid approach.
    """

    __tablename__ = 'plan'

    id: Mapped[int] = mapped_column(sa.Integer, primary_key=True)
    note_id: Mapped[int] = mapped_column(
        sa.Integer,
        sa.ForeignKey('note.id', ondelete='CASCADE'),
        nullable=False,
    )
    plan_text: Mapped[str] = mapped_column(
        sa.String(length=settings.PLANS_TEXT_MAX_LENGTH),
        nullable=False,
    )
    type: Mapped[PlanTypeEnum] = mapped_column(
        sa.Enum(PlanTypeEnum, name='plan_type_enum'),
        nullable=False,
    )
    status: Mapped[PlanStatusEnum] = mapped_column(
        sa.Enum(PlanStatusEnum, name='plan_status_enum'),
        nullable=False,
    )
    generation_id: Mapped[uuid.UUID] = mapped_column(
        sa.UUID(as_uuid=True),
        default=uuid.uuid4,
        nullable=False,
        unique=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True),
        nullable=False,
        server_default=sa.text('now()'),
    )
    updated_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True),
        nullable=False,
        server_default=sa.text('now()'),
        onupdate=sa.text('now()'),
    )

    # Relationships
    note: Mapped['Note'] = relationship(back_populates='plans')

    def accept_ai_proposal(self) -> None:
        """
        Accept a pending AI plan.

        Raises:
            ValueError: If plan is not in PENDING_AI status
        """
        if self.status != PlanStatusEnum.PENDING_AI:
            raise ValueError(f'Cannot accept plan with status {self.status}')

        self.status = PlanStatusEnum.ACTIVE

    def accept_ai_proposal_as_hybrid(self, new_plan_text: str) -> None:
        """
        Accept a pending AI plan and convert it to a hybrid plan.

        Args:
            new_plan_text: The new plan text provided by the user

        Raises:
            ValueError: If plan is not in PENDING_AI status
        """
        if self.status != PlanStatusEnum.PENDING_AI:
            raise ValueError(f'Cannot accept plan with status {self.status} to hybrid')

        self.plan_text = new_plan_text
        self.type = PlanTypeEnum.HYBRID
        self.status = PlanStatusEnum.ACTIVE

    def update(self, new_plan_text: str) -> None:
        """
        Update an existing plan.

        Args:
            new_plan_text: The new plan text provided by the user
        """
        if self.status != PlanStatusEnum.ACTIVE:
            raise ValueError(f'Cannot update plan with status {self.status}')

        self.plan_text = new_plan_text
        if self.type == PlanTypeEnum.AI:
            self.type = PlanTypeEnum.HYBRID

    @classmethod
    def create_manual(cls, note_id: int, plan_text: str) -> Self:
        """
        Create a new manual plan.

        Args:
            note_id: ID of the note this plan is for
            plan_text: The content of the plan

        Returns:
            A new Plan instance (not yet persisted)
        """
        return cls(
            note_id=note_id,
            plan_text=plan_text,
            status=PlanStatusEnum.ACTIVE,
            type=PlanTypeEnum.MANUAL,
        )

    @classmethod
    def create_ai(cls, note_id: int, plan_text: str) -> Self:
        """
        Create a new AI-generated plan.

        Args:
            note_id: ID of the note this plan is for
            plan_text: The content of the plan

        Returns:
            A new Plan instance (not yet persisted)
        """
        return cls(
            note_id=note_id,
            plan_text=plan_text,
            status=PlanStatusEnum.PENDING_AI,
            type=PlanTypeEnum.AI,
        )
