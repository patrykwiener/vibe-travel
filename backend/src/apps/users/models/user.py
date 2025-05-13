from typing import TYPE_CHECKING

from fastapi_users.db import SQLAlchemyBaseUserTableUUID
from sqlalchemy.orm import Mapped, relationship

from src.apps.common.models import Base

if TYPE_CHECKING:
    from src.apps.users.models.profile import UserProfile


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
