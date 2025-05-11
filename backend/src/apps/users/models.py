import uuid
from datetime import datetime

import sqlalchemy as sa
from fastapi_users.db import SQLAlchemyBaseUserTableUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.apps.base.models import Base
from src.apps.users.enums import UserBudgetEnum, UserTravelPaceEnum, UserTravelStyleEnum


class User(SQLAlchemyBaseUserTableUUID, Base):
    """User model for the application.

    This model is used to store user information in the database.
    It inherits from SQLAlchemyBaseUserTableUUID, which provides
    the basic user table functionality.
    """

    # Relationships
    profile: Mapped['UserProfile'] = relationship(
        'UserProfile', back_populates='user', uselist=False, cascade='all, delete-orphan'
    )


class UserProfile(Base):
    """User profile model storing travel preferences.

    This model extends the base User model with travel-specific preferences
    such as travel style, pace, and budget.
    """

    __tablename__ = 'user_profile'

    id: Mapped[int] = mapped_column(sa.Integer, primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(
        sa.UUID(as_uuid=True), sa.ForeignKey('user.id', ondelete='CASCADE'), default=uuid.uuid4, nullable=False
    )
    travel_style: Mapped[UserTravelStyleEnum | None] = mapped_column(
        sa.Enum(UserTravelStyleEnum, name='user_travel_style_enum'), nullable=True
    )
    preferred_pace: Mapped[UserTravelPaceEnum | None] = mapped_column(
        sa.Enum(UserTravelPaceEnum, name='user_travel_pace_enum'), nullable=True
    )
    budget: Mapped[UserBudgetEnum | None] = mapped_column(
        sa.Enum(UserBudgetEnum, name='user_budget_enum'), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')
    )
    updated_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()'), onupdate=sa.text('now()')
    )

    # Relationships
    user: Mapped[User] = relationship('User', back_populates='profile')
