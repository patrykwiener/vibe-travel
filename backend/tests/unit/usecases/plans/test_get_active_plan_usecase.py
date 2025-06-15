"""Unit tests for GetActivePlanUseCase."""

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
from src.apps.plans.usecases.dto.plan_dtos import GetActivePlanInDTO, GetActivePlanOutDTO
from src.apps.plans.usecases.get_active_plan_usecase import GetActivePlanUseCase


@pytest.mark.unit
class TestGetActivePlanUseCase:
    """Test cases for GetActivePlanUseCase."""

    @pytest.fixture
    def mock_note_repository(self):
        """Create a mock note repository."""
        return AsyncMock(spec=NoteRepository)

    @pytest.fixture
    def mock_plan_repository(self):
        """Create a mock plan repository."""
        return AsyncMock(spec=PlanRepository)

    @pytest.fixture
    def get_active_plan_use_case(self, mock_note_repository, mock_plan_repository):
        """Create a GetActivePlanUseCase instance with mocked dependencies."""
        return GetActivePlanUseCase(
            note_repository=mock_note_repository,
            plan_repository=mock_plan_repository,
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
    def sample_note(self, sample_note_id, sample_user_id):
        """Create a sample note for testing."""
        return Note(
            id=sample_note_id,
            user_id=sample_user_id,
            title='Trip to Barcelona',
            place='Barcelona, Spain',
            date_from=datetime.now(UTC).date() + timedelta(days=45),
            date_to=datetime.now(UTC).date() + timedelta(days=52),
            number_of_people=3,
            key_ideas='Gaudi architecture, beaches, tapas',
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

    @pytest.fixture
    def sample_active_plan(self, sample_note_id):
        """Create a sample active plan for testing."""
        return Plan(
            id=1,
            note_id=sample_note_id,
            plan_text=(
                '# Barcelona Travel Plan\n\n'
                '## Day 1: Gothic Quarter\n'
                '- Morning: Explore the Gothic Quarter\n'
                '- Afternoon: Visit Barcelona Cathedral\n'
                '- Evening: Dinner at a local tapas restaurant\n\n'
                "## Day 2: Gaudi's Masterpieces\n"
                '- Morning: Visit Park Güell\n'
                '- Afternoon: Tour Casa Batlló\n'
                '- Evening: Sunset at Bunkers del Carmel\n'
            ),
            type=PlanTypeEnum.AI,
            status=PlanStatusEnum.ACTIVE,
            generation_id=uuid.uuid4(),
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

    @pytest.fixture
    def sample_manual_plan(self, sample_note_id):
        """Create a sample manual plan for testing."""
        return Plan(
            id=2,
            note_id=sample_note_id,
            plan_text='Custom manual travel plan for Barcelona with personal preferences.',
            type=PlanTypeEnum.MANUAL,
            status=PlanStatusEnum.ACTIVE,
            generation_id=uuid.uuid4(),
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

    @pytest.fixture
    def sample_hybrid_plan(self, sample_note_id):
        """Create a sample hybrid plan for testing."""
        return Plan(
            id=3,
            note_id=sample_note_id,
            plan_text='AI-generated plan modified by user with personal touches.',
            type=PlanTypeEnum.HYBRID,
            status=PlanStatusEnum.ACTIVE,
            generation_id=uuid.uuid4(),
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

    # Test successful retrieval of active plan
    @pytest.mark.asyncio
    async def test_execute_success_ai_plan(
        self,
        get_active_plan_use_case,
        mock_note_repository,
        mock_plan_repository,
        sample_user_id,
        sample_note_id,
        sample_note,
        sample_active_plan,
    ):
        """Test successful retrieval of an active AI plan."""
        # Arrange
        input_dto = GetActivePlanInDTO(note_id=sample_note_id, user_id=sample_user_id)

        mock_note_repository.get_by_id.return_value = sample_note
        mock_plan_repository.get_last_updated_by_note_id_and_status.return_value = sample_active_plan

        # Act
        result = await get_active_plan_use_case.execute(input_dto)

        # Assert
        assert isinstance(result, GetActivePlanOutDTO)
        assert result.id == sample_active_plan.id
        assert result.note_id == sample_note_id
        assert result.plan_text == sample_active_plan.plan_text
        assert result.type == PlanTypeEnum.AI
        assert result.status == PlanStatusEnum.ACTIVE
        assert result.generation_id == sample_active_plan.generation_id

        # Verify repository calls
        mock_note_repository.get_by_id.assert_called_once_with(note_id=sample_note_id, user_id=sample_user_id)
        mock_plan_repository.get_last_updated_by_note_id_and_status.assert_called_once_with(
            note_id=sample_note_id, status=PlanStatusEnum.ACTIVE
        )

    # Test successful retrieval of manual plan
    @pytest.mark.asyncio
    async def test_execute_success_manual_plan(
        self,
        get_active_plan_use_case,
        mock_note_repository,
        mock_plan_repository,
        sample_user_id,
        sample_note_id,
        sample_note,
        sample_manual_plan,
    ):
        """Test successful retrieval of an active manual plan."""
        # Arrange
        input_dto = GetActivePlanInDTO(note_id=sample_note_id, user_id=sample_user_id)

        mock_note_repository.get_by_id.return_value = sample_note
        mock_plan_repository.get_last_updated_by_note_id_and_status.return_value = sample_manual_plan

        # Act
        result = await get_active_plan_use_case.execute(input_dto)

        # Assert
        assert isinstance(result, GetActivePlanOutDTO)
        assert result.id == sample_manual_plan.id
        assert result.type == PlanTypeEnum.MANUAL
        assert result.status == PlanStatusEnum.ACTIVE

    # Test successful retrieval of hybrid plan
    @pytest.mark.asyncio
    async def test_execute_success_hybrid_plan(
        self,
        get_active_plan_use_case,
        mock_note_repository,
        mock_plan_repository,
        sample_user_id,
        sample_note_id,
        sample_note,
        sample_hybrid_plan,
    ):
        """Test successful retrieval of an active hybrid plan."""
        # Arrange
        input_dto = GetActivePlanInDTO(note_id=sample_note_id, user_id=sample_user_id)

        mock_note_repository.get_by_id.return_value = sample_note
        mock_plan_repository.get_last_updated_by_note_id_and_status.return_value = sample_hybrid_plan

        # Act
        result = await get_active_plan_use_case.execute(input_dto)

        # Assert
        assert isinstance(result, GetActivePlanOutDTO)
        assert result.type == PlanTypeEnum.HYBRID
        assert result.plan_text == sample_hybrid_plan.plan_text

    # Test note not found error
    @pytest.mark.asyncio
    async def test_execute_note_not_found(
        self,
        get_active_plan_use_case,
        mock_note_repository,
        mock_plan_repository,
        sample_user_id,
        sample_note_id,
    ):
        """Test execution when note is not found."""
        # Arrange
        input_dto = GetActivePlanInDTO(note_id=sample_note_id, user_id=sample_user_id)
        mock_note_repository.get_by_id.side_effect = NoteNotFoundError(note_id=sample_note_id)

        # Act & Assert
        with pytest.raises(NoteNotFoundError):
            await get_active_plan_use_case.execute(input_dto)

        # Verify only note repository was called
        mock_note_repository.get_by_id.assert_called_once_with(note_id=sample_note_id, user_id=sample_user_id)
        mock_plan_repository.get_last_updated_by_note_id_and_status.assert_not_called()

    # Test active plan not found error
    @pytest.mark.asyncio
    async def test_execute_active_plan_not_found(
        self,
        get_active_plan_use_case,
        mock_note_repository,
        mock_plan_repository,
        sample_user_id,
        sample_note_id,
        sample_note,
    ):
        """Test execution when no active plan exists for the note."""
        # Arrange
        input_dto = GetActivePlanInDTO(note_id=sample_note_id, user_id=sample_user_id)

        mock_note_repository.get_by_id.return_value = sample_note
        mock_plan_repository.get_last_updated_by_note_id_and_status.return_value = None

        # Act & Assert
        with pytest.raises(ActivePlanNotFoundError) as exc_info:
            await get_active_plan_use_case.execute(input_dto)

        assert exc_info.value.note_id == sample_note_id

        # Verify repository calls
        mock_note_repository.get_by_id.assert_called_once()
        mock_plan_repository.get_last_updated_by_note_id_and_status.assert_called_once_with(
            note_id=sample_note_id, status=PlanStatusEnum.ACTIVE
        )

    # Test note validation
    @pytest.mark.asyncio
    async def test_validate_note_exists_success(
        self,
        get_active_plan_use_case,
        mock_note_repository,
        sample_user_id,
        sample_note_id,
        sample_note,
    ):
        """Test successful note validation."""
        # Arrange
        mock_note_repository.get_by_id.return_value = sample_note

        # Act
        await get_active_plan_use_case._validate_note_exists(note_id=sample_note_id, user_id=sample_user_id)

        # Assert
        mock_note_repository.get_by_id.assert_called_once_with(note_id=sample_note_id, user_id=sample_user_id)

    # Test note validation failure
    @pytest.mark.asyncio
    async def test_validate_note_exists_failure(
        self,
        get_active_plan_use_case,
        mock_note_repository,
        sample_user_id,
        sample_note_id,
    ):
        """Test note validation failure."""
        # Arrange
        mock_note_repository.get_by_id.side_effect = NoteNotFoundError(note_id=sample_note_id)

        # Act & Assert
        with pytest.raises(NoteNotFoundError):
            await get_active_plan_use_case._validate_note_exists(note_id=sample_note_id, user_id=sample_user_id)

    # Test fetching active plan success
    @pytest.mark.asyncio
    async def test_fetch_active_plan_success(
        self,
        get_active_plan_use_case,
        mock_plan_repository,
        sample_note_id,
        sample_active_plan,
    ):
        """Test successful fetching of active plan."""
        # Arrange
        mock_plan_repository.get_last_updated_by_note_id_and_status.return_value = sample_active_plan

        # Act
        result = await get_active_plan_use_case._fetch_active_plan(note_id=sample_note_id)

        # Assert
        assert result == sample_active_plan
        mock_plan_repository.get_last_updated_by_note_id_and_status.assert_called_once_with(
            note_id=sample_note_id, status=PlanStatusEnum.ACTIVE
        )

    # Test fetching active plan failure
    @pytest.mark.asyncio
    async def test_fetch_active_plan_not_found(
        self,
        get_active_plan_use_case,
        mock_plan_repository,
        sample_note_id,
    ):
        """Test fetching active plan when none exists."""
        # Arrange
        mock_plan_repository.get_last_updated_by_note_id_and_status.return_value = None

        # Act & Assert
        with pytest.raises(ActivePlanNotFoundError) as exc_info:
            await get_active_plan_use_case._fetch_active_plan(note_id=sample_note_id)

        assert exc_info.value.note_id == sample_note_id

    # Test DTO conversion
    @pytest.mark.asyncio
    async def test_to_dto_conversion(
        self,
        get_active_plan_use_case,
        sample_active_plan,
    ):
        """Test conversion from Plan model to DTO."""
        # Act
        result = get_active_plan_use_case._to_dto(sample_active_plan)

        # Assert
        assert isinstance(result, GetActivePlanOutDTO)
        assert result.id == sample_active_plan.id
        assert result.note_id == sample_active_plan.note_id
        assert result.plan_text == sample_active_plan.plan_text
        assert result.type == sample_active_plan.type
        assert result.status == sample_active_plan.status
        assert result.generation_id == sample_active_plan.generation_id
        assert result.created_at == sample_active_plan.created_at
        assert result.updated_at == sample_active_plan.updated_at

    # Test with different note ownership scenarios
    @pytest.mark.asyncio
    async def test_execute_wrong_user_ownership(
        self,
        get_active_plan_use_case,
        mock_note_repository,
        sample_note_id,
    ):
        """Test execution when user doesn't own the note."""
        # Arrange
        wrong_user_id = uuid.uuid4()
        input_dto = GetActivePlanInDTO(note_id=sample_note_id, user_id=wrong_user_id)
        mock_note_repository.get_by_id.side_effect = NoteNotFoundError(note_id=sample_note_id)

        # Act & Assert
        with pytest.raises(NoteNotFoundError):
            await get_active_plan_use_case.execute(input_dto)

    # Test repository error handling
    @pytest.mark.asyncio
    async def test_execute_repository_error(
        self,
        get_active_plan_use_case,
        mock_note_repository,
        mock_plan_repository,
        sample_user_id,
        sample_note_id,
        sample_note,
    ):
        """Test execution when plan repository raises an error."""
        # Arrange
        input_dto = GetActivePlanInDTO(note_id=sample_note_id, user_id=sample_user_id)

        mock_note_repository.get_by_id.return_value = sample_note
        mock_plan_repository.get_last_updated_by_note_id_and_status.side_effect = Exception('Database connection error')

        # Act & Assert
        with pytest.raises(Exception, match='Database connection error'):
            await get_active_plan_use_case.execute(input_dto)

    # Test plan with empty text
    @pytest.mark.asyncio
    async def test_execute_plan_with_empty_text(
        self,
        get_active_plan_use_case,
        mock_note_repository,
        mock_plan_repository,
        sample_user_id,
        sample_note_id,
        sample_note,
    ):
        """Test retrieval of plan with empty text."""
        # Arrange
        empty_plan = Plan(
            id=1,
            note_id=sample_note_id,
            plan_text='',  # Empty plan text
            type=PlanTypeEnum.MANUAL,
            status=PlanStatusEnum.ACTIVE,
            generation_id=uuid.uuid4(),
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

        input_dto = GetActivePlanInDTO(note_id=sample_note_id, user_id=sample_user_id)

        mock_note_repository.get_by_id.return_value = sample_note
        mock_plan_repository.get_last_updated_by_note_id_and_status.return_value = empty_plan

        # Act
        result = await get_active_plan_use_case.execute(input_dto)

        # Assert
        assert isinstance(result, GetActivePlanOutDTO)
        assert result.plan_text == ''

    # Test plan with very long text
    @pytest.mark.asyncio
    async def test_execute_plan_with_long_text(
        self,
        get_active_plan_use_case,
        mock_note_repository,
        mock_plan_repository,
        sample_user_id,
        sample_note_id,
        sample_note,
    ):
        """Test retrieval of plan with very long text."""
        # Arrange
        long_text = 'A' * 2500  # Very long plan text
        long_plan = Plan(
            id=1,
            note_id=sample_note_id,
            plan_text=long_text,
            type=PlanTypeEnum.AI,
            status=PlanStatusEnum.ACTIVE,
            generation_id=uuid.uuid4(),
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

        input_dto = GetActivePlanInDTO(note_id=sample_note_id, user_id=sample_user_id)

        mock_note_repository.get_by_id.return_value = sample_note
        mock_plan_repository.get_last_updated_by_note_id_and_status.return_value = long_plan

        # Act
        result = await get_active_plan_use_case.execute(input_dto)

        # Assert
        assert isinstance(result, GetActivePlanOutDTO)
        assert len(result.plan_text) == 2500

    # Test plan with special characters
    @pytest.mark.asyncio
    async def test_execute_plan_with_special_characters(
        self,
        get_active_plan_use_case,
        mock_note_repository,
        mock_plan_repository,
        sample_user_id,
        sample_note_id,
        sample_note,
    ):
        """Test retrieval of plan with special characters and unicode."""
        # Arrange
        special_text = 'Café in Tókyo: 🍣 Sushi & 🏯 Temple visits! Cost: €100-200 💰'
        special_plan = Plan(
            id=1,
            note_id=sample_note_id,
            plan_text=special_text,
            type=PlanTypeEnum.HYBRID,
            status=PlanStatusEnum.ACTIVE,
            generation_id=uuid.uuid4(),
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

        input_dto = GetActivePlanInDTO(note_id=sample_note_id, user_id=sample_user_id)

        mock_note_repository.get_by_id.return_value = sample_note
        mock_plan_repository.get_last_updated_by_note_id_and_status.return_value = special_plan

        # Act
        result = await get_active_plan_use_case.execute(input_dto)

        # Assert
        assert isinstance(result, GetActivePlanOutDTO)
        assert result.plan_text == special_text

    # Parametrized tests for different plan types
    @pytest.mark.parametrize(
        ('plan_type', 'expected_type'),
        [
            (PlanTypeEnum.AI, PlanTypeEnum.AI),
            (PlanTypeEnum.MANUAL, PlanTypeEnum.MANUAL),
            (PlanTypeEnum.HYBRID, PlanTypeEnum.HYBRID),
        ],
    )
    @pytest.mark.asyncio
    async def test_execute_different_plan_types(
        self,
        get_active_plan_use_case,
        mock_note_repository,
        mock_plan_repository,
        sample_user_id,
        sample_note_id,
        sample_note,
        plan_type,
        expected_type,
    ):
        """Test execution with different plan types."""
        # Arrange
        plan = Plan(
            id=1,
            note_id=sample_note_id,
            plan_text=f'Test plan of type {plan_type}',
            type=plan_type,
            status=PlanStatusEnum.ACTIVE,
            generation_id=uuid.uuid4(),
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

        input_dto = GetActivePlanInDTO(note_id=sample_note_id, user_id=sample_user_id)

        mock_note_repository.get_by_id.return_value = sample_note
        mock_plan_repository.get_last_updated_by_note_id_and_status.return_value = plan

        # Act
        result = await get_active_plan_use_case.execute(input_dto)

        # Assert
        assert isinstance(result, GetActivePlanOutDTO)
        assert result.type == expected_type

    # Test DTO field completeness
    @pytest.mark.asyncio
    async def test_dto_field_completeness(
        self,
        get_active_plan_use_case,
        mock_note_repository,
        mock_plan_repository,
        sample_user_id,
        sample_note_id,
        sample_note,
        sample_active_plan,
    ):
        """Test that all DTO fields are properly populated."""
        # Arrange
        input_dto = GetActivePlanInDTO(note_id=sample_note_id, user_id=sample_user_id)

        mock_note_repository.get_by_id.return_value = sample_note
        mock_plan_repository.get_last_updated_by_note_id_and_status.return_value = sample_active_plan

        # Act
        result = await get_active_plan_use_case.execute(input_dto)

        # Assert
        assert result.id is not None
        assert result.note_id is not None
        assert result.plan_text is not None
        assert result.type is not None
        assert result.status is not None
        assert result.generation_id is not None
        assert result.created_at is not None
        assert result.updated_at is not None

    # Test concurrency-related scenarios
    @pytest.mark.asyncio
    async def test_execute_multiple_calls(
        self,
        get_active_plan_use_case,
        mock_note_repository,
        mock_plan_repository,
        sample_user_id,
        sample_note_id,
        sample_note,
        sample_active_plan,
    ):
        """Test multiple calls to execute method."""
        # Arrange
        input_dto = GetActivePlanInDTO(note_id=sample_note_id, user_id=sample_user_id)

        mock_note_repository.get_by_id.return_value = sample_note
        mock_plan_repository.get_last_updated_by_note_id_and_status.return_value = sample_active_plan

        # Act - Call multiple times
        result1 = await get_active_plan_use_case.execute(input_dto)
        result2 = await get_active_plan_use_case.execute(input_dto)

        # Assert
        assert result1.id == result2.id
        assert result1.plan_text == result2.plan_text
        assert mock_note_repository.get_by_id.call_count == 2
        assert mock_plan_repository.get_last_updated_by_note_id_and_status.call_count == 2
