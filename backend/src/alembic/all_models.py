"""
Module to import all models for Alembic migrations.

This file centralizes all model imports to ensure that Alembic
can discover all models during migration operations.
"""

from src.apps.common.models import Base
from src.apps.notes.models import Note
from src.apps.plans.models import Plan
from src.apps.users.models import User, UserProfile
