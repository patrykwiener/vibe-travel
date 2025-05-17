from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.apps.notes.repositories.note import NoteRepository
from src.apps.notes.usecases.create_note import CreateNoteUseCase
from src.database import get_async_session


async def get_note_repository(
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> AsyncGenerator[NoteRepository, None]:
    """Dependency to get a NoteRepository instance."""
    yield NoteRepository(session)


async def get_create_note_use_case(
    note_repository: Annotated[NoteRepository, Depends(get_note_repository)],
) -> AsyncGenerator[CreateNoteUseCase, None]:
    """Dependency to get a CreateNoteUseCase instance."""
    yield CreateNoteUseCase(note_repository)
