import uuid
from datetime import datetime
from typing import TYPE_CHECKING

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
