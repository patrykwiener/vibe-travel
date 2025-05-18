from dataclasses import dataclass
from uuid import UUID


@dataclass
class DeleteNoteInDTO:
    """Input DTO for the delete note use case."""

    note_id: int
    user_id: UUID
