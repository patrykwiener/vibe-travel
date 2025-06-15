"""Unit tests for UpdateNoteUseCase class."""

import uuid
from datetime import UTC, date, datetime, timedelta
from unittest.mock import AsyncMock

import pytest

from src.apps.notes.exceptions import NoteNotFoundError, NoteTitleConflictError
from src.apps.notes.models.note import Note
from src.apps.notes.repositories.note_repository import NoteRepository
from src.apps.notes.usecases.dto.update_note import UpdateNoteInDTO, UpdateNoteOutDTO
from src.apps.notes.usecases.update_note import UpdateNoteUseCase


@pytest.fixture
def mock_note_repository():
    """Create a mock note repository."""
    return AsyncMock(spec=NoteRepository)


@pytest.fixture
def update_note_use_case(mock_note_repository):
    """Create an UpdateNoteUseCase instance with mocked dependencies."""
    return UpdateNoteUseCase(note_repository=mock_note_repository)


@pytest.fixture
def sample_user_id():
    """Create a sample user ID for testing."""
    return uuid.uuid4()


@pytest.fixture
def sample_note():
    """Create a sample note for testing."""
    return Note(
        id=1,
        user_id=uuid.uuid4(),
        title='Original Title',
        place='Original Place',
        date_from=datetime.now(UTC).date() + timedelta(days=30),
        date_to=datetime.now(UTC).date() + timedelta(days=37),
        number_of_people=2,
        key_ideas='Original ideas',
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )


@pytest.fixture
def sample_update_dto(sample_user_id):
    """Create a sample update DTO for testing."""
    return UpdateNoteInDTO(
        id=1,
        user_id=sample_user_id,
        title='Updated Title',
        place='Updated Place',
        date_from=datetime.now(UTC).date() + timedelta(days=60),
        date_to=datetime.now(UTC).date() + timedelta(days=67),
        number_of_people=4,
        key_ideas='Updated ideas',
    )


