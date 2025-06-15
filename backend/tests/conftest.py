"""Global test fixtures and configuration for pytest.

This module contains shared fixtures used across all tests in the project.
It sets up test database, client, and common utilities for testing.
"""

from collections.abc import AsyncGenerator, Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import Session

from src.apps.notes.models import Note
from src.apps.plans.models import Plan
from src.apps.users.models import User
from src.config import settings
from src.database import init_db, sync_engine
from src.main import app
from tests.utils.user import authentication_token_from_email
from tests.utils.utils import get_superuser_token_headers

# Async engine for testing (same database as sync engine)
sync_url = str(settings.SYNC_SQLALCHEMY_DATABASE_URI)
async_db_url = sync_url.replace('postgresql+psycopg2://', 'postgresql+asyncpg://')
test_async_engine = create_async_engine(async_db_url, echo=True)
test_async_session_maker = async_sessionmaker(test_async_engine, expire_on_commit=False)


@pytest.fixture(scope='session', autouse=True)
def db() -> Generator[Session, None, None]:
    """Create a test database session.

    This fixture creates all tables at the start of the test session,
    yields a database session for tests, and cleans up all data after
    the session ends.
    """
    with Session(sync_engine) as session:
        # Initialize database with any required data
        init_db(session)

        yield session

        # Clean up all test data
        statement = delete(Plan)
        session.execute(statement)
        statement = delete(Note)
        session.execute(statement)
        statement = delete(User)
        session.execute(statement)
        session.commit()


@pytest.fixture
async def async_session() -> AsyncGenerator[AsyncSession, None]:
    """Create an async test database session.

    This fixture provides an async database session for tests that need to test
    async repository methods. Each test gets a fresh session.
    """
    # Create a new engine and session for each test to avoid connection conflicts
    from sqlalchemy.pool import NullPool

    engine = create_async_engine(async_db_url, poolclass=NullPool)  # No connection pooling
    session_maker = async_sessionmaker(engine, expire_on_commit=False)

    async with session_maker() as session:
        try:
            yield session
        finally:
            statement = delete(Plan)
            await session.execute(statement)
            statement = delete(Note)
            await session.execute(statement)
            statement = delete(User)
            await session.execute(statement)
            await session.commit()
            await session.close()
            await engine.dispose()  # Clean up engine


@pytest.fixture(scope='module')
def client() -> Generator[TestClient, None, None]:
    """Create a test client for the FastAPI application.

    This fixture provides a TestClient instance that can be used to
    make HTTP requests to the application during testing.
    """
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope='module')
def superuser_token_headers(client: TestClient) -> dict[str, str]:
    """Get authentication headers for a superuser.

    This fixture provides authentication headers that can be used
    to make authenticated requests as a superuser.
    """
    return get_superuser_token_headers(client)


@pytest.fixture(scope='module')
def normal_user_token_headers(client: TestClient, db: Session) -> dict[str, str]:
    """Get authentication headers for a normal user.

    This fixture provides authentication headers that can be used
    to make authenticated requests as a normal test user.
    """
    return authentication_token_from_email(client=client, email=settings.EMAIL_TEST_USER, db=db)
