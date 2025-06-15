"""Test database pre-start module.

This module ensures the test database is ready before running tests.
It includes retry logic to wait for the database to be available and
performs basic connectivity checks.
"""

import logging

from sqlalchemy import Engine
from sqlalchemy.orm import Session
from sqlalchemy.sql import text
from tenacity import after_log, before_log, retry, stop_after_attempt, wait_fixed

from src.database import sync_engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

max_tries = 60 * 5  # 5 minutes
wait_seconds = 1


@retry(
    stop=stop_after_attempt(max_tries),
    wait=wait_fixed(wait_seconds),
    before=before_log(logger, logging.INFO),
    after=after_log(logger, logging.WARNING),
)
def init(db_engine: Engine) -> None:
    """Initialize database connection and check if DB is awake.

    Args:
        db_engine: The database engine to test

    Raises:
        Exception: If database connection cannot be established
    """
    try:
        # Try to create session to check if DB is awake
        with Session(db_engine) as session:
            session.execute(text('SELECT 1'))
    except Exception as e:
        logger.error('Database connection failed: %s', e)
        raise e


def main() -> None:
    """Main function to initialize database for testing."""
    logger.info('Initializing test database connection')
    init(sync_engine)
    logger.info('Test database connection initialized successfully')


if __name__ == '__main__':
    main()
