from fastapi import APIRouter

from src.apps.notes.api import notes_router
from src.apps.users.api import profile_router, user_router
from src.apps.utils.api import router as utils_router

api_router = APIRouter()

api_router.include_router(notes_router)
api_router.include_router(user_router)
api_router.include_router(profile_router)
api_router.include_router(utils_router)
