"""Custom exceptions for the notes app."""


class BaseNoteError(Exception):
    """Base class for all note-related exceptions."""


class NoteTitleConflictError(BaseNoteError):
    """Exception raised when a note with the same title already exists for a user."""

    def __init__(self, title: str, user_id: str):
        super().__init__(f'Note with title "{title}" already exists for user {user_id}.')
        self.title = title
        self.user_id = user_id


class NoteNotFoundError(BaseNoteError):
    """Exception raised when a note with the specified ID is not found or user doesn't have permission."""

    def __init__(self, note_id: int):
        super().__init__(f'Note with ID {note_id} not found.')
        self.note_id = note_id
