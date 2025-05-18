"""API endpoints for notes."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from fastapi_pagination import LimitOffsetPage, LimitOffsetParams, paginate
from fastapi_utils.cbv import cbv

from src.apps.notes.dependencies import (
    get_create_note_use_case,
    get_delete_note_use_case,
    get_get_note_use_case,
    get_list_notes_use_case,
    get_update_note_use_case,
)
from src.apps.notes.exceptions import NoteNotFoundError, NoteTitleConflictError
from src.apps.notes.schemas.note import (
    NoteCreateInSchema,
    NoteListItemOutSchema,
    NoteOutSchema,
    NoteUpdateInSchema,
)
from src.apps.notes.usecases.create_note import CreateNoteUseCase
from src.apps.notes.usecases.delete_note import DeleteNoteUseCase
from src.apps.notes.usecases.dto.create_note import CreateNoteDTO
from src.apps.notes.usecases.dto.delete_note import DeleteNoteInDTO
from src.apps.notes.usecases.dto.get_note import GetNoteInDTO
from src.apps.notes.usecases.dto.list_notes import ListNotesInDTO
from src.apps.notes.usecases.dto.update_note import UpdateNoteInDTO
from src.apps.notes.usecases.get_note import GetNoteUseCase
from src.apps.notes.usecases.list_notes import ListNotesUseCase
from src.apps.notes.usecases.update_note import UpdateNoteUseCase
from src.apps.users.auth import current_active_user
from src.apps.users.models.user import User

notes_router = APIRouter(prefix='/notes', tags=['notes'])


@cbv(notes_router)
class NoteCBV:
    current_user: User = Depends(current_active_user)
    create_note_use_case: CreateNoteUseCase = Depends(get_create_note_use_case)
    list_notes_use_case: ListNotesUseCase = Depends(get_list_notes_use_case)
    get_note_use_case: GetNoteUseCase = Depends(get_get_note_use_case)
    update_note_use_case: UpdateNoteUseCase = Depends(get_update_note_use_case)
    delete_note_use_case: DeleteNoteUseCase = Depends(get_delete_note_use_case)

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

    @notes_router.get(
        '/',
        response_model=LimitOffsetPage[NoteListItemOutSchema],
        status_code=status.HTTP_200_OK,
        summary="List user's notes",
        description='Allows authenticated users to list their travel notes with pagination and search by title.',
    )
    async def list_notes(
        self,
        pagination_params: Annotated[LimitOffsetParams, Depends()],
        search_title: str | None = Query(None, description='Search by note title'),
    ) -> LimitOffsetPage[NoteListItemOutSchema]:
        """List all notes for the authenticated user with pagination and search."""
        input_dto = ListNotesInDTO(
            user_id=self.current_user.id,
            search_title=search_title,
        )
        notes = await self.list_notes_use_case.execute(input_dto)
        return paginate(notes.items, params=pagination_params)

    @notes_router.get(
        '/{note_id}',
        response_model=NoteOutSchema,
        status_code=status.HTTP_200_OK,
        summary='Get note details',
        description='Allows authenticated users to retrieve the details of a specific travel note they own.',
        responses={
            status.HTTP_404_NOT_FOUND: {
                'description': 'Note not found or user does not have permission',
                'content': {
                    'application/json': {
                        'example': {'detail': 'Note with ID 123 not found.'},
                    },
                },
            },
        },
    )
    async def get_note_by_id(
        self,
        note_id: int,
    ) -> NoteOutSchema:
        """Get a specific note by ID for the authenticated user."""
        input_dto = GetNoteInDTO(
            note_id=note_id,
            user_id=self.current_user.id,
        )

        try:
            note_dto = await self.get_note_use_case.execute(input_dto)
        except NoteNotFoundError as e:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e

        return NoteOutSchema.model_validate(note_dto)

    @notes_router.put(
        '/{note_id}',
        response_model=NoteOutSchema,
        status_code=status.HTTP_200_OK,
        summary='Update a note',
        description='Allows authenticated users to update an existing travel note they own.',
        responses={
            status.HTTP_404_NOT_FOUND: {
                'description': 'Note not found or user does not have permission',
                'content': {
                    'application/json': {
                        'example': {'detail': 'Note with ID 123 not found.'},
                    },
                },
            },
            status.HTTP_409_CONFLICT: {
                'description': 'Note title conflict',
                'content': {
                    'application/json': {
                        'example': {'detail': 'Note title already exists.'},
                    },
                },
            },
        },
    )
    async def update_note(
        self,
        note_id: int,
        note_in: NoteUpdateInSchema,
    ) -> NoteOutSchema:
        """Update an existing note for the authenticated user."""
        try:
            updated_note = await self.update_note_use_case.execute(
                UpdateNoteInDTO(
                    id=note_id,
                    user_id=self.current_user.id,
                    title=note_in.title,
                    place=note_in.place,
                    date_from=note_in.date_from,
                    date_to=note_in.date_to,
                    number_of_people=note_in.number_of_people,
                    key_ideas=note_in.key_ideas,
                )
            )
        except NoteNotFoundError as e:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e
        except NoteTitleConflictError as e:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e)) from e

        return NoteOutSchema.model_validate(updated_note)

    @notes_router.delete(
        '/{note_id}',
        status_code=status.HTTP_204_NO_CONTENT,
        summary='Delete a note',
        description='Allows authenticated users to delete an existing travel note they own.',
        responses={
            status.HTTP_404_NOT_FOUND: {
                'description': 'Note not found or user does not have permission',
                'content': {
                    'application/json': {
                        'example': {'detail': 'Note with ID 123 not found.'},
                    },
                },
            },
        },
    )
    async def delete_note(
        self,
        note_id: int,
    ) -> Response:
        """Delete an existing note for the authenticated user."""
        try:
            await self.delete_note_use_case.execute(
                DeleteNoteInDTO(
                    note_id=note_id,
                    user_id=self.current_user.id,
                )
            )
        except NoteNotFoundError as exc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

        return Response(status_code=status.HTTP_204_NO_CONTENT)
