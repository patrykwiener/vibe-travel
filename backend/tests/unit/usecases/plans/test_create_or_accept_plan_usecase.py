"""Unit tests for CreateOrAcceptPlanUseCase."""

import uuid
from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock

import pytest

from src.apps.notes.exceptions import NoteNotFoundError
from src.apps.notes.models.note import Note
from src.apps.notes.repositories.note_repository import NoteRepository
from src.apps.plans.enums import PlanStatusEnum, PlanTypeEnum
from src.apps.plans.exceptions import PlanConflictError
from src.apps.plans.models.plan import Plan
from src.apps.plans.repositories.plan_repository import PlanRepository
from src.apps.plans.usecases.create_or_accept_plan_usecase import CreateOrAcceptPlanUseCase
from src.apps.plans.usecases.dto.plan_dtos import PlanCreateInDTO, PlanCreateOutDTO
from src.apps.plans.usecases.strategies.create_plan_strategies import (
    AcceptAIPlanStrategy,
    CreateHybridPlanStrategy,
    CreateManualPlanStrategy,
)


@pytest.mark.unit
class TestCreateOrAcceptPlanUseCase:
    """Test cases for CreateOrAcceptPlanUseCase."""

    @pytest.fixture
    def mock_plan_repository(self):
        """Create a mock plan repository."""
        return AsyncMock(spec=PlanRepository)

    @pytest.fixture
    def mock_note_repository(self):
        """Create a mock note repository."""
        return AsyncMock(spec=NoteRepository)

    @pytest.fixture
    def create_or_accept_plan_use_case(self, mock_plan_repository, mock_note_repository):
        """Create a CreateOrAcceptPlanUseCase instance with mocked dependencies."""
        return CreateOrAcceptPlanUseCase(
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
    def sample_plan_text(self):
        """Sample plan text for testing."""
        return 'Sample travel plan with detailed itinerary'

    @pytest.fixture
    def sample_note(self, sample_note_id, sample_user_id):
        """Create a sample note for testing."""
        return Note(
            id=sample_note_id,
            user_id=sample_user_id,
            title='Trip to Tokyo',
            place='Tokyo, Japan',
            date_from=datetime.now(UTC).date() + timedelta(days=30),
            date_to=datetime.now(UTC).date() + timedelta(days=37),
            number_of_people=2,
            key_ideas='Temples, sushi, cherry blossoms',
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

    @pytest.fixture
    def sample_plan(self, sample_note_id, sample_generation_id, sample_plan_text):
        """Create a sample plan for testing."""
        return Plan(
            id=1,
            note_id=sample_note_id,
            plan_text=sample_plan_text,
            type=PlanTypeEnum.AI,
            status=PlanStatusEnum.PENDING_AI,  # Changed from ACTIVE to PENDING_AI
            generation_id=sample_generation_id,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

    # Test accept AI plan strategy selection and execution
    @pytest.mark.asyncio
    async def test_execute_accept_ai_plan_success(
        self,
        create_or_accept_plan_use_case,
        mock_plan_repository,
        mock_note_repository,
        sample_user_id,
        sample_note_id,
        sample_generation_id,
        sample_note,
        sample_plan,
    ):
        """Test successful acceptance of AI-generated plan."""
        # Arrange
        input_dto = PlanCreateInDTO(
            note_id=sample_note_id,
            user_id=sample_user_id,
            generation_id=sample_generation_id,
            plan_text=None,
        )

        mock_note_repository.get_by_id.return_value = sample_note
        mock_plan_repository.get_last_updated_by_note_id_and_status.return_value = None

        # Mock the strategy execution through the repository calls
        mock_plan_repository.get_by_generation_id_and_note_id_and_status.return_value = sample_plan
        mock_plan_repository.update_plan.return_value = sample_plan

        # Act
        result = await create_or_accept_plan_use_case.execute(input_dto)

        # Assert
        assert isinstance(result, PlanCreateOutDTO)
        assert result.id == sample_plan.id
        assert result.note_id == sample_plan.note_id
        assert result.plan_text == sample_plan.plan_text
        assert result.type == sample_plan.type
        assert result.status == sample_plan.status
        assert result.generation_id == sample_plan.generation_id

        # Verify repository calls
        mock_note_repository.get_by_id.assert_called_once_with(
            note_id=sample_note_id,
            user_id=sample_user_id,
        )
        mock_plan_repository.get_by_generation_id_and_note_id_and_status.assert_called_once_with(
            generation_id=sample_generation_id,
            note_id=sample_note_id,
            status=PlanStatusEnum.PENDING_AI,
            for_update=True,
        )

    @pytest.mark.asyncio
    async def test_execute_create_hybrid_plan_success(
        self,
        create_or_accept_plan_use_case,
        mock_plan_repository,
        mock_note_repository,
        sample_user_id,
        sample_note_id,
        sample_generation_id,
        sample_plan_text,
        sample_note,
    ):
        """Test successful creation of hybrid plan."""
        # Arrange
        input_dto = PlanCreateInDTO(
            note_id=sample_note_id,
            user_id=sample_user_id,
            generation_id=sample_generation_id,
            plan_text=sample_plan_text,
        )

        hybrid_plan = Plan(
            id=2,
            note_id=sample_note_id,
            plan_text='Original AI generated plan text',  # Start with original AI text
            type=PlanTypeEnum.AI,
            status=PlanStatusEnum.PENDING_AI,  # Start as PENDING_AI
            generation_id=sample_generation_id,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

        # The returned plan after update should be hybrid
        hybrid_plan_after_update = Plan(
            id=2,
            note_id=sample_note_id,
            plan_text=sample_plan_text,
            type=PlanTypeEnum.HYBRID,
            status=PlanStatusEnum.ACTIVE,
            generation_id=sample_generation_id,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

        mock_note_repository.get_by_id.return_value = sample_note
        mock_plan_repository.get_last_updated_by_note_id_and_status.return_value = None
        mock_plan_repository.get_by_generation_id_and_note_id_and_status.return_value = hybrid_plan
        mock_plan_repository.update_plan.return_value = hybrid_plan_after_update

        # Act
        result = await create_or_accept_plan_use_case.execute(input_dto)

        # Assert
        assert isinstance(result, PlanCreateOutDTO)
        assert result.type == PlanTypeEnum.HYBRID
        assert result.plan_text == sample_plan_text
        assert result.generation_id == sample_generation_id

        mock_note_repository.get_by_id.assert_called_once_with(
            note_id=sample_note_id,
            user_id=sample_user_id,
        )

    @pytest.mark.asyncio
    async def test_execute_create_manual_plan_success(
        self,
        create_or_accept_plan_use_case,
        mock_plan_repository,
        mock_note_repository,
        sample_user_id,
        sample_note_id,
        sample_plan_text,
        sample_note,
    ):
        """Test successful creation of manual plan."""
        # Arrange
        input_dto = PlanCreateInDTO(
            note_id=sample_note_id,
            user_id=sample_user_id,
            generation_id=None,
            plan_text=sample_plan_text,
        )

        manual_plan = Plan(
            id=3,
            note_id=sample_note_id,
            plan_text=sample_plan_text,
            type=PlanTypeEnum.MANUAL,
            status=PlanStatusEnum.ACTIVE,
            generation_id=uuid.uuid4(),
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

        mock_note_repository.get_by_id.return_value = sample_note
        mock_plan_repository.get_last_updated_by_note_id_and_status.return_value = None
        mock_plan_repository.create.return_value = manual_plan

        # Act
        result = await create_or_accept_plan_use_case.execute(input_dto)

        # Assert
        assert isinstance(result, PlanCreateOutDTO)
        assert result.type == PlanTypeEnum.MANUAL
        assert result.plan_text == sample_plan_text
        assert result.generation_id == manual_plan.generation_id

        mock_note_repository.get_by_id.assert_called_once_with(
            note_id=sample_note_id,
            user_id=sample_user_id,
        )
        mock_plan_repository.create.assert_called_once()

    @pytest.mark.asyncio
    async def test_execute_note_not_found(
        self,
        create_or_accept_plan_use_case,
        mock_plan_repository,
        mock_note_repository,
        sample_user_id,
        sample_note_id,
        sample_plan_text,
    ):
        """Test execution when note is not found."""
        # Arrange
        input_dto = PlanCreateInDTO(
            note_id=sample_note_id,
            user_id=sample_user_id,
            generation_id=None,
            plan_text=sample_plan_text,
        )

        mock_note_repository.get_by_id.side_effect = NoteNotFoundError(
            note_id=sample_note_id,
        )

        # Act & Assert
        with pytest.raises(NoteNotFoundError) as exc_info:
            await create_or_accept_plan_use_case.execute(input_dto)

        assert exc_info.value.note_id == sample_note_id

        # Verify no plan operations were attempted
        mock_plan_repository.create.assert_not_called()
        mock_plan_repository.update_plan.assert_not_called()

    @pytest.mark.asyncio
    async def test_execute_active_plan_conflict(
        self,
        create_or_accept_plan_use_case,
        mock_plan_repository,
        mock_note_repository,
        sample_user_id,
        sample_note_id,
        sample_plan_text,
        sample_note,
    ):
        """Test execution when active plan already exists."""
        # Arrange
        input_dto = PlanCreateInDTO(
            note_id=sample_note_id,
            user_id=sample_user_id,
            generation_id=None,  # Manual plan creation
            plan_text=sample_plan_text,
        )

        existing_active_plan = Plan(
            id=999,
            note_id=sample_note_id,
            plan_text='Existing active plan',
            type=PlanTypeEnum.MANUAL,
            status=PlanStatusEnum.ACTIVE,
            generation_id=uuid.uuid4(),
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

        mock_note_repository.get_by_id.return_value = sample_note
        mock_plan_repository.get_last_updated_by_note_id_and_status.return_value = existing_active_plan

        # Act & Assert
        with pytest.raises(PlanConflictError) as exc_info:
            await create_or_accept_plan_use_case.execute(input_dto)

        assert exc_info.value.note_id == sample_note_id

        # Verify no plan creation was attempted
        mock_plan_repository.create.assert_not_called()
        mock_plan_repository.update_plan.assert_not_called()

    @pytest.mark.asyncio
    async def test_execute_no_conflict_check_for_generation_id(
        self,
        create_or_accept_plan_use_case,
        mock_plan_repository,
        mock_note_repository,
        sample_user_id,
        sample_note_id,
        sample_generation_id,
        sample_note,
        sample_plan,
    ):
        """Test that conflict check is skipped when generation_id is provided."""
        # Arrange
        input_dto = PlanCreateInDTO(
            note_id=sample_note_id,
            user_id=sample_user_id,
            generation_id=sample_generation_id,
            plan_text=None,
        )

        mock_note_repository.get_by_id.return_value = sample_note
        mock_plan_repository.get_by_generation_id_and_note_id_and_status.return_value = sample_plan
        mock_plan_repository.update_plan.return_value = sample_plan

        # Act
        result = await create_or_accept_plan_use_case.execute(input_dto)

        # Assert
        assert isinstance(result, PlanCreateOutDTO)

        # Verify that active plan check was NOT called when generation_id is provided
        mock_plan_repository.get_last_updated_by_note_id_and_status.assert_not_called()

    @pytest.mark.asyncio
    async def test_execute_manual_plan_missing_text_error(
        self,
        create_or_accept_plan_use_case,
        mock_plan_repository,
        mock_note_repository,
        sample_user_id,
        sample_note_id,
        sample_note,
    ):
        """Test error when manual plan is created without plan_text."""
        # Arrange
        input_dto = PlanCreateInDTO(
            note_id=sample_note_id,
            user_id=sample_user_id,
            generation_id=None,
            plan_text=None,  # Missing text for manual plan
        )

        mock_note_repository.get_by_id.return_value = sample_note
        mock_plan_repository.get_last_updated_by_note_id_and_status.return_value = None

        # Act & Assert
        with pytest.raises(ValueError, match='plan_text must be provided for manual plans') as exc_info:
            await create_or_accept_plan_use_case.execute(input_dto)

        assert 'plan_text must be provided for manual plans' in str(exc_info.value)

        # Verify no plan operations were attempted
        mock_plan_repository.create.assert_not_called()
        mock_plan_repository.update_plan.assert_not_called()

    @pytest.mark.asyncio
    async def test_strategy_selection_accept_ai(
        self,
        create_or_accept_plan_use_case,
        sample_generation_id,
    ):
        """Test strategy selection for accepting AI plan."""
        # Arrange
        input_dto = PlanCreateInDTO(
            note_id=123,
            user_id=uuid.uuid4(),
            generation_id=sample_generation_id,
            plan_text=None,
        )

        # Act
        strategy = create_or_accept_plan_use_case._select_strategy(input_dto)

        # Assert
        assert isinstance(strategy, AcceptAIPlanStrategy)

    @pytest.mark.asyncio
    async def test_strategy_selection_create_hybrid(
        self,
        create_or_accept_plan_use_case,
        sample_generation_id,
    ):
        """Test strategy selection for creating hybrid plan."""
        # Arrange
        input_dto = PlanCreateInDTO(
            note_id=123,
            user_id=uuid.uuid4(),
            generation_id=sample_generation_id,
            plan_text='Modified plan text',
        )

        # Act
        strategy = create_or_accept_plan_use_case._select_strategy(input_dto)

        # Assert
        assert isinstance(strategy, CreateHybridPlanStrategy)

    @pytest.mark.asyncio
    async def test_strategy_selection_create_manual(
        self,
        create_or_accept_plan_use_case,
    ):
        """Test strategy selection for creating manual plan."""
        # Arrange
        input_dto = PlanCreateInDTO(
            note_id=123,
            user_id=uuid.uuid4(),
            generation_id=None,
            plan_text='Manual plan text',
        )

        # Act
        strategy = create_or_accept_plan_use_case._select_strategy(input_dto)

        # Assert
        assert isinstance(strategy, CreateManualPlanStrategy)

    @pytest.mark.asyncio
    async def test_strategy_selection_manual_without_text_error(
        self,
        create_or_accept_plan_use_case,
    ):
        """Test error when selecting manual strategy without plan_text."""
        # Arrange
        input_dto = PlanCreateInDTO(
            note_id=123,
            user_id=uuid.uuid4(),
            generation_id=None,
            plan_text=None,
        )

        # Act & Assert
        with pytest.raises(ValueError, match='plan_text must be provided for manual plans') as exc_info:
            create_or_accept_plan_use_case._select_strategy(input_dto)

        assert 'plan_text must be provided for manual plans' in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_to_dto_conversion(
        self,
        create_or_accept_plan_use_case,
        sample_plan,
    ):
        """Test conversion from Plan model to PlanCreateOutDTO."""
        # Act
        result = create_or_accept_plan_use_case._to_dto(sample_plan)

        # Assert
        assert isinstance(result, PlanCreateOutDTO)
        assert result.id == sample_plan.id
        assert result.note_id == sample_plan.note_id
        assert result.plan_text == sample_plan.plan_text
        assert result.type == sample_plan.type
        assert result.status == sample_plan.status
        assert result.generation_id == sample_plan.generation_id
        assert result.created_at == sample_plan.created_at
        assert result.updated_at == sample_plan.updated_at

    @pytest.mark.asyncio
    async def test_execute_with_special_characters_in_plan_text(
        self,
        create_or_accept_plan_use_case,
        mock_plan_repository,
        mock_note_repository,
        sample_user_id,
        sample_note_id,
        sample_note,
    ):
        """Test execution with special characters in plan text."""
        # Arrange
        special_plan_text = '🌍 Plan with émojis and açcénts! @#$%^&*() 测试 计划 🚀'
        input_dto = PlanCreateInDTO(
            note_id=sample_note_id,
            user_id=sample_user_id,
            generation_id=None,
            plan_text=special_plan_text,
        )

        manual_plan = Plan(
            id=4,
            note_id=sample_note_id,
            plan_text=special_plan_text,
            type=PlanTypeEnum.MANUAL,
            status=PlanStatusEnum.ACTIVE,
            generation_id=uuid.uuid4(),
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

        mock_note_repository.get_by_id.return_value = sample_note
        mock_plan_repository.get_last_updated_by_note_id_and_status.return_value = None
        mock_plan_repository.create.return_value = manual_plan

        # Act
        result = await create_or_accept_plan_use_case.execute(input_dto)

        # Assert
        assert result.plan_text == special_plan_text

    @pytest.mark.asyncio
    async def test_execute_repository_error_propagation(
        self,
        create_or_accept_plan_use_case,
        mock_plan_repository,
        mock_note_repository,
        sample_user_id,
        sample_note_id,
        sample_generation_id,
        sample_note,
    ):
        """Test that repository errors are properly propagated."""
        # Arrange
        input_dto = PlanCreateInDTO(
            note_id=sample_note_id,
            user_id=sample_user_id,
            generation_id=sample_generation_id,
            plan_text=None,
        )

        mock_note_repository.get_by_id.return_value = sample_note
        mock_plan_repository.get_last_updated_by_note_id_and_status.return_value = None

        unexpected_error = Exception('Unexpected database error')
        mock_plan_repository.get_by_generation_id_and_note_id_and_status.side_effect = unexpected_error

        # Act & Assert
        with pytest.raises(Exception) as exc_info:  # noqa: PT011
            await create_or_accept_plan_use_case.execute(input_dto)

        assert exc_info.value == unexpected_error

    @pytest.mark.parametrize(
        ('user_id', 'note_id', 'generation_id', 'plan_text', 'expected_strategy'),
        [
            (uuid.uuid4(), 1, uuid.uuid4(), None, AcceptAIPlanStrategy),
            (uuid.uuid4(), 2, uuid.uuid4(), 'Modified text', CreateHybridPlanStrategy),
            (uuid.uuid4(), 3, None, 'Manual text', CreateManualPlanStrategy),
        ],
    )
    @pytest.mark.asyncio
    async def test_execute_strategy_selection_parametrized(
        self,
        create_or_accept_plan_use_case,
        user_id,
        note_id,
        generation_id,
        plan_text,
        expected_strategy,
    ):
        """Test strategy selection with various parameter combinations."""
        # Arrange
        input_dto = PlanCreateInDTO(
            note_id=note_id,
            user_id=user_id,
            generation_id=generation_id,
            plan_text=plan_text,
        )

        # Act
        strategy = create_or_accept_plan_use_case._select_strategy(input_dto)

        # Assert
        assert isinstance(strategy, expected_strategy)

    @pytest.mark.asyncio
    async def test_execute_dto_field_completeness(
        self,
        create_or_accept_plan_use_case,
        mock_plan_repository,
        mock_note_repository,
        sample_user_id,
        sample_note_id,
        sample_plan_text,
        sample_note,
    ):
        """Test that all DTO fields are properly populated."""
        # Arrange
        input_dto = PlanCreateInDTO(
            note_id=sample_note_id,
            user_id=sample_user_id,
            generation_id=None,
            plan_text=sample_plan_text,
        )

        manual_plan = Plan(
            id=5,
            note_id=sample_note_id,
            plan_text=sample_plan_text,
            type=PlanTypeEnum.MANUAL,
            status=PlanStatusEnum.ACTIVE,
            generation_id=uuid.uuid4(),
            created_at=datetime(2025, 6, 15, 10, 30, 45, tzinfo=UTC),
            updated_at=datetime(2025, 6, 15, 11, 45, 30, tzinfo=UTC),
        )

        mock_note_repository.get_by_id.return_value = sample_note
        mock_plan_repository.get_last_updated_by_note_id_and_status.return_value = None
        mock_plan_repository.create.return_value = manual_plan

        # Act
        result = await create_or_accept_plan_use_case.execute(input_dto)

        # Assert - Verify all fields are present and correctly typed
        assert isinstance(result, PlanCreateOutDTO)
        assert isinstance(result.id, int)
        assert isinstance(result.note_id, int)
        assert isinstance(result.plan_text, str)
        assert isinstance(result.type, PlanTypeEnum)
        assert isinstance(result.status, PlanStatusEnum)
        assert isinstance(result.generation_id, uuid.UUID)
        assert isinstance(result.created_at, datetime)
        assert isinstance(result.updated_at, datetime)

        # Verify specific values
        assert result.id == 5
        assert result.note_id == sample_note_id
        assert result.plan_text == sample_plan_text
        assert result.type == PlanTypeEnum.MANUAL
        assert result.status == PlanStatusEnum.ACTIVE
        assert result.created_at == datetime(2025, 6, 15, 10, 30, 45, tzinfo=UTC)
        assert result.updated_at == datetime(2025, 6, 15, 11, 45, 30, tzinfo=UTC)

    @pytest.mark.asyncio
    async def test_validate_note_exists_success(
        self,
        create_or_accept_plan_use_case,
        mock_note_repository,
        sample_user_id,
        sample_note_id,
        sample_note,
    ):
        """Test successful note validation."""
        # Arrange
        mock_note_repository.get_by_id.return_value = sample_note

        # Act - This should not raise an exception
        await create_or_accept_plan_use_case._validate_note_exists(
            note_id=sample_note_id,
            user_id=sample_user_id,
        )

        # Assert
        mock_note_repository.get_by_id.assert_called_once_with(
            note_id=sample_note_id,
            user_id=sample_user_id,
        )

    @pytest.mark.asyncio
    async def test_validate_note_exists_not_found(
        self,
        create_or_accept_plan_use_case,
        mock_note_repository,
        sample_user_id,
        sample_note_id,
    ):
        """Test note validation when note is not found."""
        # Arrange
        mock_note_repository.get_by_id.side_effect = NoteNotFoundError(
            note_id=sample_note_id,
        )

        # Act & Assert
        with pytest.raises(NoteNotFoundError):
            await create_or_accept_plan_use_case._validate_note_exists(
                note_id=sample_note_id,
                user_id=sample_user_id,
            )

    @pytest.mark.asyncio
    async def test_validate_no_active_plan_conflict_with_generation_id(
        self,
        create_or_accept_plan_use_case,
        mock_plan_repository,
        sample_note_id,
        sample_generation_id,
    ):
        """Test that conflict validation is skipped when generation_id is provided."""
        # Arrange
        input_dto = PlanCreateInDTO(
            note_id=sample_note_id,
            user_id=uuid.uuid4(),
            generation_id=sample_generation_id,
            plan_text=None,
        )

        # Act - This should not raise an exception and should not call repository
        await create_or_accept_plan_use_case._validate_no_active_plan_conflict(input_dto)

        # Assert
        mock_plan_repository.get_last_updated_by_note_id_and_status.assert_not_called()

    @pytest.mark.asyncio
    async def test_validate_no_active_plan_conflict_no_existing_plan(
        self,
        create_or_accept_plan_use_case,
        mock_plan_repository,
        sample_note_id,
    ):
        """Test conflict validation when no active plan exists."""
        # Arrange
        input_dto = PlanCreateInDTO(
            note_id=sample_note_id,
            user_id=uuid.uuid4(),
            generation_id=None,
            plan_text='Manual plan text',
        )

        mock_plan_repository.get_last_updated_by_note_id_and_status.return_value = None

        # Act - This should not raise an exception
        await create_or_accept_plan_use_case._validate_no_active_plan_conflict(input_dto)

        # Assert
        mock_plan_repository.get_last_updated_by_note_id_and_status.assert_called_once_with(
            note_id=sample_note_id,
            status=PlanStatusEnum.ACTIVE,
        )

    @pytest.mark.asyncio
    async def test_validate_no_active_plan_conflict_existing_plan(
        self,
        create_or_accept_plan_use_case,
        mock_plan_repository,
        sample_note_id,
    ):
        """Test conflict validation when active plan already exists."""
        # Arrange
        input_dto = PlanCreateInDTO(
            note_id=sample_note_id,
            user_id=uuid.uuid4(),
            generation_id=None,
            plan_text='Manual plan text',
        )

        existing_plan = Plan(
            id=999,
            note_id=sample_note_id,
            plan_text='Existing plan',
            type=PlanTypeEnum.MANUAL,
            status=PlanStatusEnum.ACTIVE,
            generation_id=uuid.uuid4(),
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

        mock_plan_repository.get_last_updated_by_note_id_and_status.return_value = existing_plan

        # Act & Assert
        with pytest.raises(PlanConflictError) as exc_info:
            await create_or_accept_plan_use_case._validate_no_active_plan_conflict(input_dto)

        assert exc_info.value.note_id == sample_note_id
