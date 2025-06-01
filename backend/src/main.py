from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.routing import APIRoute
from fastapi_pagination import add_pagination

from src.config import settings
from src.routes import api_router


def custom_generate_unique_id(route: APIRoute) -> str:
    """
    Generate a unique ID for each route based on its tags and name.

    This is used to create unique operation IDs for the OpenAPI schema.
    """
    return f'{route.tags[0]}-{route.name}'


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f'{settings.API_V1_STR}/openapi.json',
    docs_url=f'{settings.API_V1_STR}/docs',
    redoc_url=f'{settings.API_V1_STR}/redoc',
    generate_unique_id_function=custom_generate_unique_id,
)
add_pagination(app)

# Set all CORS enabled origins
if settings.all_cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.all_cors_origins,
        allow_credentials=True,
        allow_methods=['*'],
        allow_headers=['*'],
    )

# Include routers
app.include_router(api_router, prefix=settings.API_V1_STR)
