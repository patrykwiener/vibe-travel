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

    async def get_by_id(self, note_id: int, user_id: UUID, for_update: bool = False) -> Note:
        """Retrieve a note by its ID and user ID.

        Args:
            note_id: The ID of the note to retrieve
            user_id: The ID of the user who owns the note
            for_update: If True, adds a FOR UPDATE lock to prevent concurrent modification

        Raises:
            NoteNotFoundError: If the note does not exist or doesn't belong to the user.
        """
        query = select(Note).where(Note.id == note_id, Note.user_id == user_id)

        if for_update:
            query = query.with_for_update()

        result = await self.session.execute(query)
        note = result.scalar_one_or_none()

        if note is None:
            raise NoteNotFoundError(note_id=note_id)

        return note

    async def update_note_fields(
        self,
        note: Note,
        title: str,
        place: str,
        date_from: date,
        date_to: date,
        number_of_people: int,
        key_ideas: str | None = None,
    ) -> Note:
        """Update the fields of a note and commit changes.

        Args:
            note: The note object to update
            title: New title for the note
            place: New place for the note
            date_from: New start date
            date_to: New end date
            number_of_people: New number of people
            key_ideas: New key ideas

        Returns:
            The updated note

        Raises:
            NoteTitleConflictError: If a note with the same title already exists for the user
        """
        user_id = str(note.user_id)

        note.title = title
        note.place = place
        note.date_from = date_from
        note.date_to = date_to
        note.number_of_people = number_of_people
        note.key_ideas = key_ideas

        try:
            await self.session.commit()
        except IntegrityError as e:
            await self.session.rollback()
            raise NoteTitleConflictError(title=title, user_id=user_id) from e
        else:
            await self.session.refresh(note)
            return note

    async def delete(self, note: Note) -> None:
        """Delete a note from the database.

        Args:
            note: The note object to delete
        """
        await self.session.delete(note)
        await self.session.commit()
