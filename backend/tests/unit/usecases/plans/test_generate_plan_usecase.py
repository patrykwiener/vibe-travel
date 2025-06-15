"""Unit tests for GeneratePlanUseCase."""

import uuid
from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock

import pytest

from src.apps.notes.exceptions import NoteNotFoundError
from src.apps.notes.models.note import Note
from src.apps.notes.repositories.note_repository import NoteRepository
from src.apps.plans.enums import PlanStatusEnum, PlanTypeEnum
from src.apps.plans.exceptions import PlanGenerationError
from src.apps.plans.models.plan import Plan
from src.apps.plans.repositories.plan_repository import PlanRepository
from src.apps.plans.services.plan_generation_service import PlanGenerationService
from src.apps.plans.usecases.dto.plan_dtos import GeneratePlanInDTO, GeneratePlanOutDTO
from src.apps.plans.usecases.dto.plan_generation_dto import TravelPlanGenerationDTO
from src.apps.plans.usecases.generate_plan_usercase import GeneratePlanUseCase
from src.apps.users.enums import UserBudgetEnum, UserTravelPaceEnum, UserTravelStyleEnum
from src.apps.users.exceptions import ProfileNotFoundError
from src.apps.users.models.profile import UserProfile
from src.apps.users.repositories.profile_repository import UserProfileRepository


