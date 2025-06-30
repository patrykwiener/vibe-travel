import sys
from pathlib import Path
from typing import Any

from loguru import logger

from src.config import settings


def setup_logging() -> None:
    """
    Configure loguru logging for the application.

    This function sets up:
    - Console logging with colored output for development
    - File logging with rotation and retention (only if enabled in settings)
    - JSON formatting for production environments
    - Different log levels based on environment
    """
    # Remove default handler
    logger.remove()

    # Console handler configuration
    console_config = _get_console_config()
    logger.add(sys.stdout, **console_config)

    # Only attempt file logging if enabled via configuration
    if settings.LOG_FILE_ENABLED:
        log_file_path = Path(settings.LOG_FILE_PATH)
        log_file_path.parent.mkdir(parents=True, exist_ok=True)

        # File handler configuration
        file_config = _get_file_config()
        logger.add(str(log_file_path), **file_config)

        # Add error file handler for better error tracking
        error_file_config = _get_error_file_config()
        logger.add(str(log_file_path.parent / 'errors.log'), **error_file_config)

        logger.info(
            'Logging configuration completed with file logging.',
            log_file_path=str(log_file_path),
            environment=settings.ENVIRONMENT,
            log_level=settings.LOG_LEVEL,
        )
    else:
        logger.info(
            'File logging disabled via configuration. Using console logging only.',
            environment=settings.ENVIRONMENT,
            log_level=settings.LOG_LEVEL,
        )


def _get_console_config() -> dict[str, Any]:
    """Get console logging configuration."""
    return {
        'format': settings.LOG_FORMAT,
        'level': settings.LOG_LEVEL,
        'colorize': True,
        'diagnose': settings.ENVIRONMENT == 'dev',
        'backtrace': settings.ENVIRONMENT == 'dev',
    }


def _get_file_config() -> dict[str, Any]:
    """Get file logging configuration."""
    return {
        'format': settings.LOG_FORMAT,
        'level': settings.LOG_LEVEL,
        'rotation': settings.LOG_ROTATION,
        'retention': settings.LOG_RETENTION,
        'compression': 'gz',
        'serialize': settings.LOG_SERIALIZE,
        'diagnose': True,
        'backtrace': True,
        'enqueue': True,  # Thread-safe logging
    }


def _get_error_file_config() -> dict[str, Any]:
    """Get error file logging configuration."""
    return {
        'format': settings.LOG_FORMAT,
        'level': 'ERROR',
        'rotation': settings.LOG_ROTATION,
        'retention': settings.LOG_RETENTION,
        'compression': 'gz',
        'serialize': settings.LOG_SERIALIZE,
        'diagnose': True,
        'backtrace': True,
        'enqueue': True,
    }
