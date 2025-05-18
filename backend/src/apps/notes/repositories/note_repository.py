"""Note repository for database interactions."""

from datetime import date
from uuid import UUID

from sqlalchemy import Select, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from src.apps.notes.exceptions import NoteNotFoundError, NoteTitleConflictError
from src.apps.notes.models.note import Note


class NoteRepository:
    """Repository for CRUD operations on Note model."""

    def __init__(self, session: AsyncSession):
        """Initialize the repository with a database session."""
        self.session = session

    async def create(
        self,
        user_id: UUID,
        title: str,
        place: str,
        date_from: date,
        date_to: date,
        number_of_people: int,
        key_ideas: str | None = None,
    ) -> Note:
        """Create a new note in the database.

        Raises:
            NoteTitleConflictError: If a note with the same title already exists for the user.
        """
        note = Note(
            user_id=user_id,
            title=title,
            place=place,
            date_from=date_from,
            date_to=date_to,
            number_of_people=number_of_people,
            key_ideas=key_ideas,
        )
        self.session.add(note)
        try:
            await self.session.commit()
        except IntegrityError as e:
            await self.session.rollback()
            raise NoteTitleConflictError(title=title, user_id=str(user_id)) from e
        else:
            await self.session.refresh(note)
            return note

    def get_notes_query(self, user_id: UUID, search_title: str | None) -> Select:
        """Constructs a SQLAlchemy query to select notes for a given user."""
        query = select(Note).where(Note.user_id == user_id)

        if search_title:
            query = query.where(Note.title.ilike(f'%{search_title}%'))

        return query.order_by(Note.created_at.desc())

    async def list_notes_by_user_id(
        self,
        user_id: UUID,
        search_title: str | None = None,
    ) -> list[Note]:
        """Retrieves a list of notes for a given user, optionally filtered by title."""
        query = self.get_notes_query(user_id=user_id, search_title=search_title)
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_by_id(self, note_id: int, user_id: UUID) -> Note:
        """Retrieve a note by its ID and user ID.

        Args:
            note_id: The ID of the note to retrieve.
            user_id: The ID of the user who owns the note.

        Returns:
            The note if found and owned by the user.

        Raises:
            NoteNotFoundError: If the note does not exist or doesn't belong to the user.
        """
        query = select(Note).where(Note.id == note_id, Note.user_id == user_id)
        result = await self.session.execute(query)
        note = result.scalar_one_or_none()

        if note is None:
            raise NoteNotFoundError(note_id=note_id)

        return note
