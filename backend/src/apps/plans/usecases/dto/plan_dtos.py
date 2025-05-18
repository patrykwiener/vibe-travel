from uuid import UUID

from pydantic import BaseModel

from src.apps.plans.enums import PlanStatusEnum


class GeneratePlanInDTO(BaseModel):
    """Input DTO for plan generation use case."""

    note_id: int
    user_id: UUID


class GeneratePlanOutDTO(BaseModel):
    """Output DTO for plan generation use case."""

    generation_id: UUID
    plan_text: str
    status: PlanStatusEnum = PlanStatusEnum.PENDING_AI
