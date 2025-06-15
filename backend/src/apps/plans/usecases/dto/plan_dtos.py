from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from src.apps.plans.enums import PlanStatusEnum, PlanTypeEnum


class GeneratePlanInDTO(BaseModel):
    """Input DTO for plan generation use case."""

    note_id: int
    user_id: UUID


class GeneratePlanOutDTO(BaseModel):
    """Output DTO for plan generation use case."""

    generation_id: UUID
    plan_text: str
    status: PlanStatusEnum = PlanStatusEnum.PENDING_AI


class PlanCreateInDTO(BaseModel):
    """DTO for plan creation input."""

    note_id: int
    user_id: UUID
    generation_id: UUID | None = None
    plan_text: str | None = None


class PlanCreateOutDTO(BaseModel):
    """DTO for plan creation output."""

    id: int
    note_id: int
    plan_text: str
    type: PlanTypeEnum
    status: PlanStatusEnum
    generation_id: UUID
    created_at: datetime
    updated_at: datetime


class GetActivePlanInDTO(BaseModel):
    """Input DTO for retrieving an active plan."""

    note_id: int
    user_id: UUID


class GetActivePlanOutDTO(BaseModel):
    """Output DTO for retrieving an active plan."""

    id: int
    note_id: int
    plan_text: str
    type: PlanTypeEnum
    status: PlanStatusEnum
    generation_id: UUID
    created_at: datetime
    updated_at: datetime


class UpdatePlanInDTO(BaseModel):
    """Input DTO for updating an active plan."""

    note_id: int
    user_id: UUID
    plan_text: str


class UpdatePlanOutDTO(BaseModel):
    """Output DTO for updating an active plan."""

    id: int
    note_id: int
    plan_text: str
    type: PlanTypeEnum
    status: PlanStatusEnum
    generation_id: UUID | None
    created_at: datetime
    updated_at: datetime
