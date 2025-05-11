from fastapi import APIRouter

from src.apps.users.api import router as users_router
from src.apps.utils.api import router as utils_router

api_router = APIRouter()

api_router.include_router(utils_router)
api_router.include_router(users_router)
