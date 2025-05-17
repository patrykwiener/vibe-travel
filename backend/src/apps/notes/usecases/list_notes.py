from src.apps.notes.repositories.note_repository import NoteRepository
from src.apps.notes.usecases.dto.list_notes import (
    ListNotesInDTO,
    ListNotesOutDTO,
    NoteDetailsDTO,
)


class ListNotesUseCase:
    """Use case to list notes for a user with search."""

    def __init__(self, note_repository: NoteRepository):
        self.note_repository = note_repository

    async def execute(self, input_dto: ListNotesInDTO) -> ListNotesOutDTO:
        """Execute the use case to retrieve notes."""
        notes = await self.note_repository.list_notes_by_user_id(
            user_id=input_dto.user_id, search_title=input_dto.search_title
        )

        note_dtos = [
            NoteDetailsDTO(
                id=note_model.id,
                title=note_model.title,
                place=note_model.place,
                date_from=note_model.date_from,
                date_to=note_model.date_to,
                number_of_people=note_model.number_of_people,
            )
            for note_model in notes
        ]

        return ListNotesOutDTO(items=note_dtos)
