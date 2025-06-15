"""Unit tests for NoteRepository class."""

import uuid
from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.apps.notes.exceptions import NoteNotFoundError, NoteTitleConflictError
from src.apps.notes.models.note import Note
from src.apps.notes.repositories.note_repository import NoteRepository
from src.apps.users.models.user import User


@pytest.fixture
async def sample_user(async_session: AsyncSession) -> User:
    """Create a sample user for testing."""
    user = User(
        id=uuid.uuid4(),
        email=f'test_{uuid.uuid4().hex[:8]}@example.com',  # Unique email
        hashed_password='hashed_password',
        is_active=True,
        is_superuser=False,
        is_verified=True,
    )
    async_session.add(user)
    await async_session.commit()
    await async_session.refresh(user)
    return user


@pytest.fixture
async def another_user(async_session: AsyncSession) -> User:
    """Create another user for testing ownership constraints."""
    user = User(
        id=uuid.uuid4(),
        email=f'another_{uuid.uuid4().hex[:8]}@example.com',  # Unique email
        hashed_password='hashed_password',
        is_active=True,
        is_superuser=False,
        is_verified=True,
    )
    async_session.add(user)
    await async_session.commit()
    await async_session.refresh(user)
    return user


@pytest.fixture
async def sample_note_data() -> dict:
    """Sample note data for testing."""
    return {
        'title': 'Trip to Paris',
        'place': 'Paris, France',
        'date_from': datetime.now(tz=UTC).date() + timedelta(days=30),
        'date_to': datetime.now(tz=UTC).date() + timedelta(days=37),
        'number_of_people': 2,
        'key_ideas': 'Eiffel Tower, Louvre Museum, Seine River cruise',
    }


@pytest.fixture
async def sample_note(async_session: AsyncSession, sample_user: User, sample_note_data: dict) -> Note:
    """Create a sample note for testing."""
    note = Note(
        user_id=sample_user.id,
        **sample_note_data,
    )
    async_session.add(note)
    await async_session.commit()
    await async_session.refresh(note)
    return note


