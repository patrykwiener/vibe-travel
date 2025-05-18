from src.apps.notes.repositories.note_repository import NoteRepository
from src.apps.notes.usecases.dto.delete_note import DeleteNoteInDTO


class DeleteNoteUseCase:
    """Use case for deleting a note."""

    def __init__(self, note_repository: NoteRepository):
        self.note_repository = note_repository

    async def execute(self, input_dto: DeleteNoteInDTO) -> None:
        """Execute the delete note use case.

        Raises:
            NoteNotFoundError: If the note doesn't exist or user doesn't own it
        """
        note = await self.note_repository.get_by_id(
            note_id=input_dto.note_id,
            user_id=input_dto.user_id,
            for_update=True,
        )
        await self.note_repository.delete(note)
