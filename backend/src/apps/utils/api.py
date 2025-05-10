from fastapi import APIRouter
from fastapi_utils.cbv import cbv

router = APIRouter(prefix='/utils', tags=['utils'])


@cbv(router)
class UtilsView:
    """Utility endpoints for the application."""

    @router.get('/health-check')
    async def health_check(self) -> bool:
        """Health check endpoint for Docker."""
        return True
