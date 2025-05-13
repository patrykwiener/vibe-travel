"""API endpoints for user management."""

from fastapi import APIRouter

from src.apps.users.auth import auth_backend, fastapi_users
from src.apps.users.schemas.user import UserCreate, UserRead, UserUpdate

router = APIRouter(prefix='/users', tags=['users'])

router.include_router(
    fastapi_users.get_auth_router(auth_backend),
    prefix='/auth/jwt',
)
router.include_router(
    fastapi_users.get_register_router(user_schema=UserRead, user_create_schema=UserCreate),
    prefix='/auth',
)
router.include_router(
    fastapi_users.get_users_router(user_schema=UserRead, user_update_schema=UserUpdate),
    prefix='',
    tags=['users'],
)
