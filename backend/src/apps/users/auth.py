import uuid

from fastapi_users import FastAPIUsers, models
from fastapi_users.authentication import (
    AuthenticationBackend,
    CookieTransport,
    JWTStrategy,
)

from src.apps.users.managers import get_user_manager
from src.apps.users.models import User
from src.config import settings

cookie_transport = CookieTransport(
    cookie_name=settings.JWT_COOKIE_NAME,
    cookie_max_age=settings.JWT_COOKIE_MAX_AGE,
    cookie_path=settings.JWT_COOKIE_PATH,
    cookie_domain=settings.JWT_COOKIE_DOMAIN,
    cookie_secure=settings.JWT_COOKIE_SECURE,
    cookie_httponly=settings.JWT_COOKIE_HTTPONLY,
    cookie_samesite=settings.JWT_COOKIE_SAMESITE,
)


def get_jwt_strategy() -> JWTStrategy[models.UP, models.ID]:
    """Get the JWT strategy for authentication."""
    return JWTStrategy(secret=settings.JWT_SECRET_KEY, lifetime_seconds=settings.JWT_LIFETIME_SECONDS)


auth_backend: AuthenticationBackend = AuthenticationBackend(
    name='jwt',
    transport=cookie_transport,
    get_strategy=get_jwt_strategy,
)


fastapi_users = FastAPIUsers[User, uuid.UUID](get_user_manager, [auth_backend])

current_active_user = fastapi_users.current_user(active=True)
