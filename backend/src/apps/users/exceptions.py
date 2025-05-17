"""Custom exceptions for the users app."""


class BaseUserError(Exception):
    """Base class for all user-related exceptions."""


class ProfileNotFoundError(BaseUserError):
    """Raised when a user profile is not found."""
