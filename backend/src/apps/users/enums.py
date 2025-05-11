"""Enums used for user-related functionality."""

import enum


class UserTravelStyleEnum(str, enum.Enum):
    """User's preferred travel style."""

    RELAX = 'RELAX'
    ADVENTURE = 'ADVENTURE'
    CULTURE = 'CULTURE'
    PARTY = 'PARTY'


class UserTravelPaceEnum(str, enum.Enum):
    """User's preferred travel pace."""

    CALM = 'CALM'
    MODERATE = 'MODERATE'
    INTENSE = 'INTENSE'


class UserBudgetEnum(str, enum.Enum):
    """User's preferred budget level."""

    LOW = 'LOW'
    MEDIUM = 'MEDIUM'
    HIGH = 'HIGH'