class TestNoteRepository:
    """Test cases for NoteRepository."""

    @pytest.mark.asyncio
    async def test_create_note_success(
        self,
        async_session: AsyncSession,
        sample_user: User,
        sample_note_data: dict,
    ):
        """Test successful note creation."""
        # Arrange
        repository = NoteRepository(session=async_session)

        # Act
        created_note = await repository.create(
            user_id=sample_user.id,
            **sample_note_data,
        )

        # Assert
        assert created_note.id is not None
        assert created_note.user_id == sample_user.id
        assert created_note.title == sample_note_data['title']
        assert created_note.place == sample_note_data['place']
        assert created_note.date_from == sample_note_data['date_from']
        assert created_note.date_to == sample_note_data['date_to']
        assert created_note.number_of_people == sample_note_data['number_of_people']
        assert created_note.key_ideas == sample_note_data['key_ideas']
        assert created_note.created_at is not None
        assert created_note.updated_at is not None

        # Verify note is persisted in database
        db_note = await async_session.get(Note, created_note.id)
        assert db_note is not None
        assert db_note.title == sample_note_data['title']

    @pytest.mark.asyncio
    async def test_create_note_with_minimal_data(
        self,
        async_session: AsyncSession,
        sample_user: User,
    ):
        """Test note creation with minimal required data."""
        # Arrange
        repository = NoteRepository(session=async_session)
        minimal_data = {
            'title': 'Minimal Trip',
            'place': 'Somewhere',
            'date_from': datetime.now(UTC).date() + timedelta(days=1),
            'date_to': datetime.now(UTC).date() + timedelta(days=2),
            'number_of_people': 1,
            'key_ideas': None,
        }

        # Act
        created_note = await repository.create(
            user_id=sample_user.id,
            **minimal_data,
        )

        # Assert
        assert created_note.id is not None
        assert created_note.key_ideas is None
        assert created_note.user_id == sample_user.id

    @pytest.mark.asyncio
    async def test_create_note_title_conflict_same_user(
        self,
        async_session: AsyncSession,
        sample_user: User,
        sample_note: Note,
        sample_note_data: dict,
    ):
        """Test that creating a note with duplicate title for same user raises NoteTitleConflictError."""
        # Arrange
        repository = NoteRepository(session=async_session)
        user_id = sample_user.id  # Capture user ID before session issues

        # Act & Assert
        with pytest.raises(NoteTitleConflictError) as exc_info:
            await repository.create(
                user_id=user_id,
                **sample_note_data,  # Same title as existing note
            )

        assert exc_info.value.title == sample_note_data['title']
        assert str(exc_info.value.user_id) == str(user_id)

    @pytest.mark.asyncio
    async def test_create_note_same_title_different_users(
        self,
        async_session: AsyncSession,
        sample_user: User,
        another_user: User,
        sample_note: Note,
        sample_note_data: dict,
    ):
        """Test that creating a note with same title for different users is allowed."""
        # Arrange
        repository = NoteRepository(session=async_session)

        # Act
        created_note = await repository.create(
            user_id=another_user.id,
            **sample_note_data,  # Same title as existing note but different user
        )

        # Assert
        assert created_note.id is not None
        assert created_note.user_id == another_user.id
        assert created_note.title == sample_note_data['title']

        # Verify both notes exist in database - count only notes with this specific title
        all_notes = (
            (
                await async_session.execute(
                    select(Note).filter(
                        Note.title == sample_note_data['title'], Note.user_id.in_([sample_user.id, another_user.id])
                    )
                )
            )
            .scalars()
            .all()
        )
        assert len(all_notes) == 2

    @pytest.mark.asyncio
    async def test_get_notes_query_basic(
        self,
        async_session: AsyncSession,
        sample_user: User,
    ):
        """Test basic get_notes_query functionality."""
        # Arrange
        repository = NoteRepository(session=async_session)

        # Act
        query = repository.get_notes_query(
            user_id=sample_user.id,
            search_title=None,
        )

        # Assert
        assert query is not None
        # Query should filter by user_id
        query_str = str(query)
        assert 'note.user_id' in query_str

    @pytest.mark.asyncio
    async def test_get_notes_query_with_title_filter(
        self,
        async_session: AsyncSession,
        sample_user: User,
    ):
        """Test get_notes_query with title filter."""
        # Arrange
        repository = NoteRepository(session=async_session)

        # Act
        query = repository.get_notes_query(
            user_id=sample_user.id,
            search_title='Paris',
        )

        # Assert
        assert query is not None
        query_str = str(query)
        assert 'note.user_id' in query_str
        # Check for case insensitive search - could be 'ilike' or 'lower(...) like lower(...)'
        assert 'ilike' in query_str.lower() or ('like' in query_str.lower() and 'lower' in query_str.lower())

    @pytest.mark.asyncio
    async def test_list_notes_by_user_id_empty(
        self,
        async_session: AsyncSession,
        sample_user: User,
    ):
        """Test listing notes for user with no notes."""
        # Arrange
        repository = NoteRepository(session=async_session)

        # Act
        notes = await repository.list_notes_by_user_id(
            user_id=sample_user.id,
        )

        # Assert
        assert notes == []

    @pytest.mark.asyncio
    async def test_list_notes_by_user_id_with_notes(
        self,
        async_session: AsyncSession,
        sample_user: User,
        sample_note: Note,
    ):
        """Test listing notes for user with existing notes."""
        # Arrange
        repository = NoteRepository(session=async_session)
        additional_note_data = {
            'title': 'Trip to Rome',
            'place': 'Rome, Italy',
            'date_from': datetime.now(UTC).date() + timedelta(days=60),
            'date_to': datetime.now(UTC).date() + timedelta(days=67),
            'number_of_people': 3,
            'key_ideas': 'Colosseum, Vatican, Roman Forum',
        }
        await repository.create(
            user_id=sample_user.id,
            **additional_note_data,
        )

        # Act
        notes = await repository.list_notes_by_user_id(
            user_id=sample_user.id,
        )

        # Assert
        assert len(notes) == 2
        note_titles = [note.title for note in notes]
        assert 'Trip to Paris' in note_titles
        assert 'Trip to Rome' in note_titles
        # All notes should belong to the user
        assert all(note.user_id == sample_user.id for note in notes)

    @pytest.mark.asyncio
    async def test_list_notes_by_user_id_with_title_filter(
        self,
        async_session: AsyncSession,
        sample_user: User,
        sample_note: Note,
    ):
        """Test listing notes with title filter."""
        # Arrange
        repository = NoteRepository(session=async_session)
        additional_note_data = {
            'title': 'Business Trip to Berlin',
            'place': 'Berlin, Germany',
            'date_from': datetime.now(UTC).date() + timedelta(days=60),
            'date_to': datetime.now(UTC).date() + timedelta(days=67),
            'number_of_people': 1,
            'key_ideas': 'Conference, meetings',
        }
        await repository.create(
            user_id=sample_user.id,
            **additional_note_data,
        )

        # Act - filter by "Trip"
        notes = await repository.list_notes_by_user_id(
            user_id=sample_user.id,
            search_title='Trip',
        )

        # Assert
        assert len(notes) == 2  # Both notes contain "Trip"
        note_titles = [note.title for note in notes]
        assert 'Trip to Paris' in note_titles
        assert 'Business Trip to Berlin' in note_titles

        # Act - filter by "Paris"
        notes_paris = await repository.list_notes_by_user_id(
            user_id=sample_user.id,
            search_title='Paris',
        )

        # Assert
        assert len(notes_paris) == 1
        assert notes_paris[0].title == 'Trip to Paris'

    @pytest.mark.asyncio
    async def test_list_notes_by_user_id_case_insensitive_filter(
        self,
        async_session: AsyncSession,
        sample_user: User,
        sample_note: Note,
    ):
        """Test that title filter is case insensitive."""
        # Arrange
        repository = NoteRepository(session=async_session)

        # Act - filter with different cases
        notes_lower = await repository.list_notes_by_user_id(
            user_id=sample_user.id,
            search_title='paris',
        )
        notes_upper = await repository.list_notes_by_user_id(
            user_id=sample_user.id,
            search_title='PARIS',
        )
        notes_mixed = await repository.list_notes_by_user_id(
            user_id=sample_user.id,
            search_title='pArIs',
        )

        # Assert
        assert len(notes_lower) == 1
        assert len(notes_upper) == 1
        assert len(notes_mixed) == 1
        assert notes_lower[0].title == 'Trip to Paris'
        assert notes_upper[0].title == 'Trip to Paris'
        assert notes_mixed[0].title == 'Trip to Paris'

    @pytest.mark.asyncio
    async def test_list_notes_by_user_id_isolation(
        self,
        async_session: AsyncSession,
        sample_user: User,
        another_user: User,
        sample_note: Note,
    ):
        """Test that users can only see their own notes."""
        # Arrange
        repository = NoteRepository(session=async_session)
        other_note_data = {
            'title': 'Other User Trip',
            'place': 'London, UK',
            'date_from': datetime.now(UTC).date() + timedelta(days=90),
            'date_to': datetime.now(UTC).date() + timedelta(days=97),
            'number_of_people': 2,
            'key_ideas': 'Big Ben, Tower of London',
        }
        await repository.create(
            user_id=another_user.id,
            **other_note_data,
        )

        # Act
        user_notes = await repository.list_notes_by_user_id(
            user_id=sample_user.id,
        )
        other_user_notes = await repository.list_notes_by_user_id(
            user_id=another_user.id,
        )

        # Assert
        assert len(user_notes) == 1
        assert len(other_user_notes) == 1
        assert user_notes[0].title == 'Trip to Paris'
        assert other_user_notes[0].title == 'Other User Trip'
        assert user_notes[0].user_id == sample_user.id
        assert other_user_notes[0].user_id == another_user.id

    @pytest.mark.asyncio
    async def test_get_by_id_success(
        self,
        async_session: AsyncSession,
        sample_note: Note,
        sample_user: User,
    ):
        """Test successful note retrieval by ID."""
        # Arrange
        repository = NoteRepository(session=async_session)

        # Act
        retrieved_note = await repository.get_by_id(
            note_id=sample_note.id,
            user_id=sample_user.id,
        )

        # Assert
        assert retrieved_note is not None
        assert retrieved_note.id == sample_note.id
        assert retrieved_note.title == sample_note.title
        assert retrieved_note.user_id == sample_note.user_id

    @pytest.mark.asyncio
    async def test_get_by_id_not_found(
        self,
        async_session: AsyncSession,
        sample_user: User,
    ):
        """Test that get_by_id raises NoteNotFoundError for non-existent note."""
        # Arrange
        repository = NoteRepository(session=async_session)
        non_existent_id = 99999

        # Act & Assert
        with pytest.raises(NoteNotFoundError) as exc_info:
            await repository.get_by_id(
                note_id=non_existent_id,
                user_id=sample_user.id,
            )

        assert exc_info.value.note_id == non_existent_id

    @pytest.mark.asyncio
    async def test_get_by_id_different_user(
        self,
        async_session: AsyncSession,
        sample_note: Note,
        another_user: User,
    ):
        """Test that get_by_id raises NoteNotFoundError when accessing note of different user."""
        # Arrange
        repository = NoteRepository(session=async_session)

        # Act & Assert
        with pytest.raises(NoteNotFoundError) as exc_info:
            await repository.get_by_id(
                note_id=sample_note.id,
                user_id=another_user.id,  # Different user
            )

        assert exc_info.value.note_id == sample_note.id

    @pytest.mark.asyncio
    async def test_get_by_id_with_for_update(
        self,
        async_session: AsyncSession,
        sample_note: Note,
        sample_user: User,
    ):
        """Test get_by_id with for_update lock."""
        # Arrange
        repository = NoteRepository(session=async_session)

        # Act
        retrieved_note = await repository.get_by_id(
            note_id=sample_note.id,
            user_id=sample_user.id,
            for_update=True,
        )

        # Assert
        assert retrieved_note is not None
        assert retrieved_note.id == sample_note.id

    @pytest.mark.asyncio
    async def test_update_note_fields_success(
        self,
        async_session: AsyncSession,
        sample_note: Note,
    ):
        """Test successful note field updates."""
        # Arrange
        repository = NoteRepository(session=async_session)
        original_updated_at = sample_note.updated_at
        new_data = {
            'title': 'Updated Trip to Paris',
            'place': 'Paris and Nice, France',
            'number_of_people': 4,
            'key_ideas': 'Eiffel Tower, Louvre Museum, Nice beaches',
            'date_from': datetime.now(tz=UTC).date() + timedelta(days=35),
            'date_to': datetime.now(tz=UTC).date() + timedelta(days=42),
        }

        # Act
        updated_note = await repository.update_note_fields(
            note=sample_note,
            **new_data,
        )

        # Assert
        assert updated_note.id == sample_note.id
        assert updated_note.title == new_data['title']
        assert updated_note.place == new_data['place']
        assert updated_note.number_of_people == new_data['number_of_people']
        assert updated_note.key_ideas == new_data['key_ideas']
        assert updated_note.date_from == new_data['date_from']
        assert updated_note.date_to == new_data['date_to']
        # updated_at should be changed
        assert updated_note.updated_at > original_updated_at

        # Verify changes are persisted
        await async_session.refresh(updated_note)
        assert updated_note.title == new_data['title']

    @pytest.mark.asyncio
    async def test_update_note_fields_title_conflict(
        self,
        async_session: AsyncSession,
        sample_user: User,
        sample_note: Note,
    ):
        """Test that updating to conflicting title raises NoteTitleConflictError."""
        # Arrange
        repository = NoteRepository(session=async_session)
        user_id = sample_user.id  # Capture user ID before session issues
        conflicting_note_data = {
            'title': 'Trip to Rome',
            'place': 'Rome, Italy',
            'date_from': datetime.now(tz=UTC).date() + timedelta(days=60),
            'date_to': datetime.now(tz=UTC).date() + timedelta(days=67),
            'number_of_people': 2,
            'key_ideas': 'Colosseum, Vatican',
        }
        await repository.create(
            user_id=user_id,
            **conflicting_note_data,
        )

        # Act & Assert - try to update the original note to have the same title
        with pytest.raises(NoteTitleConflictError) as exc_info:
            await repository.update_note_fields(
                note=sample_note,
                title='Trip to Rome',  # Same as conflicting_note
                place=sample_note.place,
                date_from=sample_note.date_from,
                date_to=sample_note.date_to,
                number_of_people=sample_note.number_of_people,
                key_ideas=sample_note.key_ideas,
            )

        assert exc_info.value.title == 'Trip to Rome'
        assert str(exc_info.value.user_id) == str(user_id)

    @pytest.mark.asyncio
    async def test_update_note_fields_same_title_allowed(
        self,
        async_session: AsyncSession,
        sample_note: Note,
    ):
        """Test that updating note with same title is allowed."""
        # Arrange
        repository = NoteRepository(session=async_session)
        original_title = sample_note.title

        # Act - update with same title but different field
        updated_note = await repository.update_note_fields(
            note=sample_note,
            title=original_title,  # Same title
            place=sample_note.place,
            date_from=sample_note.date_from,
            date_to=sample_note.date_to,
            number_of_people=10,  # Different field
            key_ideas=sample_note.key_ideas,
        )

        # Assert
        assert updated_note.title == original_title
        assert updated_note.number_of_people == 10

    @pytest.mark.asyncio
    async def test_delete_success(
        self,
        async_session: AsyncSession,
        sample_note: Note,
    ):
        """Test successful note deletion."""
        # Arrange
        repository = NoteRepository(session=async_session)
        note_id = sample_note.id

        # Act
        await repository.delete(note=sample_note)

        # Assert - note should no longer exist
        deleted_note = await async_session.get(Note, note_id)
        assert deleted_note is None

    @pytest.mark.asyncio
    async def test_list_notes_ordering(
        self,
        async_session: AsyncSession,
        sample_user: User,
    ):
        """Test that notes are returned in consistent order (by created_at desc)."""
        # Arrange
        repository = NoteRepository(session=async_session)
        note_data_1 = {
            'title': 'First Note',
            'place': 'Place 1',
            'date_from': datetime.now(tz=UTC).date() + timedelta(days=1),
            'date_to': datetime.now(tz=UTC).date() + timedelta(days=2),
            'number_of_people': 1,
            'key_ideas': None,
        }

        note_data_2 = {
            'title': 'Second Note',
            'place': 'Place 2',
            'date_from': datetime.now(tz=UTC).date() + timedelta(days=3),
            'date_to': datetime.now(tz=UTC).date() + timedelta(days=4),
            'number_of_people': 2,
            'key_ideas': None,
        }

        # Create notes
        note1 = await repository.create(
            user_id=sample_user.id,
            **note_data_1,
        )
        note2 = await repository.create(
            user_id=sample_user.id,
            **note_data_2,
        )

        # Act
        notes = await repository.list_notes_by_user_id(
            user_id=sample_user.id,
        )

        # Assert - notes should be ordered by created_at desc (newest first)
        assert len(notes) == 2
        assert notes[0].id == note2.id  # Second note should be first (newer)
        assert notes[1].id == note1.id  # First note should be second (older)

    @pytest.mark.asyncio
    async def test_edge_case_empty_title_filter(
        self,
        async_session: AsyncSession,
        sample_user: User,
        sample_note: Note,
    ):
        """Test behavior with empty title filter."""
        # Arrange
        repository = NoteRepository(session=async_session)

        # Act - empty string filter
        notes_empty = await repository.list_notes_by_user_id(
            user_id=sample_user.id,
            search_title='',
        )

        # Act - None filter
        notes_none = await repository.list_notes_by_user_id(
            user_id=sample_user.id,
            search_title=None,
        )

        # Assert - should return all notes for both cases
        assert len(notes_empty) == 1
        assert len(notes_none) == 1
        assert notes_empty[0].id == sample_note.id
        assert notes_none[0].id == sample_note.id

    @pytest.mark.asyncio
    async def test_edge_case_special_characters_in_title(
        self,
        async_session: AsyncSession,
        sample_user: User,
    ):
        """Test handling of special characters in title."""
        # Arrange
        repository = NoteRepository(session=async_session)
        special_title = 'Trip with émojis 🌍 & spéciål chars!@#$%'
        note_data = {
            'title': special_title,
            'place': "Côte d'Azur, France",
            'date_from': datetime.now(tz=UTC).date() + timedelta(days=1),
            'date_to': datetime.now(tz=UTC).date() + timedelta(days=2),
            'number_of_people': 2,
            'key_ideas': 'Special trip with émojis 🏖️',
        }

        # Act
        created_note = await repository.create(
            user_id=sample_user.id,
            **note_data,
        )

        retrieved_note = await repository.get_by_id(
            note_id=created_note.id,
            user_id=sample_user.id,
        )

        # Assert
        assert retrieved_note.title == special_title
        assert retrieved_note.place == "Côte d'Azur, France"
        assert retrieved_note.key_ideas == 'Special trip with émojis 🏖️'

        # Test filtering with special characters
        filtered_notes = await repository.list_notes_by_user_id(
            user_id=sample_user.id,
            search_title='émojis',
        )
        assert len(filtered_notes) == 1
        assert filtered_notes[0].id == created_note.id
