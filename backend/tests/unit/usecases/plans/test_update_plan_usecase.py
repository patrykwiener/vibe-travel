"""Unit tests for UpdatePlanUseCase."""

import uuid
from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock

import pytest

from src.apps.notes.exceptions import NoteNotFoundError
from src.apps.notes.models.note import Note
from src.apps.notes.repositories.note_repository import NoteRepository
from src.apps.plans.enums import PlanStatusEnum, PlanTypeEnum
from src.apps.plans.exceptions import ActivePlanNotFoundError
from src.apps.plans.models.plan import Plan
from src.apps.plans.repositories.plan_repository import PlanRepository
from src.apps.plans.usecases.dto.plan_dtos import UpdatePlanInDTO, UpdatePlanOutDTO
from src.apps.plans.usecases.update_plan_usecase import UpdatePlanUseCase


@pytest.mark.unit
class TestUpdatePlanUseCase:
    """Test cases for UpdatePlanUseCase."""

    @pytest.fixture
    def mock_plan_repository(self):
        """Create a mock plan repository."""
        return AsyncMock(spec=PlanRepository)

    @pytest.fixture
    def mock_note_repository(self):
        """Create a mock note repository."""
        return AsyncMock(spec=NoteRepository)

    @pytest.fixture
    def update_plan_use_case(self, mock_plan_repository, mock_note_repository):
        """Create an UpdatePlanUseCase instance with mocked dependencies."""
        return UpdatePlanUseCase(
            plan_repository=mock_plan_repository,
            note_repository=mock_note_repository,
        )

    @pytest.fixture
    def sample_user_id(self):
        """Sample user ID for testing."""
        return uuid.uuid4()

    @pytest.fixture
    def sample_note_id(self):
        """Sample note ID for testing."""
        return 123

    @pytest.fixture
    def sample_generation_id(self):
        """Sample generation ID for testing."""
        return uuid.uuid4()

    @pytest.fixture
    def sample_note(self, sample_note_id, sample_user_id):
        """Create a sample note for testing."""
        return Note(
            id=sample_note_id,
            user_id=sample_user_id,
            title='Trip to Paris',
            place='Paris, France',
            date_from=datetime.now(UTC).date() + timedelta(days=30),
            date_to=datetime.now(UTC).date() + timedelta(days=37),
            number_of_people=2,
            key_ideas='Museums, cafes, Eiffel Tower',
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

    @pytest.fixture
    def sample_active_plan(self, sample_note_id, sample_generation_id):
        """Create a sample active plan for testing."""
        return Plan(
            id=1,
            note_id=sample_note_id,
            plan_text='Original plan text with detailed itinerary',
            type=PlanTypeEnum.AI,
            status=PlanStatusEnum.ACTIVE,
            generation_id=sample_generation_id,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

    @pytest.fixture
    def sample_updated_plan(self, sample_note_id, sample_generation_id):
        """Create a sample updated plan for testing."""
        return Plan(
            id=1,
            note_id=sample_note_id,
            plan_text='Updated plan text with new itinerary',
            type=PlanTypeEnum.HYBRID,
            status=PlanStatusEnum.ACTIVE,
            generation_id=sample_generation_id,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

    @pytest.fixture
    def sample_update_input_dto(self, sample_note_id, sample_user_id):
        """Create a sample update input DTO."""
        return UpdatePlanInDTO(
            note_id=sample_note_id,
            user_id=sample_user_id,
            plan_text='Updated plan text with new itinerary',
        )

    @pytest.mark.asyncio
    async def test_execute_success_ai_to_hybrid(
        self,
        update_plan_use_case,
        mock_plan_repository,
        mock_note_repository,
        sample_update_input_dto,
        sample_note,
        sample_active_plan,
        sample_updated_plan,
    ):
        """Test successful plan update from AI to HYBRID type."""
        # Arrange
        mock_note_repository.get_by_id.return_value = sample_note
        mock_plan_repository.get_last_updated_by_note_id_and_status.return_value = sample_active_plan
        mock_plan_repository.update_plan.return_value = sample_updated_plan

        # Act
        result = await update_plan_use_case.execute(sample_update_input_dto)

        # Assert
        assert isinstance(result, UpdatePlanOutDTO)
        assert result.id == sample_updated_plan.id
        assert result.note_id == sample_updated_plan.note_id
        assert result.plan_text == 'Updated plan text with new itinerary'
        assert result.type == PlanTypeEnum.HYBRID
        assert result.status == PlanStatusEnum.ACTIVE

        # Verify repository calls
        mock_note_repository.get_by_id.assert_called_once_with(
            note_id=sample_update_input_dto.note_id,
            user_id=sample_update_input_dto.user_id,
        )
        mock_plan_repository.get_last_updated_by_note_id_and_status.assert_called_once_with(
            note_id=sample_update_input_dto.note_id,
            status=PlanStatusEnum.ACTIVE,
        )
        mock_plan_repository.update_plan.assert_called_once_with(sample_active_plan)

    @pytest.mark.asyncio
    async def test_execute_success_manual_plan(
        self,
        update_plan_use_case,
        mock_plan_repository,
        mock_note_repository,
        sample_update_input_dto,
        sample_note,
        sample_generation_id,
    ):
        """Test successful update of manual plan."""
        # Arrange
        manual_plan = Plan(
            id=1,
            note_id=sample_update_input_dto.note_id,
            plan_text='Original manual plan',
            type=PlanTypeEnum.MANUAL,
            status=PlanStatusEnum.ACTIVE,
            generation_id=None,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

        updated_manual_plan = Plan(
            id=1,
            note_id=sample_update_input_dto.note_id,
            plan_text='Updated manual plan',
            type=PlanTypeEnum.MANUAL,
            status=PlanStatusEnum.ACTIVE,
            generation_id=None,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

        mock_note_repository.get_by_id.return_value = sample_note
        mock_plan_repository.get_last_updated_by_note_id_and_status.return_value = manual_plan
        mock_plan_repository.update_plan.return_value = updated_manual_plan

        # Act
        result = await update_plan_use_case.execute(sample_update_input_dto)

        # Assert
        assert result.type == PlanTypeEnum.MANUAL
        assert result.plan_text == 'Updated manual plan'

    @pytest.mark.asyncio
    async def test_execute_note_not_found(
        self,
        update_plan_use_case,
        mock_note_repository,
        sample_update_input_dto,
    ):
        """Test error when note doesn't exist."""
        # Arrange
        mock_note_repository.get_by_id.side_effect = NoteNotFoundError(note_id=sample_update_input_dto.note_id)

        # Act & Assert
        with pytest.raises(NoteNotFoundError):
            await update_plan_use_case.execute(sample_update_input_dto)

        mock_note_repository.get_by_id.assert_called_once_with(
            note_id=sample_update_input_dto.note_id,
            user_id=sample_update_input_dto.user_id,
        )

    @pytest.mark.asyncio
    async def test_execute_no_active_plan(
        self,
        update_plan_use_case,
        mock_plan_repository,
        mock_note_repository,
        sample_update_input_dto,
        sample_note,
    ):
        """Test error when no active plan exists."""
        # Arrange
        mock_note_repository.get_by_id.return_value = sample_note
        mock_plan_repository.get_last_updated_by_note_id_and_status.return_value = None

        # Act & Assert
        with pytest.raises(ActivePlanNotFoundError) as exc_info:
            await update_plan_use_case.execute(sample_update_input_dto)

        assert exc_info.value.note_id == sample_update_input_dto.note_id

    @pytest.mark.asyncio
    async def test_verify_note_exists_success(
        self,
        update_plan_use_case,
        mock_note_repository,
        sample_note_id,
        sample_user_id,
        sample_note,
    ):
        """Test successful note verification."""
        # Arrange
        mock_note_repository.get_by_id.return_value = sample_note

        # Act & Assert - should not raise
        await update_plan_use_case._verify_note_exists(
            note_id=sample_note_id,
            user_id=sample_user_id,
        )

        mock_note_repository.get_by_id.assert_called_once_with(
            note_id=sample_note_id,
            user_id=sample_user_id,
        )

    @pytest.mark.asyncio
    async def test_verify_note_exists_not_found(
        self,
        update_plan_use_case,
        mock_note_repository,
        sample_note_id,
        sample_user_id,
    ):
        """Test note verification when note doesn't exist."""
        # Arrange
        mock_note_repository.get_by_id.side_effect = NoteNotFoundError(note_id=sample_note_id)

        # Act & Assert
        with pytest.raises(NoteNotFoundError):
            await update_plan_use_case._verify_note_exists(
                note_id=sample_note_id,
                user_id=sample_user_id,
            )

    @pytest.mark.asyncio
    async def test_fetch_active_plan_success(
        self,
        update_plan_use_case,
        mock_plan_repository,
        sample_note_id,
        sample_active_plan,
    ):
        """Test successful active plan fetching."""
        # Arrange
        mock_plan_repository.get_last_updated_by_note_id_and_status.return_value = sample_active_plan

        # Act
        result = await update_plan_use_case._fetch_active_plan(note_id=sample_note_id)

        # Assert
        assert result == sample_active_plan
        mock_plan_repository.get_last_updated_by_note_id_and_status.assert_called_once_with(
            note_id=sample_note_id,
            status=PlanStatusEnum.ACTIVE,
        )

    @pytest.mark.asyncio
    async def test_fetch_active_plan_not_found(
        self,
        update_plan_use_case,
        mock_plan_repository,
        sample_note_id,
    ):
        """Test active plan fetching when no plan exists."""
        # Arrange
        mock_plan_repository.get_last_updated_by_note_id_and_status.return_value = None

        # Act & Assert
        with pytest.raises(ActivePlanNotFoundError) as exc_info:
            await update_plan_use_case._fetch_active_plan(note_id=sample_note_id)

        assert exc_info.value.note_id == sample_note_id

    @pytest.mark.asyncio
    async def test_update_plan_success(
        self,
        update_plan_use_case,
        mock_plan_repository,
        sample_active_plan,
        sample_updated_plan,
    ):
        """Test successful plan update."""
        # Arrange
        new_plan_text = 'Updated plan text'
        mock_plan_repository.update_plan.return_value = sample_updated_plan

        # Act
        result = await update_plan_use_case._update_plan(
            plan=sample_active_plan,
            new_plan_text=new_plan_text,
        )

        # Assert
        assert result == sample_updated_plan
        mock_plan_repository.update_plan.assert_called_once_with(sample_active_plan)

    @pytest.mark.asyncio
    async def test_to_dto_conversion(
        self,
        update_plan_use_case,
        sample_updated_plan,
    ):
        """Test DTO conversion."""
        # Act
        result = update_plan_use_case._to_dto(sample_updated_plan)

        # Assert
        assert isinstance(result, UpdatePlanOutDTO)
        assert result.id == sample_updated_plan.id
        assert result.note_id == sample_updated_plan.note_id
        assert result.plan_text == sample_updated_plan.plan_text
        assert result.type == sample_updated_plan.type
        assert result.status == sample_updated_plan.status
        assert result.generation_id == sample_updated_plan.generation_id
        assert result.created_at == sample_updated_plan.created_at
        assert result.updated_at == sample_updated_plan.updated_at

    @pytest.mark.parametrize(
        ('plan_type', 'new_text', 'expected_type'),
        [
            (PlanTypeEnum.AI, 'New text', PlanTypeEnum.HYBRID),
            (PlanTypeEnum.MANUAL, 'Updated manual text', PlanTypeEnum.MANUAL),
            (PlanTypeEnum.HYBRID, 'Modified hybrid text', PlanTypeEnum.HYBRID),
        ],
    )
    @pytest.mark.asyncio
    async def test_execute_plan_type_transitions(
        self,
        update_plan_use_case,
        mock_plan_repository,
        mock_note_repository,
        sample_note_id,
        sample_user_id,
        sample_note,
        sample_generation_id,
        plan_type,
        new_text,
        expected_type,
    ):
        """Test plan type transitions during updates."""
        # Arrange
        input_dto = UpdatePlanInDTO(
            note_id=sample_note_id,
            user_id=sample_user_id,
            plan_text=new_text,
        )

        original_plan = Plan(
            id=1,
            note_id=sample_note_id,
            plan_text='Original text',
            type=plan_type,
            status=PlanStatusEnum.ACTIVE,
            generation_id=sample_generation_id if plan_type != PlanTypeEnum.MANUAL else None,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

        updated_plan = Plan(
            id=1,
            note_id=sample_note_id,
            plan_text=new_text,
            type=expected_type,
            status=PlanStatusEnum.ACTIVE,
            generation_id=sample_generation_id if expected_type != PlanTypeEnum.MANUAL else None,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

        mock_note_repository.get_by_id.return_value = sample_note
        mock_plan_repository.get_last_updated_by_note_id_and_status.return_value = original_plan
        mock_plan_repository.update_plan.return_value = updated_plan

        # Act
        result = await update_plan_use_case.execute(input_dto)

        # Assert
        assert result.type == expected_type
        assert result.plan_text == new_text

    @pytest.mark.asyncio
    async def test_execute_with_empty_plan_text(
        self,
        update_plan_use_case,
        mock_plan_repository,
        mock_note_repository,
        sample_note_id,
        sample_user_id,
        sample_note,
        sample_active_plan,
    ):
        """Test update with empty plan text."""
        # Arrange
        input_dto = UpdatePlanInDTO(
            note_id=sample_note_id,
            user_id=sample_user_id,
            plan_text='',
        )

        updated_plan = Plan(
            id=1,
            note_id=sample_note_id,
            plan_text='',
            type=PlanTypeEnum.HYBRID,
            status=PlanStatusEnum.ACTIVE,
            generation_id=sample_active_plan.generation_id,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

        mock_note_repository.get_by_id.return_value = sample_note
        mock_plan_repository.get_last_updated_by_note_id_and_status.return_value = sample_active_plan
        mock_plan_repository.update_plan.return_value = updated_plan

        # Act
        result = await update_plan_use_case.execute(input_dto)

        # Assert
        assert result.plan_text == ''

    @pytest.mark.asyncio
    async def test_execute_with_very_long_plan_text(
        self,
        update_plan_use_case,
        mock_plan_repository,
        mock_note_repository,
        sample_note_id,
        sample_user_id,
        sample_note,
        sample_active_plan,
    ):
        """Test update with very long plan text."""
        # Arrange
        long_text = 'Very long plan text. ' * 1000  # 21000 characters
        input_dto = UpdatePlanInDTO(
            note_id=sample_note_id,
            user_id=sample_user_id,
            plan_text=long_text,
        )

        updated_plan = Plan(
            id=1,
            note_id=sample_note_id,
            plan_text=long_text,
            type=PlanTypeEnum.HYBRID,
            status=PlanStatusEnum.ACTIVE,
            generation_id=sample_active_plan.generation_id,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

        mock_note_repository.get_by_id.return_value = sample_note
        mock_plan_repository.get_last_updated_by_note_id_and_status.return_value = sample_active_plan
        mock_plan_repository.update_plan.return_value = updated_plan

        # Act
        result = await update_plan_use_case.execute(input_dto)

        # Assert
        assert result.plan_text == long_text
        assert len(result.plan_text) == 21000

    @pytest.mark.asyncio
    async def test_execute_with_special_characters(
        self,
        update_plan_use_case,
        mock_plan_repository,
        mock_note_repository,
        sample_note_id,
        sample_user_id,
        sample_note,
        sample_active_plan,
    ):
        """Test update with special characters in plan text."""
        # Arrange
        special_text = 'Plan with émojis 🗼 and spëcial çharacters ñ & symbols @#$%'
        input_dto = UpdatePlanInDTO(
            note_id=sample_note_id,
            user_id=sample_user_id,
            plan_text=special_text,
        )

        updated_plan = Plan(
            id=1,
            note_id=sample_note_id,
            plan_text=special_text,
            type=PlanTypeEnum.HYBRID,
            status=PlanStatusEnum.ACTIVE,
            generation_id=sample_active_plan.generation_id,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

        mock_note_repository.get_by_id.return_value = sample_note
        mock_plan_repository.get_last_updated_by_note_id_and_status.return_value = sample_active_plan
        mock_plan_repository.update_plan.return_value = updated_plan

        # Act
        result = await update_plan_use_case.execute(input_dto)

        # Assert
        assert result.plan_text == special_text

    @pytest.mark.asyncio
    async def test_execute_repository_error_propagation(
        self,
        update_plan_use_case,
        mock_plan_repository,
        mock_note_repository,
        sample_update_input_dto,
        sample_note,
        sample_active_plan,
    ):
        """Test that repository errors are properly propagated."""
        # Arrange
        mock_note_repository.get_by_id.return_value = sample_note
        mock_plan_repository.get_last_updated_by_note_id_and_status.return_value = sample_active_plan
        mock_plan_repository.update_plan.side_effect = Exception('Database error')

        # Act & Assert
        with pytest.raises(Exception, match='Database error'):
            await update_plan_use_case.execute(sample_update_input_dto)

    @pytest.mark.asyncio
    async def test_execute_dto_field_completeness(
        self,
        update_plan_use_case,
        mock_plan_repository,
        mock_note_repository,
        sample_update_input_dto,
        sample_note,
        sample_active_plan,
        sample_updated_plan,
    ):
        """Test that all DTO fields are properly populated."""
        # Arrange
        mock_note_repository.get_by_id.return_value = sample_note
        mock_plan_repository.get_last_updated_by_note_id_and_status.return_value = sample_active_plan
        mock_plan_repository.update_plan.return_value = sample_updated_plan

        # Act
        result = await update_plan_use_case.execute(sample_update_input_dto)

        # Assert - verify all fields are present
        assert hasattr(result, 'id')
        assert hasattr(result, 'note_id')
        assert hasattr(result, 'plan_text')
        assert hasattr(result, 'type')
        assert hasattr(result, 'status')
        assert hasattr(result, 'generation_id')
        assert hasattr(result, 'created_at')
        assert hasattr(result, 'updated_at')

        # Verify values are not None (except generation_id which can be)
        assert result.id is not None
        assert result.note_id is not None
        assert result.plan_text is not None
        assert result.type is not None
        assert result.status is not None
        assert result.created_at is not None
        assert result.updated_at is not None
