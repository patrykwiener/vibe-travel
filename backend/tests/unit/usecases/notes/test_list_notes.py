"""Unit tests for ListNotesUseCase class."""

import uuid
from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock

import pytest

from src.apps.notes.models.note import Note
from src.apps.notes.repositories.note_repository import NoteRepository
from src.apps.notes.usecases.dto.list_notes import ListNotesInDTO, ListNotesOutDTO, NoteDetailsDTO
from src.apps.notes.usecases.list_notes import ListNotesUseCase


@pytest.fixture
def mock_note_repository():
    """Create a mock note repository."""
    return AsyncMock(spec=NoteRepository)


@pytest.fixture
def list_notes_use_case(mock_note_repository):
    """Create a ListNotesUseCase instance with mocked dependencies."""
    return ListNotesUseCase(note_repository=mock_note_repository)


@pytest.fixture
def sample_user_id():
    """Create a sample user ID for testing."""
    return uuid.uuid4()


@pytest.fixture
def sample_notes():
    """Create sample note models for testing."""
    base_time = datetime.now(UTC)
    sample_date = datetime.now(UTC).date() + timedelta(days=30)
    return [
        Note(
            id=1,
            user_id=uuid.uuid4(),
            title='Trip to Paris',
            place='Paris, France',
            date_from=sample_date,
            date_to=sample_date + timedelta(days=7),
            number_of_people=2,
            key_ideas='Eiffel Tower, Louvre',
            created_at=base_time,
            updated_at=base_time,
        ),
        Note(
            id=2,
            user_id=uuid.uuid4(),
            title='Weekend Getaway',
            place='Mountain Resort',
            date_from=sample_date + timedelta(days=60),
            date_to=sample_date + timedelta(days=62),
            number_of_people=1,
            key_ideas='Hiking, relaxation',
            created_at=base_time,
            updated_at=base_time,
        ),
        Note(
            id=3,
            user_id=uuid.uuid4(),
            title='Business Travel',
            place='New York City',
            date_from=sample_date + timedelta(days=90),
            date_to=sample_date + timedelta(days=93),
            number_of_people=1,
            key_ideas='Conference meetings',
            created_at=base_time,
            updated_at=base_time,
        ),
    ]


