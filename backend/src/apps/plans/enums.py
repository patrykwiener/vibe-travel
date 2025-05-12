"""Enums used for plan-related functionality."""

import enum


class PlanTypeEnum(str, enum.Enum):
    """Type of travel plan."""

    AI = 'AI'
    MANUAL = 'MANUAL'
    HYBRID = 'HYBRID'


class PlanStatusEnum(str, enum.Enum):
    """Status of a travel plan."""

    PENDING_AI = 'PENDING_AI'
    ACTIVE = 'ACTIVE'
    ARCHIVED = 'ARCHIVED'
