import uuid

from fastapi_users import schemas


class UserRead(schemas.BaseUser[uuid.UUID]):
    """User read schema."""


class UserCreate(schemas.BaseUserCreate):
    """User create schema."""


class UserUpdate(schemas.BaseUserUpdate):
    """User update schema."""
