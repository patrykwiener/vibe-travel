from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.apps.notes.repositories.note_repository import NoteRepository
from src.apps.notes.usecases.create_note import CreateNoteUseCase
from src.apps.notes.usecases.delete_note import DeleteNoteUseCase
from src.apps.notes.usecases.get_note import GetNoteUseCase
from src.apps.notes.usecases.list_notes import ListNotesUseCase
from src.apps.notes.usecases.update_note import UpdateNoteUseCase
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


async def get_list_notes_use_case(
    note_repository: Annotated[NoteRepository, Depends(get_note_repository)],
) -> AsyncGenerator[ListNotesUseCase, None]:
    """Dependency to get a ListNotesUseCase instance."""
    yield ListNotesUseCase(note_repository)


async def get_get_note_use_case(
    note_repository: Annotated[NoteRepository, Depends(get_note_repository)],
) -> AsyncGenerator[GetNoteUseCase, None]:
    """Dependency to get a GetNoteUseCase instance."""
    yield GetNoteUseCase(note_repository)


async def get_update_note_use_case(
    note_repository: Annotated[NoteRepository, Depends(get_note_repository)],
) -> AsyncGenerator[UpdateNoteUseCase, None]:
    """Dependency to get an UpdateNoteUseCase instance."""
    yield UpdateNoteUseCase(note_repository)


async def get_delete_note_use_case(
    note_repository: Annotated[NoteRepository, Depends(get_note_repository)],
) -> AsyncGenerator[DeleteNoteUseCase, None]:
    """Dependency to get a DeleteNoteUseCase instance."""
    yield DeleteNoteUseCase(note_repository)
