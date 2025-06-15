from collections.abc import AsyncGenerator

from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import Session, sessionmaker

from src.config import settings

# Async engine for production use
engine = create_async_engine(str(settings.SQLALCHEMY_DATABASE_URI), echo=True)
async_session_maker = async_sessionmaker(engine, expire_on_commit=False)

# Sync engine for testing
sync_engine = create_engine(str(settings.SYNC_SQLALCHEMY_DATABASE_URI), echo=True)
sync_session_maker = sessionmaker(bind=sync_engine)


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency that provides an asynchronous database session."""
    async with async_session_maker() as session:
        yield session


def init_db(session: Session) -> None:
    """Initialize the database with initial data."""
    # Import all models to ensure they are registered with SQLAlchemy before creating all
    from src.apps.common.models import Base
    from src.apps.notes.models import Note  # noqa: F401
    from src.apps.plans.models import Plan  # noqa: F401
    from src.apps.users.models import User, UserProfile  # noqa: F401

    # Create all tables if they don't exist
    if session.bind is not None:
        Base.metadata.create_all(bind=session.bind)

    # Add any initial data here if needed
    # For example, create a test superuser
    # This function can be expanded as needed