class TestListNotesUseCase:
    """Test cases for ListNotesUseCase."""

    @pytest.mark.asyncio
    async def test_list_notes_success_empty_results(self, list_notes_use_case, mock_note_repository, sample_user_id):
        """Test successful listing with no notes found."""
        # Arrange
        dto_in = ListNotesInDTO(user_id=sample_user_id)
        mock_note_repository.list_notes_by_user_id.return_value = []

        # Act
        result = await list_notes_use_case.execute(dto_in)

        # Assert
        assert isinstance(result, ListNotesOutDTO)
        assert result.items == []
        mock_note_repository.list_notes_by_user_id.assert_called_once_with(user_id=sample_user_id, search_title=None)

    @pytest.mark.asyncio
    async def test_list_notes_success_with_results(
        self, list_notes_use_case, mock_note_repository, sample_notes, sample_user_id
    ):
        """Test successful listing with notes found."""
        # Arrange
        dto_in = ListNotesInDTO(user_id=sample_user_id)
        mock_note_repository.list_notes_by_user_id.return_value = sample_notes

        # Act
        result = await list_notes_use_case.execute(dto_in)

        # Assert
        assert isinstance(result, ListNotesOutDTO)
        assert len(result.items) == 3

        # Verify the first note transformation
        first_note = result.items[0]
        assert isinstance(first_note, NoteDetailsDTO)
        assert first_note.id == sample_notes[0].id
        assert first_note.title == sample_notes[0].title
        assert first_note.place == sample_notes[0].place
        assert first_note.date_from == sample_notes[0].date_from
        assert first_note.date_to == sample_notes[0].date_to
        assert first_note.number_of_people == sample_notes[0].number_of_people

    @pytest.mark.asyncio
    async def test_list_notes_with_search_title(self, list_notes_use_case, mock_note_repository, sample_user_id):
        """Test listing with search title parameter."""
        # Arrange
        search_title = 'Paris'
        dto_in = ListNotesInDTO(user_id=sample_user_id, search_title=search_title)
        mock_note_repository.list_notes_by_user_id.return_value = []

        # Act
        await list_notes_use_case.execute(dto_in)

        # Assert
        mock_note_repository.list_notes_by_user_id.assert_called_once_with(
            user_id=sample_user_id, search_title=search_title
        )

    @pytest.mark.asyncio
    async def test_list_notes_with_single_note(self, list_notes_use_case, mock_note_repository, sample_user_id):
        """Test listing with a single note."""
        # Arrange
        base_time = datetime.now(UTC)
        sample_date = datetime.now(UTC).date() + timedelta(days=30)
        single_note = Note(
            id=42,
            user_id=sample_user_id,
            title='Solo Adventure',
            place='Iceland',
            date_from=sample_date,
            date_to=sample_date + timedelta(days=5),
            number_of_people=1,
            key_ideas='Northern lights, geysers',
            created_at=base_time,
            updated_at=base_time,
        )
        dto_in = ListNotesInDTO(user_id=sample_user_id)
        mock_note_repository.list_notes_by_user_id.return_value = [single_note]

        # Act
        result = await list_notes_use_case.execute(dto_in)

        # Assert
        assert len(result.items) == 1
        note_dto = result.items[0]
        assert note_dto.id == 42
        assert note_dto.title == 'Solo Adventure'
        assert note_dto.place == 'Iceland'

    @pytest.mark.asyncio
    async def test_list_notes_preserves_chronological_order(
        self, list_notes_use_case, mock_note_repository, sample_user_id
    ):
        """Test that note order is preserved from repository."""
        # Arrange
        base_time = datetime.now(UTC)
        sample_date = datetime.now(UTC).date() + timedelta(days=30)
        ordered_notes = [
            Note(
                id=1,
                user_id=sample_user_id,
                title='First',
                place='Place 1',
                date_from=sample_date,
                date_to=sample_date,
                number_of_people=1,
                key_ideas='First trip',
                created_at=base_time,
                updated_at=base_time,
            ),
            Note(
                id=2,
                user_id=sample_user_id,
                title='Second',
                place='Place 2',
                date_from=sample_date,
                date_to=sample_date,
                number_of_people=1,
                key_ideas='Second trip',
                created_at=base_time,
                updated_at=base_time,
            ),
            Note(
                id=3,
                user_id=sample_user_id,
                title='Third',
                place='Place 3',
                date_from=sample_date,
                date_to=sample_date,
                number_of_people=1,
                key_ideas='Third trip',
                created_at=base_time,
                updated_at=base_time,
            ),
        ]
        dto_in = ListNotesInDTO(user_id=sample_user_id)
        mock_note_repository.list_notes_by_user_id.return_value = ordered_notes

        # Act
        result = await list_notes_use_case.execute(dto_in)

        # Assert
        assert len(result.items) == 3
        assert result.items[0].title == 'First'
        assert result.items[1].title == 'Second'
        assert result.items[2].title == 'Third'

    @pytest.mark.asyncio
    async def test_list_notes_dto_transformation_integrity(
        self, list_notes_use_case, mock_note_repository, sample_user_id
    ):
        """Test that all Note model fields are properly mapped to NoteDetailsDTO."""
        # Arrange
        note_time = datetime.now(UTC)
        sample_date = datetime.now(UTC).date() + timedelta(days=30)
        note = Note(
            id=999,
            user_id=sample_user_id,
            title='Complete Note',
            place='Complete Place',
            date_from=sample_date,
            date_to=sample_date + timedelta(days=7),
            number_of_people=4,
            key_ideas='All fields populated',
            created_at=note_time,
            updated_at=note_time,
        )
        dto_in = ListNotesInDTO(user_id=sample_user_id)
        mock_note_repository.list_notes_by_user_id.return_value = [note]

        # Act
        result = await list_notes_use_case.execute(dto_in)

        # Assert
        assert len(result.items) == 1
        note_dto = result.items[0]
        assert note_dto.id == note.id
        assert note_dto.title == note.title
        assert note_dto.place == note.place
        assert note_dto.date_from == note.date_from
        assert note_dto.date_to == note.date_to
        assert note_dto.number_of_people == note.number_of_people

    @pytest.mark.asyncio
    async def test_list_notes_repository_exception_propagation(
        self, list_notes_use_case, mock_note_repository, sample_user_id
    ):
        """Test that repository exceptions are properly propagated."""
        # Arrange
        dto_in = ListNotesInDTO(user_id=sample_user_id)
        test_exception = Exception('Database connection error')
        mock_note_repository.list_notes_by_user_id.side_effect = test_exception

        # Act & Assert
        with pytest.raises(Exception, match='Database connection error'):
            await list_notes_use_case.execute(dto_in)

    @pytest.mark.asyncio
    async def test_list_notes_different_user_ids(self, list_notes_use_case, mock_note_repository):
        """Test listing notes for different user IDs calls repository correctly."""
        # Arrange
        user_id_1 = uuid.uuid4()
        user_id_2 = uuid.uuid4()
        dto_in_1 = ListNotesInDTO(user_id=user_id_1)
        dto_in_2 = ListNotesInDTO(user_id=user_id_2)
        mock_note_repository.list_notes_by_user_id.return_value = []

        # Act
        await list_notes_use_case.execute(dto_in_1)
        await list_notes_use_case.execute(dto_in_2)

        # Assert
        assert mock_note_repository.list_notes_by_user_id.call_count == 2
        mock_note_repository.list_notes_by_user_id.assert_any_call(user_id=user_id_1, search_title=None)
        mock_note_repository.list_notes_by_user_id.assert_any_call(user_id=user_id_2, search_title=None)
