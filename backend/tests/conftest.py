"""Global test fixtures and configuration for pytest.

This module contains shared fixtures used across all tests in the project.
It sets up test database, client, and common utilities for testing.
"""

import asyncio
import os
from collections.abc import AsyncGenerator, Generator
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient
from httpx import AsyncClient
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from src.apps.common.models import Base
from src.database import get_async_session
from src.main import app

# Test database configuration
TEST_DATABASE_URL = 'sqlite:///./test.db'
TEST_ASYNC_DATABASE_URL = 'sqlite+aiosqlite:///./test.db'


@pytest.fixture(scope='session')
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create an instance of the default event loop for the test session.

    This fixture ensures that async tests run properly and share the same
    event loop throughout the test session.
    """
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope='session')
def test_engine():
    """Create a test database engine for synchronous operations.

    Uses SQLite in-memory database for fast testing. The engine is configured
    with StaticPool to ensure the same connection is reused across tests.
    """
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={'check_same_thread': False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope='session')
def test_async_engine():
    """Create a test database engine for asynchronous operations.

    Uses SQLite with aiosqlite driver for async database operations.
    The engine is configured for testing with proper connection pooling.
    """
    return create_async_engine(
        TEST_ASYNC_DATABASE_URL,
        connect_args={'check_same_thread': False},
        poolclass=StaticPool,
    )


@pytest.fixture(scope='session')
async def setup_test_db(test_async_engine):
    """Set up the test database schema.

    Creates all tables in the test database before tests run and
    cleans up after all tests are complete.
    """
    async with test_async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
def db_session(test_engine) -> Generator[Session, None, None]:
    """Create a test database session for synchronous operations.

    This fixture provides a clean database session for each test.
    The session is rolled back after each test to ensure test isolation.
    """
    connection = test_engine.connect()
    transaction = connection.begin()
    session = sessionmaker(bind=connection)(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
async def async_db_session(test_async_engine, setup_test_db) -> AsyncGenerator[AsyncSession, None]:
    """Create a test database session for asynchronous operations.

    This fixture provides a clean async database session for each test.
    The session is rolled back after each test to ensure test isolation.
    """
    async with test_async_engine.connect() as connection, connection.begin() as transaction:
        session_factory = async_sessionmaker(
            bind=connection,
            class_=AsyncSession,
            expire_on_commit=False,
        )
        async with session_factory() as session:
            yield session
            await transaction.rollback()


@pytest.fixture
def test_client(db_session) -> Generator[TestClient, None, None]:
    """Create a test client for synchronous API testing.

    This fixture provides a TestClient instance that uses the test database
    session. It overrides the database dependency to use the test session.
    Note: Since the app uses async sessions, this creates a sync session
    for compatibility with TestClient.
    """
    with TestClient(app) as client:
        yield client


@pytest.fixture
async def async_test_client(async_db_session) -> AsyncGenerator[AsyncClient, None]:
    """Create an async test client for asynchronous API testing.

    This fixture provides an AsyncClient instance that uses the test database
    session. It overrides the async database dependency to use the test session.
    """

    async def override_get_async_session():
        yield async_db_session

    app.dependency_overrides[get_async_session] = override_get_async_session

    async with AsyncClient(app=app, base_url='http://test') as client:
        yield client

    app.dependency_overrides.clear()


@pytest.fixture
def mock_settings():
    """Create mock settings for testing.

    This fixture provides a mock of the application settings that can be
    used to test configuration-dependent behavior without affecting the
    actual application configuration.
    """
    settings = MagicMock()
    settings.database_url = TEST_DATABASE_URL
    settings.secret_key = os.environ.get('TEST_SECRET_KEY', 'test-secret-key')
    settings.environment = 'test'
    settings.debug = True
    return settings


@pytest.fixture
def mock_async_service():
    """Create a mock async service for testing.

    This fixture provides a generic AsyncMock that can be used to mock
    any asynchronous service dependencies in tests.
    """
    return AsyncMock()


@pytest.fixture
def mock_sync_service():
    """Create a mock synchronous service for testing.

    This fixture provides a generic MagicMock that can be used to mock
    any synchronous service dependencies in tests.
    """
    return MagicMock()
