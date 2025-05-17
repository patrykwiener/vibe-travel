"""API endpoints for notes."""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi_utils.cbv import cbv

from src.apps.notes.dependencies import get_create_note_use_case
from src.apps.notes.exceptions import NoteTitleConflictError
from src.apps.notes.schemas.note import NoteCreateInSchema, NoteOutSchema
from src.apps.notes.usecases.create_note import CreateNoteUseCase
from src.apps.notes.usecases.dto.create_note import CreateNoteDTO
from src.apps.users.auth import current_active_user
from src.apps.users.models.user import User

notes_router = APIRouter(prefix='/notes', tags=['notes'])


@cbv(notes_router)
class NoteCBV:
    current_user: User = Depends(current_active_user)
    create_note_use_case: CreateNoteUseCase = Depends(get_create_note_use_case)

    @notes_router.post(
        '/',
        response_model=NoteOutSchema,
        status_code=status.HTTP_201_CREATED,
        summary='Create a new note',
        description='Allows authenticated users to create a new travel note.',
    )
    async def create_note(
        self,
        note_in: NoteCreateInSchema,
    ) -> NoteOutSchema:
        """Create a new note for the authenticated user."""
        create_note_dto = CreateNoteDTO(
            user_id=self.current_user.id,
            title=note_in.title,
            place=note_in.place,
            date_from=note_in.date_from,
            date_to=note_in.date_to,
            number_of_people=note_in.number_of_people,
            key_ideas=note_in.key_ideas,
        )
        try:
            note = await self.create_note_use_case.execute(create_note_dto)
        except NoteTitleConflictError as e:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e)) from e
        return NoteOutSchema.model_validate(note)