class TestUpdateNoteUseCase:
    """Test cases for UpdateNoteUseCase."""

    @pytest.mark.asyncio
    async def test_execute_success(
        self,
        update_note_use_case: UpdateNoteUseCase,
        mock_note_repository: AsyncMock,
        sample_note: Note,
        sample_update_dto: UpdateNoteInDTO,
    ):
        """Test successful note update."""
        # Arrange
        updated_note = Note(
            id=sample_note.id,
            user_id=sample_note.user_id,
            title=sample_update_dto.title,
            place=sample_update_dto.place,
            date_from=sample_update_dto.date_from,
            date_to=sample_update_dto.date_to,
            number_of_people=sample_update_dto.number_of_people,
            key_ideas=sample_update_dto.key_ideas,
            created_at=sample_note.created_at,
            updated_at=datetime.now(UTC),
        )

        mock_note_repository.get_by_id.return_value = sample_note
        mock_note_repository.update_note_fields.return_value = updated_note

        # Act
        result = await update_note_use_case.execute(sample_update_dto)

        # Assert
        assert isinstance(result, UpdateNoteOutDTO)
        assert result.id == sample_note.id
        assert result.user_id == sample_note.user_id
        assert result.title == sample_update_dto.title
        assert result.place == sample_update_dto.place
        assert result.date_from == sample_update_dto.date_from
        assert result.date_to == sample_update_dto.date_to
        assert result.number_of_people == sample_update_dto.number_of_people
        assert result.key_ideas == sample_update_dto.key_ideas
        assert result.created_at == sample_note.created_at
        assert result.updated_at == updated_note.updated_at

        # Verify repository methods were called correctly
        mock_note_repository.get_by_id.assert_called_once_with(
            note_id=sample_update_dto.id,
            user_id=sample_update_dto.user_id,
            for_update=True,
        )
        mock_note_repository.update_note_fields.assert_called_once_with(
            note=sample_note,
            title=sample_update_dto.title,
            place=sample_update_dto.place,
            date_from=sample_update_dto.date_from,
            date_to=sample_update_dto.date_to,
            number_of_people=sample_update_dto.number_of_people,
            key_ideas=sample_update_dto.key_ideas,
        )

    @pytest.mark.asyncio
    async def test_execute_success_with_null_key_ideas(
        self,
        update_note_use_case: UpdateNoteUseCase,
        mock_note_repository: AsyncMock,
        sample_note: Note,
        sample_user_id: uuid.UUID,
    ):
        """Test successful note update with null key_ideas."""
        # Arrange
        update_dto = UpdateNoteInDTO(
            id=1,
            user_id=sample_user_id,
            title='Updated Title',
            place='Updated Place',
            date_from=datetime.now(UTC).date() + timedelta(days=60),
            date_to=datetime.now(UTC).date() + timedelta(days=67),
            number_of_people=3,
            key_ideas=None,
        )

        updated_note = Note(
            id=sample_note.id,
            user_id=sample_note.user_id,
            title=update_dto.title,
            place=update_dto.place,
            date_from=update_dto.date_from,
            date_to=update_dto.date_to,
            number_of_people=update_dto.number_of_people,
            key_ideas=None,
            created_at=sample_note.created_at,
            updated_at=datetime.now(UTC),
        )

        mock_note_repository.get_by_id.return_value = sample_note
        mock_note_repository.update_note_fields.return_value = updated_note

        # Act
        result = await update_note_use_case.execute(update_dto)

        # Assert
        assert isinstance(result, UpdateNoteOutDTO)
        assert result.key_ideas is None

        # Verify repository methods were called correctly
        mock_note_repository.update_note_fields.assert_called_once_with(
            note=sample_note,
            title=update_dto.title,
            place=update_dto.place,
            date_from=update_dto.date_from,
            date_to=update_dto.date_to,
            number_of_people=update_dto.number_of_people,
            key_ideas=None,
        )

    @pytest.mark.asyncio
    async def test_execute_note_not_found(
        self,
        update_note_use_case: UpdateNoteUseCase,
        mock_note_repository: AsyncMock,
        sample_update_dto: UpdateNoteInDTO,
    ):
        """Test that NoteNotFoundError is raised when note doesn't exist."""
        # Arrange
        mock_note_repository.get_by_id.side_effect = NoteNotFoundError(note_id=sample_update_dto.id)

        # Act & Assert
        with pytest.raises(NoteNotFoundError, match=f'Note with ID {sample_update_dto.id} not found'):
            await update_note_use_case.execute(sample_update_dto)

        # Verify get_by_id was called but update_note_fields was not
        mock_note_repository.get_by_id.assert_called_once_with(
            note_id=sample_update_dto.id,
            user_id=sample_update_dto.user_id,
            for_update=True,
        )
        mock_note_repository.update_note_fields.assert_not_called()

    @pytest.mark.asyncio
    async def test_execute_title_conflict(
        self,
        update_note_use_case: UpdateNoteUseCase,
        mock_note_repository: AsyncMock,
        sample_note: Note,
        sample_update_dto: UpdateNoteInDTO,
    ):
        """Test that NoteTitleConflictError is raised on title conflict."""
        # Arrange
        mock_note_repository.get_by_id.return_value = sample_note
        mock_note_repository.update_note_fields.side_effect = NoteTitleConflictError(
            title=sample_update_dto.title,
            user_id=sample_update_dto.user_id,
        )

        # Act & Assert
        with pytest.raises(NoteTitleConflictError):
            await update_note_use_case.execute(sample_update_dto)

        # Verify both repository methods were called
        mock_note_repository.get_by_id.assert_called_once_with(
            note_id=sample_update_dto.id,
            user_id=sample_update_dto.user_id,
            for_update=True,
        )
        mock_note_repository.update_note_fields.assert_called_once_with(
            note=sample_note,
            title=sample_update_dto.title,
            place=sample_update_dto.place,
            date_from=sample_update_dto.date_from,
            date_to=sample_update_dto.date_to,
            number_of_people=sample_update_dto.number_of_people,
            key_ideas=sample_update_dto.key_ideas,
        )

    @pytest.mark.asyncio
    async def test_execute_uses_for_update_lock(
        self,
        update_note_use_case: UpdateNoteUseCase,
        mock_note_repository: AsyncMock,
        sample_note: Note,
        sample_update_dto: UpdateNoteInDTO,
    ):
        """Test that the use case requests a for_update lock when getting the note."""
        # Arrange
        updated_note = Note(
            id=sample_note.id,
            user_id=sample_note.user_id,
            title=sample_update_dto.title,
            place=sample_update_dto.place,
            date_from=sample_update_dto.date_from,
            date_to=sample_update_dto.date_to,
            number_of_people=sample_update_dto.number_of_people,
            key_ideas=sample_update_dto.key_ideas,
            created_at=sample_note.created_at,
            updated_at=datetime.now(UTC),
        )

        mock_note_repository.get_by_id.return_value = sample_note
        mock_note_repository.update_note_fields.return_value = updated_note

        # Act
        await update_note_use_case.execute(sample_update_dto)

        # Assert
        # Verify that for_update=True was passed to get_by_id
        mock_note_repository.get_by_id.assert_called_once_with(
            note_id=sample_update_dto.id,
            user_id=sample_update_dto.user_id,
            for_update=True,
        )

    @pytest.mark.asyncio
    async def test_execute_unexpected_repository_exception(
        self,
        update_note_use_case: UpdateNoteUseCase,
        mock_note_repository: AsyncMock,
        sample_note: Note,
        sample_update_dto: UpdateNoteInDTO,
    ):
        """Test that unexpected exceptions from repository are propagated."""
        # Arrange
        mock_note_repository.get_by_id.return_value = sample_note
        unexpected_error = Exception('Database connection lost')
        mock_note_repository.update_note_fields.side_effect = unexpected_error

        # Act & Assert
        with pytest.raises(Exception, match='Database connection lost'):
            await update_note_use_case.execute(sample_update_dto)

        # Verify both repository methods were called
        mock_note_repository.get_by_id.assert_called_once()
        mock_note_repository.update_note_fields.assert_called_once()

    @pytest.mark.asyncio
    async def test_execute_dto_transformation_completeness(
        self,
        update_note_use_case: UpdateNoteUseCase,
        mock_note_repository: AsyncMock,
        sample_user_id: uuid.UUID,
    ):
        """Test that all fields are correctly transformed between DTOs and models."""
        # Arrange
        original_note = Note(
            id=42,
            user_id=sample_user_id,
            title='Original',
            place='Original Place',
            date_from=date(2025, 1, 1),
            date_to=date(2025, 1, 5),
            number_of_people=1,
            key_ideas='Original ideas',
            created_at=datetime(2025, 1, 1, 10, 0, 0, tzinfo=UTC),
            updated_at=datetime(2025, 1, 1, 10, 0, 0, tzinfo=UTC),
        )

        update_dto = UpdateNoteInDTO(
            id=42,
            user_id=sample_user_id,
            title='Completely Updated Title',
            place='Completely Updated Place',
            date_from=date(2025, 6, 15),
            date_to=date(2025, 6, 22),
            number_of_people=8,
            key_ideas='Completely updated ideas with special characters: émojis 🌍',
        )

        updated_note = Note(
            id=original_note.id,
            user_id=original_note.user_id,
            title=update_dto.title,
            place=update_dto.place,
            date_from=update_dto.date_from,
            date_to=update_dto.date_to,
            number_of_people=update_dto.number_of_people,
            key_ideas=update_dto.key_ideas,
            created_at=original_note.created_at,
            updated_at=datetime(2025, 6, 1, 15, 30, 45, tzinfo=UTC),
        )

        mock_note_repository.get_by_id.return_value = original_note
        mock_note_repository.update_note_fields.return_value = updated_note

        # Act
        result = await update_note_use_case.execute(update_dto)

        # Assert
        # Verify all DTO fields match exactly
        assert result.id == 42
        assert result.user_id == sample_user_id
        assert result.title == 'Completely Updated Title'
        assert result.place == 'Completely Updated Place'
        assert result.date_from == date(2025, 6, 15)
        assert result.date_to == date(2025, 6, 22)
        assert result.number_of_people == 8
        assert result.key_ideas == 'Completely updated ideas with special characters: émojis 🌍'
        assert result.created_at == datetime(2025, 1, 1, 10, 0, 0, tzinfo=UTC)
        assert result.updated_at == datetime(2025, 6, 1, 15, 30, 45, tzinfo=UTC)

        # Verify repository was called with all correct parameters
        mock_note_repository.update_note_fields.assert_called_once_with(
            note=original_note,
            title='Completely Updated Title',
            place='Completely Updated Place',
            date_from=date(2025, 6, 15),
            date_to=date(2025, 6, 22),
            number_of_people=8,
            key_ideas='Completely updated ideas with special characters: émojis 🌍',
        )
