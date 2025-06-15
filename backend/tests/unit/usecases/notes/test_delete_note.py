"""Unit tests for DeleteNoteUseCase."""

import uuid
from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock

import pytest

from src.apps.notes.exceptions import NoteNotFoundError
from src.apps.notes.models.note import Note
from src.apps.notes.usecases.delete_note import DeleteNoteUseCase
from src.apps.notes.usecases.dto.delete_note import DeleteNoteInDTO


class CustomDatabaseError(Exception):
    """Custom exception for testing database errors."""


class TestDeleteNoteUseCase:
    """Test cases for DeleteNoteUseCase."""

    @pytest.fixture
    def mock_note_repository(self):
        """Create a mock note repository."""
        return AsyncMock()

    @pytest.fixture
    def delete_note_use_case(self, mock_note_repository):
        """Create a DeleteNoteUseCase instance with mocked dependencies."""
        return DeleteNoteUseCase(note_repository=mock_note_repository)

    @pytest.fixture
    def sample_user_id(self):
        """Sample user ID for testing."""
        return uuid.uuid4()

    @pytest.fixture
    def sample_note_id(self):
        """Sample note ID for testing."""
        return 123

    @pytest.fixture
    def sample_delete_note_dto(self, sample_note_id, sample_user_id):
        """Sample DeleteNoteInDTO for testing."""
        return DeleteNoteInDTO(
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

    @pytest.mark.asyncio
    async def test_execute_success(
        self,
        delete_note_use_case,
        mock_note_repository,
        sample_delete_note_dto,
        sample_note,
    ):
        """Test successful note deletion."""
        # Arrange
        mock_note_repository.get_by_id.return_value = sample_note
        mock_note_repository.delete.return_value = None

        # Act
        result = await delete_note_use_case.execute(sample_delete_note_dto)

        # Assert
        assert result is None
        mock_note_repository.get_by_id.assert_called_once_with(
            note_id=sample_delete_note_dto.note_id,
            user_id=sample_delete_note_dto.user_id,
            for_update=True,
        )
        mock_note_repository.delete.assert_called_once_with(sample_note)

    @pytest.mark.asyncio
    async def test_execute_note_not_found(
        self,
        delete_note_use_case,
        mock_note_repository,
        sample_delete_note_dto,
    ):
        """Test that NoteNotFoundError is propagated when note doesn't exist."""
        # Arrange
        not_found_error = NoteNotFoundError(note_id=sample_delete_note_dto.note_id)
        mock_note_repository.get_by_id.side_effect = not_found_error

        # Act & Assert
        with pytest.raises(NoteNotFoundError) as exc_info:
            await delete_note_use_case.execute(sample_delete_note_dto)

        assert exc_info.value.note_id == sample_delete_note_dto.note_id
        mock_note_repository.get_by_id.assert_called_once_with(
            note_id=sample_delete_note_dto.note_id,
            user_id=sample_delete_note_dto.user_id,
            for_update=True,
        )
        mock_note_repository.delete.assert_not_called()

    @pytest.mark.asyncio
    async def test_execute_different_user_note_not_found(
        self,
        delete_note_use_case,
        mock_note_repository,
        sample_note_id,
    ):
        """Test that NoteNotFoundError is raised when user tries to delete another user's note."""
        # Arrange
        different_user_id = uuid.uuid4()
        delete_dto = DeleteNoteInDTO(
            note_id=sample_note_id,
            user_id=different_user_id,
        )

        not_found_error = NoteNotFoundError(note_id=sample_note_id)
        mock_note_repository.get_by_id.side_effect = not_found_error

        # Act & Assert
        with pytest.raises(NoteNotFoundError) as exc_info:
            await delete_note_use_case.execute(delete_dto)

        assert exc_info.value.note_id == sample_note_id
        mock_note_repository.get_by_id.assert_called_once_with(
            note_id=sample_note_id,
            user_id=different_user_id,
            for_update=True,
        )
        mock_note_repository.delete.assert_not_called()

    @pytest.mark.asyncio
    async def test_execute_uses_for_update(
        self,
        delete_note_use_case,
        mock_note_repository,
        sample_delete_note_dto,
        sample_note,
    ):
        """Test that the repository is called with for_update=True for locking."""
        # Arrange
        mock_note_repository.get_by_id.return_value = sample_note
        mock_note_repository.delete.return_value = None

        # Act
        await delete_note_use_case.execute(sample_delete_note_dto)

        # Assert
        mock_note_repository.get_by_id.assert_called_once()
        call_args = mock_note_repository.get_by_id.call_args
        assert call_args.kwargs['for_update'] is True

    @pytest.mark.asyncio
    async def test_execute_propagates_delete_exceptions(
        self,
        delete_note_use_case,
        mock_note_repository,
        sample_delete_note_dto,
        sample_note,
    ):
        """Test that exceptions from delete operation are propagated."""
        # Arrange
        mock_note_repository.get_by_id.return_value = sample_note
        delete_error = CustomDatabaseError('Database delete failed')
        mock_note_repository.delete.side_effect = delete_error

        # Act & Assert
        with pytest.raises(CustomDatabaseError, match='Database delete failed'):
            await delete_note_use_case.execute(sample_delete_note_dto)

        mock_note_repository.get_by_id.assert_called_once()
        mock_note_repository.delete.assert_called_once_with(sample_note)

    @pytest.mark.asyncio
    async def test_execute_delete_called_with_correct_note(
        self,
        delete_note_use_case,
        mock_note_repository,
        sample_delete_note_dto,
        sample_note,
    ):
        """Test that delete is called with the exact note returned by get_by_id."""
        # Arrange
        mock_note_repository.get_by_id.return_value = sample_note
        mock_note_repository.delete.return_value = None

        # Act
        await delete_note_use_case.execute(sample_delete_note_dto)

        # Assert
        mock_note_repository.delete.assert_called_once_with(sample_note)

    @pytest.mark.asyncio
    async def test_execute_method_call_sequence(
        self,
        delete_note_use_case,
        mock_note_repository,
        sample_delete_note_dto,
        sample_note,
    ):
        """Test that methods are called in the correct sequence."""
        # Arrange
        mock_note_repository.get_by_id.return_value = sample_note
        mock_note_repository.delete.return_value = None

        # Act
        await delete_note_use_case.execute(sample_delete_note_dto)

        # Assert - verify call order
        assert mock_note_repository.get_by_id.called
        assert mock_note_repository.delete.called

        # Verify get_by_id was called before delete
        get_by_id_call_time = mock_note_repository.get_by_id.call_args
        delete_call_time = mock_note_repository.delete.call_args
        assert get_by_id_call_time is not None
        assert delete_call_time is not None
