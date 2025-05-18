"""Use case for retrieving note details."""

from src.apps.notes.repositories.note_repository import NoteRepository
from src.apps.notes.usecases.dto.get_note import GetNoteInDTO, GetNoteOutDTO


class GetNoteUseCase:
    """Use case for retrieving a note by ID."""

    def __init__(self, note_repository: NoteRepository):
        self.note_repository = note_repository

    async def execute(self, input_dto: GetNoteInDTO) -> GetNoteOutDTO:
        """Retrieve a note by ID that belongs to the current user.

        Raises:
            NoteNotFoundError: If no note with the given ID exists for the user.
        """
        note = await self.note_repository.get_by_id(
            note_id=input_dto.note_id,
            user_id=input_dto.user_id,
        )

        return GetNoteOutDTO(
            id=note.id,
            user_id=note.user_id,
            title=note.title,
            place=note.place,
            date_from=note.date_from,
            date_to=note.date_to,
            number_of_people=note.number_of_people,
            key_ideas=note.key_ideas,
            created_at=note.created_at,
            updated_at=note.updated_at,
        )
