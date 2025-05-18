from src.apps.notes.repositories.note_repository import NoteRepository
from src.apps.notes.usecases.dto.update_note import (
    UpdateNoteInDTO,
    UpdateNoteOutDTO,
)


class UpdateNoteUseCase:
    """Use case for updating an existing note."""

    def __init__(self, note_repository: NoteRepository):
        self.note_repository = note_repository

    async def execute(self, input_dto: UpdateNoteInDTO) -> UpdateNoteOutDTO:
        """Executes the use case to update a note.

        Raises:
            NoteNotFoundError: If the note is not found or does not belong to the user.
            NoteTitleConflictError: If updating the title causes a conflict with an existing note.
        """
        note = await self.note_repository.get_by_id(
            note_id=input_dto.id,
            user_id=input_dto.user_id,
            for_update=True,
        )
        updated_note = await self.note_repository.update_note_fields(
            note=note,
            title=input_dto.title,
            place=input_dto.place,
            date_from=input_dto.date_from,
            date_to=input_dto.date_to,
            number_of_people=input_dto.number_of_people,
            key_ideas=input_dto.key_ideas,
        )

        return UpdateNoteOutDTO(
            id=updated_note.id,
            user_id=updated_note.user_id,
            title=updated_note.title,
            place=updated_note.place,
            date_from=updated_note.date_from,
            date_to=updated_note.date_to,
            number_of_people=updated_note.number_of_people,
            key_ideas=updated_note.key_ideas,
            created_at=updated_note.created_at,
            updated_at=updated_note.updated_at,
        )