@pytest.mark.unit
class TestGeneratePlanUseCase:
    """Test cases for GeneratePlanUseCase."""

    @pytest.fixture
    def mock_plan_repository(self):
        """Create a mock plan repository."""
        return AsyncMock(spec=PlanRepository)

    @pytest.fixture
    def mock_note_repository(self):
        """Create a mock note repository."""
        return AsyncMock(spec=NoteRepository)

    @pytest.fixture
    def mock_user_profile_repository(self):
        """Create a mock user profile repository."""
        return AsyncMock(spec=UserProfileRepository)

    @pytest.fixture
    def mock_plan_generation_service(self):
        """Create a mock plan generation service."""
        return AsyncMock(spec=PlanGenerationService)

    @pytest.fixture
    def plan_max_length(self):
        """Plan maximum length for testing."""
        return 3000

    @pytest.fixture
    def generate_plan_use_case(
        self,
        mock_plan_repository,
        mock_note_repository,
        mock_user_profile_repository,
        mock_plan_generation_service,
        plan_max_length,
    ):
        """Create a GeneratePlanUseCase instance with mocked dependencies."""
        return GeneratePlanUseCase(
            plan_repository=mock_plan_repository,
            note_repository=mock_note_repository,
            user_profile_repository=mock_user_profile_repository,
            plan_generation_service=mock_plan_generation_service,
            plan_max_length=plan_max_length,
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
    def sample_user_profile(self, sample_user_id):
        """Create a sample user profile for testing."""
        return UserProfile(
            id=1,
            user_id=sample_user_id,
            travel_style=UserTravelStyleEnum.CULTURE,
            preferred_pace=UserTravelPaceEnum.MODERATE,
            budget=UserBudgetEnum.MEDIUM,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

    @pytest.fixture
    def sample_generated_plan_text(self):
        """Sample generated plan text."""
        return (
            '# Tokyo Travel Plan\n\n'
            '## Day 1: Arrival and Traditional Tokyo\n'
            '- Morning: Arrive at Narita Airport\n'
            '- Afternoon: Visit Senso-ji Temple in Asakusa\n'
            '- Evening: Explore Shibuya Crossing\n\n'
            '## Day 2: Cultural Immersion\n'
            '- Morning: Visit Meiji Shrine\n'
            '- Afternoon: Explore Tokyo National Museum\n'
            '- Evening: Traditional dinner in Ginza\n'
        )

    @pytest.fixture
    def sample_plan(self, sample_note_id, sample_generated_plan_text):
        """Create a sample plan for testing."""
        return Plan(
            id=1,
            note_id=sample_note_id,
            plan_text=sample_generated_plan_text,
            type=PlanTypeEnum.AI,
            status=PlanStatusEnum.PENDING_AI,
            generation_id=uuid.uuid4(),
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

    # Test successful plan generation
    @pytest.mark.asyncio
    async def test_execute_success(
        self,
        generate_plan_use_case,
        mock_plan_repository,
        mock_note_repository,
        mock_user_profile_repository,
        mock_plan_generation_service,
        sample_user_id,
        sample_note_id,
        sample_note,
        sample_user_profile,
        sample_generated_plan_text,
        sample_plan,
    ):
        """Test successful plan generation."""
        # Arrange
        input_dto = GeneratePlanInDTO(note_id=sample_note_id, user_id=sample_user_id)

        mock_note_repository.get_by_id.return_value = sample_note
        mock_user_profile_repository.get_by_user_id.return_value = sample_user_profile
        mock_plan_generation_service.generate_plan.return_value = sample_generated_plan_text
        mock_plan_repository.create.return_value = sample_plan

        # Act
        result = await generate_plan_use_case.execute(input_dto)

        # Assert
        assert isinstance(result, GeneratePlanOutDTO)
        assert result.generation_id == sample_plan.generation_id
        assert result.plan_text == sample_generated_plan_text
        assert result.status == PlanStatusEnum.PENDING_AI

        # Verify repository calls
        mock_note_repository.get_by_id.assert_called_once_with(note_id=sample_note_id, user_id=sample_user_id)
        mock_user_profile_repository.get_by_user_id.assert_called_once_with(user_id=sample_user_id)
        mock_plan_generation_service.generate_plan.assert_called_once()
        mock_plan_repository.create.assert_called_once()

        # Verify the plan creation call
        created_plan_arg = mock_plan_repository.create.call_args[1]['plan']
        assert created_plan_arg.note_id == sample_note_id
        assert created_plan_arg.plan_text == sample_generated_plan_text
        assert created_plan_arg.type == PlanTypeEnum.AI
        assert created_plan_arg.status == PlanStatusEnum.PENDING_AI

    # Test note not found error
    @pytest.mark.asyncio
    async def test_execute_note_not_found(
        self,
        generate_plan_use_case,
        mock_note_repository,
        sample_user_id,
        sample_note_id,
    ):
        """Test execution when note is not found."""
        # Arrange
        input_dto = GeneratePlanInDTO(note_id=sample_note_id, user_id=sample_user_id)
        mock_note_repository.get_by_id.side_effect = NoteNotFoundError(note_id=sample_note_id)

        # Act & Assert
        with pytest.raises(NoteNotFoundError):
            await generate_plan_use_case.execute(input_dto)

        # Verify only note repository was called
        mock_note_repository.get_by_id.assert_called_once_with(note_id=sample_note_id, user_id=sample_user_id)

    # Test user profile not found error
    @pytest.mark.asyncio
    async def test_execute_user_profile_not_found(
        self,
        generate_plan_use_case,
        mock_plan_repository,
        mock_note_repository,
        mock_user_profile_repository,
        sample_user_id,
        sample_note_id,
        sample_note,
    ):
        """Test execution when user profile is not found."""
        # Arrange
        input_dto = GeneratePlanInDTO(note_id=sample_note_id, user_id=sample_user_id)

        mock_note_repository.get_by_id.return_value = sample_note
        mock_user_profile_repository.get_by_user_id.return_value = None

        # Act & Assert
        with pytest.raises(ProfileNotFoundError):
            await generate_plan_use_case.execute(input_dto)

        # Verify repository calls
        mock_note_repository.get_by_id.assert_called_once()
        mock_user_profile_repository.get_by_user_id.assert_called_once_with(user_id=sample_user_id)

    # Test plan generation service error
    @pytest.mark.asyncio
    async def test_execute_plan_generation_error(
        self,
        generate_plan_use_case,
        mock_plan_repository,
        mock_note_repository,
        mock_user_profile_repository,
        mock_plan_generation_service,
        sample_user_id,
        sample_note_id,
        sample_note,
        sample_user_profile,
    ):
        """Test execution when plan generation service fails."""
        # Arrange
        input_dto = GeneratePlanInDTO(note_id=sample_note_id, user_id=sample_user_id)

        mock_note_repository.get_by_id.return_value = sample_note
        mock_user_profile_repository.get_by_user_id.return_value = sample_user_profile
        mock_plan_generation_service.generate_plan.side_effect = PlanGenerationError(
            note_id=sample_note_id, message='AI service unavailable'
        )

        # Act & Assert
        with pytest.raises(PlanGenerationError) as exc_info:
            await generate_plan_use_case.execute(input_dto)

        assert exc_info.value.note_id == sample_note_id
        assert 'AI service unavailable' in str(exc_info.value)

        # Verify service was called but repository create was not
        mock_plan_generation_service.generate_plan.assert_called_once()
        mock_plan_repository.create.assert_not_called()

    # Test plan repository error
    @pytest.mark.asyncio
    async def test_execute_plan_repository_error(
        self,
        generate_plan_use_case,
        mock_plan_repository,
        mock_note_repository,
        mock_user_profile_repository,
        mock_plan_generation_service,
        sample_user_id,
        sample_note_id,
        sample_note,
        sample_user_profile,
        sample_generated_plan_text,
    ):
        """Test execution when plan repository fails."""
        # Arrange
        input_dto = GeneratePlanInDTO(note_id=sample_note_id, user_id=sample_user_id)

        mock_note_repository.get_by_id.return_value = sample_note
        mock_user_profile_repository.get_by_user_id.return_value = sample_user_profile
        mock_plan_generation_service.generate_plan.return_value = sample_generated_plan_text
        mock_plan_repository.create.side_effect = Exception('Database error')

        # Act & Assert
        with pytest.raises(Exception, match='Database error'):
            await generate_plan_use_case.execute(input_dto)

        # Verify all previous steps were called
        mock_plan_generation_service.generate_plan.assert_called_once()
        mock_plan_repository.create.assert_called_once()

    # Test travel plan generation DTO creation
    @pytest.mark.asyncio
    async def test_generate_plan_text_dto_creation(
        self,
        generate_plan_use_case,
        mock_plan_generation_service,
        sample_note,
        sample_user_profile,
        sample_generated_plan_text,
        plan_max_length,
    ):
        """Test that TravelPlanGenerationDTO is created correctly."""
        # Arrange
        mock_plan_generation_service.generate_plan.return_value = sample_generated_plan_text

        # Act
        result = await generate_plan_use_case._generate_plan_text(sample_note, sample_user_profile)

        # Assert
        assert result == sample_generated_plan_text

        # Verify the service was called with the correct DTO
        mock_plan_generation_service.generate_plan.assert_called_once()
        call_args = mock_plan_generation_service.generate_plan.call_args
        travel_plan_dto = call_args[1]['travel_plan_dto']

        assert isinstance(travel_plan_dto, TravelPlanGenerationDTO)

    # Test edge case with minimal user profile
    @pytest.mark.asyncio
    async def test_execute_with_minimal_user_profile(
        self,
        generate_plan_use_case,
        mock_plan_repository,
        mock_note_repository,
        mock_user_profile_repository,
        mock_plan_generation_service,
        sample_user_id,
        sample_note_id,
        sample_note,
        sample_generated_plan_text,
        sample_plan,
    ):
        """Test plan generation with minimal user profile data."""
        # Arrange
        minimal_profile = UserProfile(
            id=1,
            user_id=sample_user_id,
            travel_style=None,
            preferred_pace=None,
            budget=None,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

        input_dto = GeneratePlanInDTO(note_id=sample_note_id, user_id=sample_user_id)

        mock_note_repository.get_by_id.return_value = sample_note
        mock_user_profile_repository.get_by_user_id.return_value = minimal_profile
        mock_plan_generation_service.generate_plan.return_value = sample_generated_plan_text
        mock_plan_repository.create.return_value = sample_plan

        # Act
        result = await generate_plan_use_case.execute(input_dto)

        # Assert
        assert isinstance(result, GeneratePlanOutDTO)
        assert result.generation_id == sample_plan.generation_id

    # Test plan max length parameter
    @pytest.mark.asyncio
    async def test_plan_max_length_parameter(
        self,
        mock_plan_repository,
        mock_note_repository,
        mock_user_profile_repository,
        mock_plan_generation_service,
    ):
        """Test that plan max length is correctly passed to the use case."""
        # Arrange
        custom_max_length = 5000
        use_case = GeneratePlanUseCase(
            plan_repository=mock_plan_repository,
            note_repository=mock_note_repository,
            user_profile_repository=mock_user_profile_repository,
            plan_generation_service=mock_plan_generation_service,
            plan_max_length=custom_max_length,
        )

        # Assert
        assert use_case.plan_max_length == custom_max_length

    # Test DTO conversion
    @pytest.mark.asyncio
    async def test_create_output_dto(
        self,
        generate_plan_use_case,
        sample_plan,
    ):
        """Test DTO conversion from Plan model."""
        # Act
        result = generate_plan_use_case._create_output_dto(sample_plan)

        # Assert
        assert isinstance(result, GeneratePlanOutDTO)
        assert result.generation_id == sample_plan.generation_id
        assert result.plan_text == sample_plan.plan_text
        assert result.status == sample_plan.status

    # Test plan creation with correct attributes
    @pytest.mark.asyncio
    async def test_store_plan_proposal(
        self,
        generate_plan_use_case,
        mock_plan_repository,
        sample_note_id,
        sample_generated_plan_text,
        sample_plan,
    ):
        """Test plan proposal storage."""
        # Arrange
        mock_plan_repository.create.return_value = sample_plan

        # Act
        result = await generate_plan_use_case._store_plan_proposal(sample_note_id, sample_generated_plan_text)

        # Assert
        assert result == sample_plan
        mock_plan_repository.create.assert_called_once()

        # Verify the plan object passed to create
        created_plan_arg = mock_plan_repository.create.call_args[1]['plan']
        assert created_plan_arg.note_id == sample_note_id
        assert created_plan_arg.plan_text == sample_generated_plan_text
        assert created_plan_arg.type == PlanTypeEnum.AI
        assert created_plan_arg.status == PlanStatusEnum.PENDING_AI

    # Test with different user profile configurations
    @pytest.mark.parametrize(
        ('travel_style', 'preferred_pace', 'budget'),
        [
            (UserTravelStyleEnum.ADVENTURE, UserTravelPaceEnum.INTENSE, UserBudgetEnum.HIGH),
            (UserTravelStyleEnum.RELAX, UserTravelPaceEnum.CALM, UserBudgetEnum.LOW),
            (UserTravelStyleEnum.CULTURE, UserTravelPaceEnum.MODERATE, UserBudgetEnum.MEDIUM),
            (None, None, None),  # All None values
        ],
    )
    @pytest.mark.asyncio
    async def test_execute_with_different_profiles(
        self,
        generate_plan_use_case,
        mock_plan_repository,
        mock_note_repository,
        mock_user_profile_repository,
        mock_plan_generation_service,
        sample_user_id,
        sample_note_id,
        sample_note,
        sample_generated_plan_text,
        sample_plan,
        travel_style,
        preferred_pace,
        budget,
    ):
        """Test plan generation with different user profile configurations."""
        # Arrange
        user_profile = UserProfile(
            id=1,
            user_id=sample_user_id,
            travel_style=travel_style,
            preferred_pace=preferred_pace,
            budget=budget,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

        input_dto = GeneratePlanInDTO(note_id=sample_note_id, user_id=sample_user_id)

        mock_note_repository.get_by_id.return_value = sample_note
        mock_user_profile_repository.get_by_user_id.return_value = user_profile
        mock_plan_generation_service.generate_plan.return_value = sample_generated_plan_text
        mock_plan_repository.create.return_value = sample_plan

        # Act
        result = await generate_plan_use_case.execute(input_dto)

        # Assert
        assert isinstance(result, GeneratePlanOutDTO)
        assert result.generation_id == sample_plan.generation_id

    # Test error handling consistency
    @pytest.mark.asyncio
    async def test_error_propagation(
        self,
        generate_plan_use_case,
        mock_plan_repository,
        mock_note_repository,
        mock_user_profile_repository,
        mock_plan_generation_service,
        sample_user_id,
        sample_note_id,
        sample_note,
        sample_user_profile,
    ):
        """Test that various errors are properly propagated."""
        # Arrange
        input_dto = GeneratePlanInDTO(note_id=sample_note_id, user_id=sample_user_id)

        mock_note_repository.get_by_id.return_value = sample_note
        mock_user_profile_repository.get_by_user_id.return_value = sample_user_profile

        # Test generation service generic error
        mock_plan_generation_service.generate_plan.side_effect = Exception('Unexpected error')

        # Act & Assert
        with pytest.raises(Exception, match='Unexpected error'):
            await generate_plan_use_case.execute(input_dto)

    # Test long plan text handling
    @pytest.mark.asyncio
    async def test_execute_with_long_plan_text(
        self,
        generate_plan_use_case,
        mock_plan_repository,
        mock_note_repository,
        mock_user_profile_repository,
        mock_plan_generation_service,
        sample_user_id,
        sample_note_id,
        sample_note,
        sample_user_profile,
    ):
        """Test plan generation with very long plan text."""
        # Arrange
        long_plan_text = 'A' * 2500  # Near the limit

        sample_plan = Plan(
            id=1,
            note_id=sample_note_id,
            plan_text=long_plan_text,
            type=PlanTypeEnum.AI,
            status=PlanStatusEnum.PENDING_AI,
            generation_id=uuid.uuid4(),
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

        input_dto = GeneratePlanInDTO(note_id=sample_note_id, user_id=sample_user_id)

        mock_note_repository.get_by_id.return_value = sample_note
        mock_user_profile_repository.get_by_user_id.return_value = sample_user_profile
        mock_plan_generation_service.generate_plan.return_value = long_plan_text
        mock_plan_repository.create.return_value = sample_plan

        # Act
        result = await generate_plan_use_case.execute(input_dto)

        # Assert
        assert isinstance(result, GeneratePlanOutDTO)
        assert len(result.plan_text) == 2500
