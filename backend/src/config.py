import secrets
import warnings
from typing import Annotated, Any, Literal, Self

from pydantic import (
    AnyUrl,
    BeforeValidator,
    EmailStr,
    computed_field,
    model_validator,
)
from pydantic_core import MultiHostUrl
from pydantic_settings import BaseSettings, SettingsConfigDict


def parse_cors(v: Any) -> list[str] | str:
    """Parse CORS origins."""
    if isinstance(v, str) and not v.startswith('['):
        return [i.strip() for i in v.split(',')]
    if isinstance(v, list | str):
        return v
    raise ValueError(v)


class Settings(BaseSettings):
    """Settings for the application."""

    model_config = SettingsConfigDict(
        # Use top level .env file (one level above ./backend/)
        env_file='../.env',
        env_ignore_empty=True,
        extra='ignore',
    )
    API_V1_STR: str = '/api/v1'
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ENVIRONMENT: Literal['dev', 'prod'] = 'dev'

    BACKEND_CORS_ORIGINS: Annotated[list[AnyUrl] | str, BeforeValidator(parse_cors)] = []

    @computed_field  # type: ignore[prop-decorator]
    @property
    def all_cors_origins(self) -> list[str]:
        """
        Get all CORS origins.

        This is a list of all origins that are allowed to make CORS requests to the backend.
        It is a combination of the backend CORS origins and the frontend host.
        """
        return [str(origin).rstrip('/') for origin in self.BACKEND_CORS_ORIGINS]  # + [self.FRONTEND_HOST]

    PROJECT_NAME: str = 'vibe-travel'
    POSTGRES_SERVER: str
    POSTGRES_PORT: int
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str

    @computed_field  # type: ignore[prop-decorator]
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> MultiHostUrl:  # noqa: N802
        """Get the SQLAlchemy database URI."""
        return MultiHostUrl.build(
            scheme='postgresql+psycopg',
            username=self.POSTGRES_USER,
            password=self.POSTGRES_PASSWORD,
            host=self.POSTGRES_SERVER,
            port=self.POSTGRES_PORT,
            path=self.POSTGRES_DB,
        )

    EMAIL_TEST_USER: EmailStr = 'test@example.com'
    FIRST_SUPERUSER: EmailStr
    FIRST_SUPERUSER_PASSWORD: str

    def _check_default_secret(self, var_name: str, value: str | None) -> None:
        if value == 'changethis':
            message = (
                f'The value of {var_name} is "changethis", for security, please change it, at least for deployments.'
            )
            if self.ENVIRONMENT == 'dev':
                warnings.warn(message, stacklevel=1)
            else:
                raise ValueError(message)

    @model_validator(mode='after')
    def _enforce_non_default_secrets(self) -> Self:
        self._check_default_secret('SECRET_KEY', self.SECRET_KEY)
        self._check_default_secret('POSTGRES_PASSWORD', self.POSTGRES_PASSWORD)
        self._check_default_secret('FIRST_SUPERUSER_PASSWORD', self.FIRST_SUPERUSER_PASSWORD)

        return self


settings = Settings()  # type: ignore
