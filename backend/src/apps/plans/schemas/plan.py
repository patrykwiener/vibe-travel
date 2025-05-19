"""Pydantic schemas for plans related functionality."""

from datetime import datetime
from typing import Self
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

from src.apps.plans.enums import PlanStatusEnum, PlanTypeEnum
from src.config import settings


class PlanGenerateOutSchema(BaseModel):
    """Schema for AI plan generation response.

    This schema is used as output for the POST /notes/{note_id}/plan/generate endpoint.
    """

    generation_id: UUID = Field(
        ...,
        description='Unique ID for this AI generation attempt',
    )
    plan_text: str = Field(
        ...,
        description='AI-generated plan text',
    )
    status: PlanStatusEnum = Field(
        PlanStatusEnum.PENDING_AI,
        description='Status of the plan (always PENDING_AI for generation)',
    )

    model_config = ConfigDict(
        json_schema_extra={
            'example': {
                'generation_id': '550e8400-e29b-41d4-a716-446655440000',
                'plan_text': 'Day 1: Morning - Eiffel Tower...',
                'status': 'PENDING_AI',
            }
        }
    )


class PlanCreateInSchema(BaseModel):
    """Schema for creating or accepting a plan.

    This schema is used as input for the POST /notes/{note_id}/plan endpoint.
    It supports three scenarios:
    1. Accept AI plan: Only generation_id is provided
    2. Hybrid plan: Both generation_id and plan_text are provided
    3. Manual plan: Only plan_text is provided
    """

    generation_id: UUID | None = Field(
        None,
        description='ID of the AI generated plan to accept',
    )
    plan_text: str | None = Field(
        None,
        description='Plan text for manual or hybrid plans',
        max_length=settings.PLANS_TEXT_MAX_LENGTH,
    )

    @model_validator(mode='after')
    def validate_at_least_one_field(self) -> Self:
        """Validate that at least one of generation_id or plan_text is provided."""
        if not self.generation_id and not self.plan_text:
            raise ValueError('At least one of generation_id or plan_text must be provided')
        return self

    model_config = ConfigDict(
        json_schema_extra={
            'example': {
                'generation_id': '550e8400-e29b-41d4-a716-446655440000',
                'plan_text': 'Day 1: Morning - Eiffel Tower...',
            }
        }
    )


class PlanUpdateInSchema(BaseModel):
    """Schema for updating an existing plan.

    This schema is used as input for the PUT /notes/{note_id}/plan endpoint.
    """

    plan_text: str = Field(
        ...,
        description='Updated plan text',
        max_length=settings.PLANS_TEXT_MAX_LENGTH,
    )

    model_config = ConfigDict(
        json_schema_extra={
            'example': {
                'plan_text': 'Updated plan text: Day 1: Morning - Visit the Louvre...',
            }
        }
    )


class PlanOutSchema(BaseModel):
    """Schema for plan responses.

    This schema is used as output for the GET /notes/{note_id}/plan,
    POST /notes/{note_id}/plan, and PUT /notes/{note_id}/plan endpoints.
    """

    plan_id: int = Field(
        ...,
        description="Plan's unique identifier",
        alias='id',
    )
    note_id: int = Field(
        ...,
        description='ID of the note this plan belongs to',
    )
    plan_text: str = Field(
        ...,
        description='The detailed text of the travel plan',
    )
    plan_type: PlanTypeEnum = Field(
        ...,
        description='Type of the plan (AI, MANUAL, HYBRID)',
        alias='type',
    )
    plan_status: PlanStatusEnum = Field(
        ...,
        description='Status of the plan (PENDING_AI, ACTIVE, ARCHIVED)',
        alias='status',
    )
    generation_id: UUID = Field(
        ...,
        description='Unique ID for the AI generation',
    )
    created_at: datetime = Field(
        ...,
        description='Timestamp of plan creation',
    )
    updated_at: datetime = Field(
        ...,
        description='Timestamp of last plan update',
    )

    model_config = ConfigDict(
        from_attributes=True,
        validate_by_name=True,
        json_schema_extra={
            'example': {
                'plan_id': 456,
                'note_id': 123,
                'plan_text': 'Day 1: Morning - Eiffel Tower...',
                'plan_type': 'AI',
                'plan_status': 'ACTIVE',
                'generation_id': '550e8400-e29b-41d4-a716-446655440000',
                'created_at': '2025-05-11T11:00:00Z',
                'updated_at': '2025-05-11T11:05:00Z',
            }
        },
    )
