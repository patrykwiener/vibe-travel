"""Unit tests for CreateNoteUseCase."""

import uuid
from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock

import pytest

from src.apps.notes.exceptions import NoteTitleConflictError
from src.apps.notes.models.note import Note
from src.apps.notes.usecases.create_note import CreateNoteUseCase
from src.apps.notes.usecases.dto.create_note import CreateNoteDTO


class CustomDatabaseError(Exception):
    """Custom exception for testing database errors."""


class TestCreateNoteUseCase:
    """Test cases for CreateNoteUseCase."""

    @pytest.fixture
    def mock_note_repository(self):
        """Create a mock note repository."""
        return AsyncMock()

    @pytest.fixture
    def create_note_use_case(self, mock_note_repository):
        """Create a CreateNoteUseCase instance with mocked dependencies."""
        return CreateNoteUseCase(note_repository=mock_note_repository)

    @pytest.fixture
    def sample_user_id(self):
        """Sample user ID for testing."""
        return uuid.uuid4()

    @pytest.fixture
    def sample_create_note_dto(self, sample_user_id):
        """Sample CreateNoteDTO for testing."""
        return CreateNoteDTO(
            user_id=sample_user_id,
            title='Trip to Paris',
            place='Paris, France',
            date_from=datetime.now(tz=UTC).date() + timedelta(days=30),
            date_to=datetime.now(tz=UTC).date() + timedelta(days=37),
            number_of_people=2,
            key_ideas='Eiffel Tower, Louvre Museum, Seine River cruise',
        )

    @pytest.fixture
    def sample_note(self, sample_user_id):
        """Sample Note model for testing."""
        note = MagicMock(spec=Note)
        note.id = 123
        note.user_id = sample_user_id
        note.title = 'Trip to Paris'
        note.place = 'Paris, France'
        note.date_from = datetime.now(tz=UTC).date() + timedelta(days=30)
        note.date_to = datetime.now(tz=UTC).date() + timedelta(days=37)
        note.number_of_people = 2
        note.key_ideas = 'Eiffel Tower, Louvre Museum, Seine River cruise'
        note.created_at = datetime.now(tz=UTC)
        note.updated_at = datetime.now(tz=UTC)
        return note

    @pytest.mark.asyncio
    async def test_execute_success(
        self,
        create_note_use_case,
        mock_note_repository,
        sample_create_note_dto,
        sample_note,
    ):
        """Test successful note creation."""
        # Arrange
        mock_note_repository.create.return_value = sample_note

        # Act
        result = await create_note_use_case.execute(sample_create_note_dto)

        # Assert
        assert result == sample_note
        mock_note_repository.create.assert_called_once_with(
            user_id=sample_create_note_dto.user_id,
            title=sample_create_note_dto.title,
            place=sample_create_note_dto.place,
            date_from=sample_create_note_dto.date_from,
            date_to=sample_create_note_dto.date_to,
            number_of_people=sample_create_note_dto.number_of_people,
            key_ideas=sample_create_note_dto.key_ideas,
        )

    @pytest.mark.asyncio
    async def test_execute_with_minimal_data(
        self,
        create_note_use_case,
        mock_note_repository,
        sample_user_id,
    ):
        """Test note creation with minimal required data."""
        # Arrange
        minimal_dto = CreateNoteDTO(
            user_id=sample_user_id,
            title='Minimal Trip',
            place='Somewhere',
            date_from=datetime.now(UTC).date() + timedelta(days=1),
            date_to=datetime.now(UTC).date() + timedelta(days=2),
            number_of_people=1,
            key_ideas=None,
        )

        minimal_note = MagicMock(spec=Note)
        minimal_note.id = 456
        minimal_note.user_id = sample_user_id
        minimal_note.title = 'Minimal Trip'
        minimal_note.place = 'Somewhere'
        minimal_note.date_from = minimal_dto.date_from
        minimal_note.date_to = minimal_dto.date_to
        minimal_note.number_of_people = 1
        minimal_note.key_ideas = None
        minimal_note.created_at = datetime.now(tz=UTC)
        minimal_note.updated_at = datetime.now(tz=UTC)

        mock_note_repository.create.return_value = minimal_note

        # Act
        result = await create_note_use_case.execute(minimal_dto)

        # Assert
        assert result == minimal_note
        mock_note_repository.create.assert_called_once_with(
            user_id=minimal_dto.user_id,
            title=minimal_dto.title,
            place=minimal_dto.place,
            date_from=minimal_dto.date_from,
            date_to=minimal_dto.date_to,
            number_of_people=minimal_dto.number_of_people,
            key_ideas=minimal_dto.key_ideas,
        )

    @pytest.mark.asyncio
    async def test_execute_title_conflict_error(
        self,
        create_note_use_case,
        mock_note_repository,
        sample_create_note_dto,
    ):
        """Test that NoteTitleConflictError is propagated correctly."""
        # Arrange
        conflict_error = NoteTitleConflictError(
            title=sample_create_note_dto.title,
            user_id=str(sample_create_note_dto.user_id),
        )
        mock_note_repository.create.side_effect = conflict_error

        # Act & Assert
        with pytest.raises(NoteTitleConflictError) as exc_info:
            await create_note_use_case.execute(sample_create_note_dto)

        assert exc_info.value.title == sample_create_note_dto.title
        assert exc_info.value.user_id == str(sample_create_note_dto.user_id)
        mock_note_repository.create.assert_called_once_with(
            user_id=sample_create_note_dto.user_id,
            title=sample_create_note_dto.title,
            place=sample_create_note_dto.place,
            date_from=sample_create_note_dto.date_from,
            date_to=sample_create_note_dto.date_to,
            number_of_people=sample_create_note_dto.number_of_people,
            key_ideas=sample_create_note_dto.key_ideas,
        )

    @pytest.mark.asyncio
    async def test_execute_repository_called_with_correct_parameters(
        self,
        create_note_use_case,
        mock_note_repository,
        sample_create_note_dto,
        sample_note,
    ):
        """Test that repository is called with correct parameters."""
        # Arrange
        mock_note_repository.create.return_value = sample_note

        # Act
        await create_note_use_case.execute(sample_create_note_dto)

        # Assert
        mock_note_repository.create.assert_called_once()
        call_args = mock_note_repository.create.call_args

        # Verify all parameters are passed correctly
        assert call_args.kwargs['user_id'] == sample_create_note_dto.user_id
        assert call_args.kwargs['title'] == sample_create_note_dto.title
        assert call_args.kwargs['place'] == sample_create_note_dto.place
        assert call_args.kwargs['date_from'] == sample_create_note_dto.date_from
        assert call_args.kwargs['date_to'] == sample_create_note_dto.date_to
        assert call_args.kwargs['number_of_people'] == sample_create_note_dto.number_of_people
        assert call_args.kwargs['key_ideas'] == sample_create_note_dto.key_ideas

    @pytest.mark.asyncio
    async def test_execute_returns_note_model(
        self,
        create_note_use_case,
        mock_note_repository,
        sample_create_note_dto,
        sample_note,
    ):
        """Test that the use case returns the Note model from repository."""
        # Arrange
        mock_note_repository.create.return_value = sample_note

        # Act
        result = await create_note_use_case.execute(sample_create_note_dto)

        # Assert
        assert result is sample_note
        assert hasattr(result, 'id')
        assert hasattr(result, 'title')
        assert hasattr(result, 'place')
        assert hasattr(result, 'user_id')
        assert hasattr(result, 'created_at')
        assert hasattr(result, 'updated_at')

    @pytest.mark.asyncio
    async def test_execute_propagates_unexpected_repository_exception(
        self,
        create_note_use_case,
        mock_note_repository,
        sample_create_note_dto,
    ):
        """Test that unexpected exceptions from repository are propagated."""
        # Arrange
        unexpected_error = CustomDatabaseError('Database connection failed')
        mock_note_repository.create.side_effect = unexpected_error

        # Act & Assert
        with pytest.raises(CustomDatabaseError, match='Database connection failed'):
            await create_note_use_case.execute(sample_create_note_dto)

        mock_note_repository.create.assert_called_once()
