import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.apps.base.models import Base
from src.apps.users.models import User
from src.config import settings

if TYPE_CHECKING:
    from src.apps.plans.models import Plan


class Note(Base):
    """Note model for storing trip planning notes.

    This model stores the user's raw note content for planning a trip,
    including basic information like title, place, dates, and key ideas.
    """

    __tablename__ = 'note'

    id: Mapped[int] = mapped_column(sa.Integer, primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(
        sa.UUID(as_uuid=True),
        sa.ForeignKey('user.id', ondelete='CASCADE'),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(
        sa.String(length=settings.NOTES_TITLE_MAX_LENGTH),
        sa.CheckConstraint(f'length(title) >= {settings.NOTES_TITLE_MIN_LENGTH}'),
        nullable=False,
    )
    place: Mapped[str] = mapped_column(
        sa.String(length=settings.NOTES_PLACE_MAX_LENGTH),
        sa.CheckConstraint(f'length(place) >= {settings.NOTES_PLACE_MIN_LENGTH}'),
        nullable=False,
    )
    date_from: Mapped[date] = mapped_column(sa.Date, nullable=False)
    date_to: Mapped[date] = mapped_column(sa.Date, nullable=False)
    number_of_people: Mapped[int] = mapped_column(
        sa.Integer,
        sa.CheckConstraint(
            f'number_of_people >= {settings.NOTES_MIN_PEOPLE} AND number_of_people <= {settings.NOTES_MAX_PEOPLE}',
        ),
        nullable=False,
    )
    key_ideas: Mapped[str | None] = mapped_column(sa.String(length=settings.NOTES_KEY_IDEAS_MAX_LENGTH), nullable=True)
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
    user: Mapped[User] = relationship('User', backref='notes')
    plans: Mapped[list['Plan']] = relationship('Plan', back_populates='note', cascade='all, delete-orphan')

    # Table constraints
    __table_args__ = (sa.UniqueConstraint('user_id', 'title', name='unique_user_title'),)
