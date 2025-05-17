from src.apps.notes.models.note import Note
from src.apps.notes.repositories.note_repository import NoteRepository
from src.apps.notes.usecases.dto.create_note import CreateNoteDTO


class CreateNoteUseCase:
    """Use case to orchestrate the creation of a new note."""

    def __init__(self, note_repository: NoteRepository):
        """Initialize the use case with a note repository."""
        self.note_repository = note_repository

    async def execute(self, create_note_dto: CreateNoteDTO) -> Note:
        """Execute the use case to create a new note.

        Raises:
            NoteTitleConflictError: If a note with the same title already exists for the user.
        """
        return await self.note_repository.create(
            user_id=create_note_dto.user_id,
            title=create_note_dto.title,
            place=create_note_dto.place,
            date_from=create_note_dto.date_from,
            date_to=create_note_dto.date_to,
            number_of_people=create_note_dto.number_of_people,
            key_ideas=create_note_dto.key_ideas,
        )
