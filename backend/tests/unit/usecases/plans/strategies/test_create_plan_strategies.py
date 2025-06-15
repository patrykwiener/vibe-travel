"""Unit tests for create plan strategies."""

import uuid
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock

import pytest

from src.apps.plans.enums import PlanStatusEnum, PlanTypeEnum
from src.apps.plans.exceptions import PlanNotFoundError
from src.apps.plans.models.plan import Plan
from src.apps.plans.repositories.plan_repository import PlanRepository
from src.apps.plans.usecases.strategies.create_plan_strategies import (
    AcceptAIPlanStrategy,
    CreateHybridPlanStrategy,
    CreateManualPlanStrategy,
    PlanStrategy,
)


@pytest.mark.unit
class TestPlanStrategyBase:
    """Base test class for testing PlanStrategy abstract class."""

    def test_plan_strategy_is_abstract(self):
        """Test that PlanStrategy cannot be instantiated directly."""
        with pytest.raises(TypeError):
            PlanStrategy(plan_repository=MagicMock())  # type: ignore[abstract]


@pytest.mark.unit
class TestAcceptAIPlanStrategy:
    """Test cases for AcceptAIPlanStrategy."""

    @pytest.fixture
    def mock_plan_repository(self):
        """Create a mock plan repository."""
        return AsyncMock(spec=PlanRepository)

    @pytest.fixture
    def accept_ai_strategy(self, mock_plan_repository):
        """Create an AcceptAIPlanStrategy instance with mocked dependencies."""
        return AcceptAIPlanStrategy(plan_repository=mock_plan_repository)

    @pytest.fixture
    def sample_generation_id(self):
        """Sample generation ID for testing."""
        return uuid.uuid4()

    @pytest.fixture
    def sample_note_id(self):
        """Sample note ID for testing."""
        return 123

    @pytest.fixture
    def sample_pending_ai_plan(self, sample_note_id, sample_generation_id):
        """Create a sample pending AI plan."""
        return Plan(
            id=1,
            note_id=sample_note_id,
            plan_text='Generated AI plan text',
            type=PlanTypeEnum.AI,
            status=PlanStatusEnum.PENDING_AI,
            generation_id=sample_generation_id,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

    @pytest.fixture
    def sample_accepted_ai_plan(self, sample_note_id, sample_generation_id):
        """Create a sample accepted AI plan."""
        return Plan(
            id=1,
            note_id=sample_note_id,
            plan_text='Generated AI plan text',
            type=PlanTypeEnum.AI,
            status=PlanStatusEnum.ACTIVE,
            generation_id=sample_generation_id,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

    @pytest.mark.asyncio
    async def test_execute_success(
        self,
        accept_ai_strategy,
        mock_plan_repository,
        sample_generation_id,
        sample_note_id,
        sample_pending_ai_plan,
        sample_accepted_ai_plan,
    ):
        """Test successful AI plan acceptance."""
        # Arrange
        mock_plan_repository.get_by_generation_id_and_note_id_and_status.return_value = sample_pending_ai_plan
        mock_plan_repository.update_plan.return_value = sample_accepted_ai_plan

        # Act
        result = await accept_ai_strategy.execute(
            note_id=sample_note_id,
            generation_id=sample_generation_id,
        )

        # Assert
        assert result == sample_accepted_ai_plan
        mock_plan_repository.get_by_generation_id_and_note_id_and_status.assert_called_once_with(
            generation_id=sample_generation_id,
            note_id=sample_note_id,
            status=PlanStatusEnum.PENDING_AI,
            for_update=True,
        )
        mock_plan_repository.update_plan.assert_called_once_with(sample_pending_ai_plan)

    @pytest.mark.asyncio
    async def test_execute_plan_not_found(
        self,
        accept_ai_strategy,
        mock_plan_repository,
        sample_generation_id,
        sample_note_id,
    ):
        """Test execution when plan is not found."""
        # Arrange
        mock_plan_repository.get_by_generation_id_and_note_id_and_status.side_effect = PlanNotFoundError(
            generation_id=sample_generation_id,
            note_id=sample_note_id,
        )

        # Act & Assert
        with pytest.raises(PlanNotFoundError) as exc_info:
            await accept_ai_strategy.execute(
                note_id=sample_note_id,
                generation_id=sample_generation_id,
            )

        assert exc_info.value.generation_id == sample_generation_id
        assert exc_info.value.note_id == sample_note_id
        mock_plan_repository.update_plan.assert_not_called()

    @pytest.mark.asyncio
    async def test_execute_with_kwargs(
        self,
        accept_ai_strategy,
        mock_plan_repository,
        sample_generation_id,
        sample_note_id,
        sample_pending_ai_plan,
        sample_accepted_ai_plan,
    ):
        """Test execution with additional kwargs (should be ignored)."""
        # Arrange
        mock_plan_repository.get_by_generation_id_and_note_id_and_status.return_value = sample_pending_ai_plan
        mock_plan_repository.update_plan.return_value = sample_accepted_ai_plan

        # Act
        result = await accept_ai_strategy.execute(
            note_id=sample_note_id,
            generation_id=sample_generation_id,
            plan_text='this should be ignored',
            extra_param='also ignored',
        )

        # Assert
        assert result == sample_accepted_ai_plan
        mock_plan_repository.get_by_generation_id_and_note_id_and_status.assert_called_once()
        mock_plan_repository.update_plan.assert_called_once()

    @pytest.mark.asyncio
    async def test_execute_repository_error_propagation(
        self,
        accept_ai_strategy,
        mock_plan_repository,
        sample_generation_id,
        sample_note_id,
    ):
        """Test that repository errors are properly propagated."""
        # Arrange
        unexpected_error = Exception('Unexpected database error')
        mock_plan_repository.get_by_generation_id_and_note_id_and_status.side_effect = unexpected_error

        # Act & Assert
        with pytest.raises(Exception, match='Unexpected database error') as exc_info:
            await accept_ai_strategy.execute(
                note_id=sample_note_id,
                generation_id=sample_generation_id,
            )

        assert exc_info.value == unexpected_error


@pytest.mark.unit
class TestCreateHybridPlanStrategy:
    """Test cases for CreateHybridPlanStrategy."""

    @pytest.fixture
    def mock_plan_repository(self):
        """Create a mock plan repository."""
        return AsyncMock(spec=PlanRepository)

    @pytest.fixture
    def create_hybrid_strategy(self, mock_plan_repository):
        """Create a CreateHybridPlanStrategy instance with mocked dependencies."""
        return CreateHybridPlanStrategy(plan_repository=mock_plan_repository)

    @pytest.fixture
    def sample_generation_id(self):
        """Sample generation ID for testing."""
        return uuid.uuid4()

    @pytest.fixture
    def sample_note_id(self):
        """Sample note ID for testing."""
        return 456

    @pytest.fixture
    def sample_plan_text(self):
        """Sample plan text for testing."""
        return 'Modified hybrid plan text with user changes'

    @pytest.fixture
    def sample_pending_ai_plan(self, sample_note_id, sample_generation_id):
        """Create a sample pending AI plan."""
        return Plan(
            id=2,
            note_id=sample_note_id,
            plan_text='Original AI generated plan text',
            type=PlanTypeEnum.AI,
            status=PlanStatusEnum.PENDING_AI,
            generation_id=sample_generation_id,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

    @pytest.fixture
    def sample_hybrid_plan(self, sample_note_id, sample_generation_id, sample_plan_text):
        """Create a sample hybrid plan."""
        return Plan(
            id=2,
            note_id=sample_note_id,
            plan_text=sample_plan_text,
            type=PlanTypeEnum.HYBRID,
            status=PlanStatusEnum.ACTIVE,
            generation_id=sample_generation_id,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

    @pytest.mark.asyncio
    async def test_execute_success(
        self,
        create_hybrid_strategy,
        mock_plan_repository,
        sample_generation_id,
        sample_note_id,
        sample_plan_text,
        sample_pending_ai_plan,
        sample_hybrid_plan,
    ):
        """Test successful hybrid plan creation."""
        # Arrange
        mock_plan_repository.get_by_generation_id_and_note_id_and_status.return_value = sample_pending_ai_plan
        mock_plan_repository.update_plan.return_value = sample_hybrid_plan

        # Act
        result = await create_hybrid_strategy.execute(
            note_id=sample_note_id,
            generation_id=sample_generation_id,
            plan_text=sample_plan_text,
        )

        # Assert
        assert result == sample_hybrid_plan
        mock_plan_repository.get_by_generation_id_and_note_id_and_status.assert_called_once_with(
            generation_id=sample_generation_id,
            note_id=sample_note_id,
            status=PlanStatusEnum.PENDING_AI,
            for_update=True,
        )
        mock_plan_repository.update_plan.assert_called_once_with(sample_pending_ai_plan)

    @pytest.mark.asyncio
    async def test_execute_plan_not_found(
        self,
        create_hybrid_strategy,
        mock_plan_repository,
        sample_generation_id,
        sample_note_id,
        sample_plan_text,
    ):
        """Test execution when AI plan is not found."""
        # Arrange
        mock_plan_repository.get_by_generation_id_and_note_id_and_status.side_effect = PlanNotFoundError(
            generation_id=sample_generation_id,
            note_id=sample_note_id,
        )

        # Act & Assert
        with pytest.raises(PlanNotFoundError) as exc_info:
            await create_hybrid_strategy.execute(
                note_id=sample_note_id,
                generation_id=sample_generation_id,
                plan_text=sample_plan_text,
            )

        assert exc_info.value.generation_id == sample_generation_id
        assert exc_info.value.note_id == sample_note_id
        mock_plan_repository.update_plan.assert_not_called()

    @pytest.mark.asyncio
    async def test_execute_with_empty_plan_text(
        self,
        create_hybrid_strategy,
        mock_plan_repository,
        sample_generation_id,
        sample_note_id,
        sample_pending_ai_plan,
        sample_hybrid_plan,
    ):
        """Test execution with empty plan text."""
        # Arrange
        empty_plan_text = ''
        mock_plan_repository.get_by_generation_id_and_note_id_and_status.return_value = sample_pending_ai_plan

        # Update the expected hybrid plan with empty text
        expected_hybrid_plan = Plan(
            id=sample_hybrid_plan.id,
            note_id=sample_hybrid_plan.note_id,
            plan_text=empty_plan_text,
            type=PlanTypeEnum.HYBRID,
            status=PlanStatusEnum.ACTIVE,
            generation_id=sample_hybrid_plan.generation_id,
            created_at=sample_hybrid_plan.created_at,
            updated_at=sample_hybrid_plan.updated_at,
        )
        mock_plan_repository.update_plan.return_value = expected_hybrid_plan

        # Act
        result = await create_hybrid_strategy.execute(
            note_id=sample_note_id,
            generation_id=sample_generation_id,
            plan_text=empty_plan_text,
        )

        # Assert
        assert result == expected_hybrid_plan
        mock_plan_repository.get_by_generation_id_and_note_id_and_status.assert_called_once()
        mock_plan_repository.update_plan.assert_called_once()

    @pytest.mark.asyncio
    async def test_execute_with_special_characters_in_plan_text(
        self,
        create_hybrid_strategy,
        mock_plan_repository,
        sample_generation_id,
        sample_note_id,
        sample_pending_ai_plan,
    ):
        """Test execution with special characters in plan text."""
        # Arrange
        special_plan_text = '🌍 Travel plan with émojis and açcénts! @#$%^&*() 测试 旅行计划 🚀'
        mock_plan_repository.get_by_generation_id_and_note_id_and_status.return_value = sample_pending_ai_plan

        expected_hybrid_plan = Plan(
            id=2,
            note_id=sample_note_id,
            plan_text=special_plan_text,
            type=PlanTypeEnum.HYBRID,
            status=PlanStatusEnum.ACTIVE,
            generation_id=sample_generation_id,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )
        mock_plan_repository.update_plan.return_value = expected_hybrid_plan

        # Act
        result = await create_hybrid_strategy.execute(
            note_id=sample_note_id,
            generation_id=sample_generation_id,
            plan_text=special_plan_text,
        )

        # Assert
        assert result == expected_hybrid_plan
        assert result.plan_text == special_plan_text

    @pytest.mark.asyncio
    async def test_execute_with_kwargs(
        self,
        create_hybrid_strategy,
        mock_plan_repository,
        sample_generation_id,
        sample_note_id,
        sample_plan_text,
        sample_pending_ai_plan,
        sample_hybrid_plan,
    ):
        """Test execution with additional kwargs (should be ignored)."""
        # Arrange
        mock_plan_repository.get_by_generation_id_and_note_id_and_status.return_value = sample_pending_ai_plan
        mock_plan_repository.update_plan.return_value = sample_hybrid_plan

        # Act
        result = await create_hybrid_strategy.execute(
            note_id=sample_note_id,
            generation_id=sample_generation_id,
            plan_text=sample_plan_text,
            extra_param='should be ignored',
        )

        # Assert
        assert result == sample_hybrid_plan
        mock_plan_repository.get_by_generation_id_and_note_id_and_status.assert_called_once()
        mock_plan_repository.update_plan.assert_called_once()


@pytest.mark.unit
class TestCreateManualPlanStrategy:
    """Test cases for CreateManualPlanStrategy."""

    @pytest.fixture
    def mock_plan_repository(self):
        """Create a mock plan repository."""
        return AsyncMock(spec=PlanRepository)

    @pytest.fixture
    def create_manual_strategy(self, mock_plan_repository):
        """Create a CreateManualPlanStrategy instance with mocked dependencies."""
        return CreateManualPlanStrategy(plan_repository=mock_plan_repository)

    @pytest.fixture
    def sample_note_id(self):
        """Sample note ID for testing."""
        return 789

    @pytest.fixture
    def sample_plan_text(self):
        """Sample plan text for testing."""
        return 'Manually created travel plan with custom details'

    @pytest.fixture
    def sample_manual_plan(self, sample_note_id, sample_plan_text):
        """Create a sample manual plan."""
        return Plan(
            id=3,
            note_id=sample_note_id,
            plan_text=sample_plan_text,
            type=PlanTypeEnum.MANUAL,
            status=PlanStatusEnum.ACTIVE,
            generation_id=uuid.uuid4(),
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

    @pytest.mark.asyncio
    async def test_execute_success(
        self,
        create_manual_strategy,
        mock_plan_repository,
        sample_note_id,
        sample_plan_text,
        sample_manual_plan,
    ):
        """Test successful manual plan creation."""
        # Arrange
        mock_plan_repository.create.return_value = sample_manual_plan

        # Act
        result = await create_manual_strategy.execute(
            note_id=sample_note_id,
            plan_text=sample_plan_text,
        )

        # Assert
        assert result == sample_manual_plan
        mock_plan_repository.create.assert_called_once()

        # Verify the plan passed to create has correct properties
        call_args = mock_plan_repository.create.call_args[1]['plan']
        assert call_args.note_id == sample_note_id
        assert call_args.plan_text == sample_plan_text
        assert call_args.type == PlanTypeEnum.MANUAL
        assert call_args.status == PlanStatusEnum.ACTIVE

    @pytest.mark.asyncio
    async def test_execute_with_empty_plan_text(
        self,
        create_manual_strategy,
        mock_plan_repository,
        sample_note_id,
    ):
        """Test execution with empty plan text."""
        # Arrange
        empty_plan_text = ''
        expected_manual_plan = Plan(
            id=4,
            note_id=sample_note_id,
            plan_text=empty_plan_text,
            type=PlanTypeEnum.MANUAL,
            status=PlanStatusEnum.ACTIVE,
            generation_id=uuid.uuid4(),
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )
        mock_plan_repository.create.return_value = expected_manual_plan

        # Act
        result = await create_manual_strategy.execute(
            note_id=sample_note_id,
            plan_text=empty_plan_text,
        )

        # Assert
        assert result == expected_manual_plan
        assert result.plan_text == empty_plan_text
        mock_plan_repository.create.assert_called_once()

    @pytest.mark.asyncio
    async def test_execute_with_long_plan_text(
        self,
        create_manual_strategy,
        mock_plan_repository,
        sample_note_id,
    ):
        """Test execution with very long plan text."""
        # Arrange
        long_plan_text = 'A' * 10000  # Very long text
        expected_manual_plan = Plan(
            id=5,
            note_id=sample_note_id,
            plan_text=long_plan_text,
            type=PlanTypeEnum.MANUAL,
            status=PlanStatusEnum.ACTIVE,
            generation_id=uuid.uuid4(),
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )
        mock_plan_repository.create.return_value = expected_manual_plan

        # Act
        result = await create_manual_strategy.execute(
            note_id=sample_note_id,
            plan_text=long_plan_text,
        )

        # Assert
        assert result == expected_manual_plan
        assert len(result.plan_text) == 10000
        mock_plan_repository.create.assert_called_once()

    @pytest.mark.asyncio
    async def test_execute_with_special_characters_in_plan_text(
        self,
        create_manual_strategy,
        mock_plan_repository,
        sample_note_id,
    ):
        """Test execution with special characters in plan text."""
        # Arrange
        special_plan_text = '🌍 Manual plan with émojis and açcénts! @#$%^&*() 测试 手动计划 🚀'
        expected_manual_plan = Plan(
            id=6,
            note_id=sample_note_id,
            plan_text=special_plan_text,
            type=PlanTypeEnum.MANUAL,
            status=PlanStatusEnum.ACTIVE,
            generation_id=uuid.uuid4(),
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )
        mock_plan_repository.create.return_value = expected_manual_plan

        # Act
        result = await create_manual_strategy.execute(
            note_id=sample_note_id,
            plan_text=special_plan_text,
        )

        # Assert
        assert result == expected_manual_plan
        assert result.plan_text == special_plan_text

    @pytest.mark.asyncio
    async def test_execute_with_kwargs(
        self,
        create_manual_strategy,
        mock_plan_repository,
        sample_note_id,
        sample_plan_text,
        sample_manual_plan,
    ):
        """Test execution with additional kwargs (should be ignored)."""
        # Arrange
        mock_plan_repository.create.return_value = sample_manual_plan

        # Act
        result = await create_manual_strategy.execute(
            note_id=sample_note_id,
            plan_text=sample_plan_text,
            generation_id=uuid.uuid4(),  # Should be ignored for manual plans
            extra_param='also ignored',
        )

        # Assert
        assert result == sample_manual_plan
        mock_plan_repository.create.assert_called_once()

    @pytest.mark.asyncio
    async def test_execute_repository_error_propagation(
        self,
        create_manual_strategy,
        mock_plan_repository,
        sample_note_id,
        sample_plan_text,
    ):
        """Test that repository errors are properly propagated."""
        # Arrange
        unexpected_error = Exception('Database constraint violation')
        mock_plan_repository.create.side_effect = unexpected_error

        # Act & Assert
        with pytest.raises(Exception, match='Database constraint violation') as exc_info:
            await create_manual_strategy.execute(
                note_id=sample_note_id,
                plan_text=sample_plan_text,
            )

        assert exc_info.value == unexpected_error

    @pytest.mark.asyncio
    async def test_execute_plan_properties_verification(
        self,
        create_manual_strategy,
        mock_plan_repository,
        sample_note_id,
        sample_plan_text,
        sample_manual_plan,
    ):
        """Test that the created plan has correct properties."""
        # Arrange
        mock_plan_repository.create.return_value = sample_manual_plan

        # Act
        result = await create_manual_strategy.execute(
            note_id=sample_note_id,
            plan_text=sample_plan_text,
        )

        # Assert
        mock_plan_repository.create.assert_called_once()
        # Get the plan object that was passed to create
        call_args = mock_plan_repository.create.call_args
        created_plan = call_args[1]['plan']

        # Verify all properties
        assert created_plan.note_id == sample_note_id
        assert created_plan.plan_text == sample_plan_text
        assert created_plan.type == PlanTypeEnum.MANUAL
        assert created_plan.status == PlanStatusEnum.ACTIVE
        # generation_id is set by the database default, so it may be None in the Plan object before save
        assert created_plan.generation_id is None or isinstance(created_plan.generation_id, uuid.UUID)

        # Verify the returned result
        assert result == sample_manual_plan

    @pytest.mark.parametrize(
        ('note_id', 'plan_text'),
        [
            (1, 'Short plan'),
            (999999, 'Plan for large note ID'),
            (0, 'Plan for zero note ID'),
            (42, 'Plan with\nmultiline\ntext'),
        ],
    )
    @pytest.mark.asyncio
    async def test_execute_with_various_inputs(
        self,
        create_manual_strategy,
        mock_plan_repository,
        note_id,
        plan_text,
    ):
        """Test execution with various input combinations."""
        # Arrange
        expected_plan = Plan(
            id=1,
            note_id=note_id,
            plan_text=plan_text,
            type=PlanTypeEnum.MANUAL,
            status=PlanStatusEnum.ACTIVE,
            generation_id=uuid.uuid4(),
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )
        mock_plan_repository.create.return_value = expected_plan

        # Act
        result = await create_manual_strategy.execute(
            note_id=note_id,
            plan_text=plan_text,
        )

        # Assert
        assert result == expected_plan
        mock_plan_repository.create.assert_called_once()
