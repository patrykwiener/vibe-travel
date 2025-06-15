"""Unit tests for GetNoteUseCase."""

import uuid
from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock

import pytest

from src.apps.notes.exceptions import NoteNotFoundError
from src.apps.notes.models.note import Note
from src.apps.notes.usecases.dto.get_note import GetNoteInDTO, GetNoteOutDTO
from src.apps.notes.usecases.get_note import GetNoteUseCase


class CustomDatabaseError(Exception):
    """Custom exception for testing database errors."""


class TestGetNoteUseCase:
    """Test cases for GetNoteUseCase."""

    @pytest.fixture
    def mock_note_repository(self):
        """Create a mock note repository."""
        return AsyncMock()

    @pytest.fixture
    def get_note_use_case(self, mock_note_repository):
        """Create a GetNoteUseCase instance with mocked dependencies."""
        return GetNoteUseCase(note_repository=mock_note_repository)

    @pytest.fixture
    def sample_user_id(self):
        """Sample user ID for testing."""
        return uuid.uuid4()

    @pytest.fixture
    def sample_note_id(self):
        """Sample note ID for testing."""
        return 123

    @pytest.fixture
    def sample_get_note_dto(self, sample_note_id, sample_user_id):
        """Sample GetNoteInDTO for testing."""
        return GetNoteInDTO(
            note_id=sample_note_id,
            user_id=sample_user_id,
        )

    @pytest.fixture
    def sample_note(self, sample_note_id, sample_user_id):
        """Sample Note model for testing."""
        note = MagicMock(spec=Note)
        note.id = sample_note_id
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

    @pytest.fixture
    def expected_get_note_out_dto(self, sample_note):
        """Expected GetNoteOutDTO for testing."""
        return GetNoteOutDTO(
            id=sample_note.id,
            user_id=sample_note.user_id,
            title=sample_note.title,
            place=sample_note.place,
            date_from=sample_note.date_from,
            date_to=sample_note.date_to,
            number_of_people=sample_note.number_of_people,
            key_ideas=sample_note.key_ideas,
            created_at=sample_note.created_at,
            updated_at=sample_note.updated_at,
        )

    @pytest.mark.asyncio
    async def test_execute_success(
        self,
        get_note_use_case,
        mock_note_repository,
        sample_get_note_dto,
        sample_note,
        expected_get_note_out_dto,
    ):
        """Test successful note retrieval."""
        # Arrange
        mock_note_repository.get_by_id.return_value = sample_note

        # Act
        result = await get_note_use_case.execute(sample_get_note_dto)

        # Assert
        assert isinstance(result, GetNoteOutDTO)
        assert result.id == expected_get_note_out_dto.id
        assert result.user_id == expected_get_note_out_dto.user_id
        assert result.title == expected_get_note_out_dto.title
        assert result.place == expected_get_note_out_dto.place
        assert result.date_from == expected_get_note_out_dto.date_from
        assert result.date_to == expected_get_note_out_dto.date_to
        assert result.number_of_people == expected_get_note_out_dto.number_of_people
        assert result.key_ideas == expected_get_note_out_dto.key_ideas
        assert result.created_at == expected_get_note_out_dto.created_at
        assert result.updated_at == expected_get_note_out_dto.updated_at

        mock_note_repository.get_by_id.assert_called_once_with(
            note_id=sample_get_note_dto.note_id,
            user_id=sample_get_note_dto.user_id,
        )

    @pytest.mark.asyncio
    async def test_execute_note_not_found(
        self,
        get_note_use_case,
        mock_note_repository,
        sample_get_note_dto,
    ):
        """Test that NoteNotFoundError is propagated when note doesn't exist."""
        # Arrange
        not_found_error = NoteNotFoundError(note_id=sample_get_note_dto.note_id)
        mock_note_repository.get_by_id.side_effect = not_found_error

        # Act & Assert
        with pytest.raises(NoteNotFoundError) as exc_info:
            await get_note_use_case.execute(sample_get_note_dto)

        assert exc_info.value.note_id == sample_get_note_dto.note_id
        mock_note_repository.get_by_id.assert_called_once_with(
            note_id=sample_get_note_dto.note_id,
            user_id=sample_get_note_dto.user_id,
        )

    @pytest.mark.asyncio
    async def test_execute_different_user_note_not_found(
        self,
        get_note_use_case,
        mock_note_repository,
        sample_note_id,
    ):
        """Test that NoteNotFoundError is raised when user tries to access another user's note."""
        # Arrange
        different_user_id = uuid.uuid4()
        get_note_dto = GetNoteInDTO(
            note_id=sample_note_id,
            user_id=different_user_id,
        )

        not_found_error = NoteNotFoundError(note_id=sample_note_id)
        mock_note_repository.get_by_id.side_effect = not_found_error

        # Act & Assert
        with pytest.raises(NoteNotFoundError) as exc_info:
            await get_note_use_case.execute(get_note_dto)

        assert exc_info.value.note_id == sample_note_id
        mock_note_repository.get_by_id.assert_called_once_with(
            note_id=sample_note_id,
            user_id=different_user_id,
        )

    @pytest.mark.asyncio
    async def test_execute_with_none_key_ideas(
        self,
        get_note_use_case,
        mock_note_repository,
        sample_get_note_dto,
        sample_note_id,
        sample_user_id,
    ):
        """Test successful note retrieval when key_ideas is None."""
        # Arrange
        note_with_none_key_ideas = MagicMock(spec=Note)
        note_with_none_key_ideas.id = sample_note_id
        note_with_none_key_ideas.user_id = sample_user_id
        note_with_none_key_ideas.title = 'Simple Trip'
        note_with_none_key_ideas.place = 'Local City'
        note_with_none_key_ideas.date_from = datetime.now(tz=UTC).date() + timedelta(days=1)
        note_with_none_key_ideas.date_to = datetime.now(tz=UTC).date() + timedelta(days=2)
        note_with_none_key_ideas.number_of_people = 1
        note_with_none_key_ideas.key_ideas = None
        note_with_none_key_ideas.created_at = datetime.now(tz=UTC)
        note_with_none_key_ideas.updated_at = datetime.now(tz=UTC)

        mock_note_repository.get_by_id.return_value = note_with_none_key_ideas

        # Act
        result = await get_note_use_case.execute(sample_get_note_dto)

        # Assert
        assert isinstance(result, GetNoteOutDTO)
        assert result.key_ideas is None
        assert result.id == sample_note_id
        assert result.user_id == sample_user_id
        assert result.title == 'Simple Trip'
        mock_note_repository.get_by_id.assert_called_once()

    @pytest.mark.asyncio
    async def test_execute_dto_mapping_is_complete(
        self,
        get_note_use_case,
        mock_note_repository,
        sample_get_note_dto,
        sample_note,
    ):
        """Test that all fields from Note model are mapped to GetNoteOutDTO."""
        # Arrange
        mock_note_repository.get_by_id.return_value = sample_note

        # Act
        result = await get_note_use_case.execute(sample_get_note_dto)

        # Assert - verify all required fields are present
        assert hasattr(result, 'id')
        assert hasattr(result, 'user_id')
        assert hasattr(result, 'title')
        assert hasattr(result, 'place')
        assert hasattr(result, 'date_from')
        assert hasattr(result, 'date_to')
        assert hasattr(result, 'number_of_people')
        assert hasattr(result, 'key_ideas')
        assert hasattr(result, 'created_at')
        assert hasattr(result, 'updated_at')

        # Verify values are correctly mapped
        assert result.id == sample_note.id
        assert result.user_id == sample_note.user_id
        assert result.title == sample_note.title
        assert result.place == sample_note.place
        assert result.date_from == sample_note.date_from
        assert result.date_to == sample_note.date_to
        assert result.number_of_people == sample_note.number_of_people
        assert result.key_ideas == sample_note.key_ideas
        assert result.created_at == sample_note.created_at
        assert result.updated_at == sample_note.updated_at

    @pytest.mark.asyncio
    async def test_execute_repository_called_without_for_update(
        self,
        get_note_use_case,
        mock_note_repository,
        sample_get_note_dto,
        sample_note,
    ):
        """Test that repository is called without for_update flag for read operations."""
        # Arrange
        mock_note_repository.get_by_id.return_value = sample_note

        # Act
        await get_note_use_case.execute(sample_get_note_dto)

        # Assert
        mock_note_repository.get_by_id.assert_called_once()
        call_args = mock_note_repository.get_by_id.call_args

        # Verify for_update is not passed (default should be False for read operations)
        assert 'for_update' not in call_args.kwargs or call_args.kwargs.get('for_update', False) is False

    @pytest.mark.asyncio
    async def test_execute_repository_called_with_correct_parameters(
        self,
        get_note_use_case,
        mock_note_repository,
        sample_get_note_dto,
        sample_note,
    ):
        """Test that repository is called with correct parameters."""
        # Arrange
        mock_note_repository.get_by_id.return_value = sample_note

        # Act
        await get_note_use_case.execute(sample_get_note_dto)

        # Assert
        mock_note_repository.get_by_id.assert_called_once_with(
            note_id=sample_get_note_dto.note_id,
            user_id=sample_get_note_dto.user_id,
        )

    @pytest.mark.asyncio
    async def test_execute_propagates_unexpected_repository_exception(
        self,
        get_note_use_case: GetNoteUseCase,
        mock_note_repository: AsyncMock,
        sample_get_note_dto,
    ):
        """Test that unexpected exceptions from repository are propagated."""
        # Arrange
        unexpected_error = CustomDatabaseError('Database connection failed')
        mock_note_repository.get_by_id.side_effect = unexpected_error

        # Act & Assert
        with pytest.raises(CustomDatabaseError, match='Database connection failed'):
            await get_note_use_case.execute(sample_get_note_dto)

        mock_note_repository.get_by_id.assert_called_once()
