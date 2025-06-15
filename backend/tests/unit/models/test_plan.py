"""Unit tests for Plan model class."""

import uuid
from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from src.apps.notes.models.note import Note
from src.apps.plans.enums import PlanStatusEnum, PlanTypeEnum
from src.apps.plans.models.plan import Plan
from src.apps.users.models.user import User


@pytest.fixture
async def sample_user(async_session: AsyncSession) -> User:
    """Create a sample user for testing."""
    user = User(
        id=uuid.uuid4(),
        email=f'test_{uuid.uuid4().hex[:8]}@example.com',  # Unique email
        hashed_password='hashed_password',
        is_active=True,
        is_superuser=False,
        is_verified=True,
    )
    async_session.add(user)
    await async_session.commit()
    await async_session.refresh(user)
    return user


@pytest.fixture
async def sample_note(async_session: AsyncSession, sample_user: User) -> Note:
    """Create a sample note for testing."""
    note = Note(
        user_id=sample_user.id,
        title='Test Trip',
        place='Paris, France',
        date_from=datetime.now(tz=UTC).date() + timedelta(days=30),
        date_to=datetime.now(tz=UTC).date() + timedelta(days=37),
        number_of_people=2,
        key_ideas='Eiffel Tower, Louvre Museum, Seine River cruise',
    )
    async_session.add(note)
    await async_session.commit()
    await async_session.refresh(note)
    return note


class TestPlanModel:
    """Test cases for Plan model."""

    @pytest.mark.asyncio
    async def test_plan_creation_basic(
        self,
        async_session: AsyncSession,
        sample_note: Note,
    ):
        """Test basic plan creation."""
        # Arrange & Act
        plan = Plan(
            note_id=sample_note.id,
            plan_text='Day 1: Visit Eiffel Tower...',
            type=PlanTypeEnum.MANUAL,
            status=PlanStatusEnum.ACTIVE,
        )
        async_session.add(plan)
        await async_session.commit()
        await async_session.refresh(plan)

        # Assert
        assert plan.id is not None
        assert plan.note_id == sample_note.id
        assert plan.plan_text == 'Day 1: Visit Eiffel Tower...'
        assert plan.type == PlanTypeEnum.MANUAL
        assert plan.status == PlanStatusEnum.ACTIVE
        assert plan.generation_id is not None
        assert isinstance(plan.generation_id, uuid.UUID)
        assert plan.created_at is not None
        assert plan.updated_at is not None

    @pytest.mark.asyncio
    async def test_plan_creation_with_all_types(
        self,
        async_session: AsyncSession,
        sample_note: Note,
    ):
        """Test plan creation with all plan types."""
        # Test AI plan
        ai_plan = Plan(
            note_id=sample_note.id,
            plan_text='AI Generated Plan',
            type=PlanTypeEnum.AI,
            status=PlanStatusEnum.PENDING_AI,
        )
        async_session.add(ai_plan)

        # Test MANUAL plan
        manual_plan = Plan(
            note_id=sample_note.id,
            plan_text='Manual Plan',
            type=PlanTypeEnum.MANUAL,
            status=PlanStatusEnum.ACTIVE,
        )
        async_session.add(manual_plan)

        # Test HYBRID plan
        hybrid_plan = Plan(
            note_id=sample_note.id,
            plan_text='Hybrid Plan',
            type=PlanTypeEnum.HYBRID,
            status=PlanStatusEnum.ACTIVE,
        )
        async_session.add(hybrid_plan)

        await async_session.commit()
        await async_session.refresh(ai_plan)
        await async_session.refresh(manual_plan)
        await async_session.refresh(hybrid_plan)

        # Assert
        assert ai_plan.type == PlanTypeEnum.AI
        assert ai_plan.status == PlanStatusEnum.PENDING_AI
        assert manual_plan.type == PlanTypeEnum.MANUAL
        assert manual_plan.status == PlanStatusEnum.ACTIVE
        assert hybrid_plan.type == PlanTypeEnum.HYBRID
        assert hybrid_plan.status == PlanStatusEnum.ACTIVE

    @pytest.mark.asyncio
    async def test_plan_creation_with_all_statuses(
        self,
        async_session: AsyncSession,
        sample_note: Note,
    ):
        """Test plan creation with all plan statuses."""
        # Test PENDING_AI status
        pending_plan = Plan(
            note_id=sample_note.id,
            plan_text='Pending AI Plan',
            type=PlanTypeEnum.AI,
            status=PlanStatusEnum.PENDING_AI,
        )
        async_session.add(pending_plan)

        # Test ACTIVE status
        active_plan = Plan(
            note_id=sample_note.id,
            plan_text='Active Plan',
            type=PlanTypeEnum.MANUAL,
            status=PlanStatusEnum.ACTIVE,
        )
        async_session.add(active_plan)

        # Test ARCHIVED status
        archived_plan = Plan(
            note_id=sample_note.id,
            plan_text='Archived Plan',
            type=PlanTypeEnum.MANUAL,
            status=PlanStatusEnum.ARCHIVED,
        )
        async_session.add(archived_plan)

        await async_session.commit()
        await async_session.refresh(pending_plan)
        await async_session.refresh(active_plan)
        await async_session.refresh(archived_plan)

        # Assert
        assert pending_plan.status == PlanStatusEnum.PENDING_AI
        assert active_plan.status == PlanStatusEnum.ACTIVE
        assert archived_plan.status == PlanStatusEnum.ARCHIVED

    @pytest.mark.asyncio
    async def test_accept_ai_proposal_success(
        self,
        async_session: AsyncSession,
        sample_note: Note,
    ):
        """Test successful acceptance of AI proposal."""
        # Arrange
        plan = Plan(
            note_id=sample_note.id,
            plan_text='AI Generated Plan',
            type=PlanTypeEnum.AI,
            status=PlanStatusEnum.PENDING_AI,
        )
        async_session.add(plan)
        await async_session.commit()
        await async_session.refresh(plan)

        # Act
        plan.accept_ai_proposal()

        # Assert
        assert plan.status == PlanStatusEnum.ACTIVE
        assert plan.type == PlanTypeEnum.AI  # Type should remain AI
        assert plan.plan_text == 'AI Generated Plan'  # Text should remain unchanged

    @pytest.mark.asyncio
    async def test_accept_ai_proposal_invalid_status(
        self,
        async_session: AsyncSession,
        sample_note: Note,
    ):
        """Test that accepting AI proposal fails for non-PENDING_AI plans."""
        # Arrange
        plan = Plan(
            note_id=sample_note.id,
            plan_text='Active Plan',
            type=PlanTypeEnum.MANUAL,
            status=PlanStatusEnum.ACTIVE,
        )

        # Act & Assert
        with pytest.raises(ValueError, match='Cannot accept plan with status PlanStatusEnum.ACTIVE'):
            plan.accept_ai_proposal()

    @pytest.mark.asyncio
    async def test_accept_ai_proposal_as_hybrid_success(
        self,
        async_session: AsyncSession,
        sample_note: Note,
    ):
        """Test successful acceptance of AI proposal as hybrid."""
        # Arrange
        plan = Plan(
            note_id=sample_note.id,
            plan_text='Original AI Plan',
            type=PlanTypeEnum.AI,
            status=PlanStatusEnum.PENDING_AI,
        )
        async_session.add(plan)
        await async_session.commit()
        await async_session.refresh(plan)

        # Act
        new_text = 'Modified AI Plan with user changes'
        plan.accept_ai_proposal_as_hybrid(new_text)

        # Assert
        assert plan.status == PlanStatusEnum.ACTIVE
        assert plan.type == PlanTypeEnum.HYBRID
        assert plan.plan_text == new_text

    @pytest.mark.asyncio
    async def test_accept_ai_proposal_as_hybrid_invalid_status(
        self,
        async_session: AsyncSession,
        sample_note: Note,
    ):
        """Test that accepting AI proposal as hybrid fails for non-PENDING_AI plans."""
        # Arrange
        plan = Plan(
            note_id=sample_note.id,
            plan_text='Active Plan',
            type=PlanTypeEnum.MANUAL,
            status=PlanStatusEnum.ACTIVE,
        )

        # Act & Assert
        with pytest.raises(ValueError, match='Cannot accept plan with status PlanStatusEnum.ACTIVE to hybrid'):
            plan.accept_ai_proposal_as_hybrid('Modified text')

    @pytest.mark.asyncio
    async def test_update_plan_success(
        self,
        async_session: AsyncSession,
        sample_note: Note,
    ):
        """Test successful plan update."""
        # Arrange
        plan = Plan(
            note_id=sample_note.id,
            plan_text='Original Plan',
            type=PlanTypeEnum.MANUAL,
            status=PlanStatusEnum.ACTIVE,
        )
        async_session.add(plan)
        await async_session.commit()
        await async_session.refresh(plan)

        # Act
        new_text = 'Updated Plan Content'
        plan.update(new_text)

        # Assert
        assert plan.plan_text == new_text
        assert plan.type == PlanTypeEnum.MANUAL  # Should remain MANUAL
        assert plan.status == PlanStatusEnum.ACTIVE

    @pytest.mark.asyncio
    async def test_update_ai_plan_becomes_hybrid(
        self,
        async_session: AsyncSession,
        sample_note: Note,
    ):
        """Test that updating an AI plan changes it to HYBRID."""
        # Arrange
        plan = Plan(
            note_id=sample_note.id,
            plan_text='AI Generated Plan',
            type=PlanTypeEnum.AI,
            status=PlanStatusEnum.ACTIVE,
        )
        async_session.add(plan)
        await async_session.commit()
        await async_session.refresh(plan)

        # Act
        new_text = 'Modified AI Plan'
        plan.update(new_text)

        # Assert
        assert plan.plan_text == new_text
        assert plan.type == PlanTypeEnum.HYBRID  # Should change to HYBRID
        assert plan.status == PlanStatusEnum.ACTIVE

    @pytest.mark.asyncio
    async def test_update_hybrid_plan_stays_hybrid(
        self,
        async_session: AsyncSession,
        sample_note: Note,
    ):
        """Test that updating a HYBRID plan keeps it as HYBRID."""
        # Arrange
        plan = Plan(
            note_id=sample_note.id,
            plan_text='Hybrid Plan',
            type=PlanTypeEnum.HYBRID,
            status=PlanStatusEnum.ACTIVE,
        )
        async_session.add(plan)
        await async_session.commit()
        await async_session.refresh(plan)

        # Act
        new_text = 'Further Modified Hybrid Plan'
        plan.update(new_text)

        # Assert
        assert plan.plan_text == new_text
        assert plan.type == PlanTypeEnum.HYBRID  # Should remain HYBRID
        assert plan.status == PlanStatusEnum.ACTIVE

    @pytest.mark.asyncio
    async def test_update_plan_invalid_status(
        self,
        async_session: AsyncSession,
        sample_note: Note,
    ):
        """Test that updating plan fails for non-ACTIVE plans."""
        # Arrange
        plan = Plan(
            note_id=sample_note.id,
            plan_text='Pending AI Plan',
            type=PlanTypeEnum.AI,
            status=PlanStatusEnum.PENDING_AI,
        )

        # Act & Assert
        with pytest.raises(ValueError, match='Cannot update plan with status PlanStatusEnum.PENDING_AI'):
            plan.update('New text')

    @pytest.mark.asyncio
    async def test_create_manual_class_method(
        self,
        async_session: AsyncSession,
        sample_note: Note,
    ):
        """Test Plan.create_manual class method."""
        # Arrange
        plan_text = 'Manual plan content'

        # Act
        plan = Plan.create_manual(
            note_id=sample_note.id,
            plan_text=plan_text,
        )

        # Assert
        assert plan.note_id == sample_note.id
        assert plan.plan_text == plan_text
        assert plan.type == PlanTypeEnum.MANUAL
        assert plan.status == PlanStatusEnum.ACTIVE
        assert plan.id is None  # Not yet persisted

    @pytest.mark.asyncio
    async def test_create_ai_class_method(
        self,
        async_session: AsyncSession,
        sample_note: Note,
    ):
        """Test Plan.create_ai class method."""
        # Arrange
        plan_text = 'AI generated plan content'

        # Act
        plan = Plan.create_ai(
            note_id=sample_note.id,
            plan_text=plan_text,
        )

        # Assert
        assert plan.note_id == sample_note.id
        assert plan.plan_text == plan_text
        assert plan.type == PlanTypeEnum.AI
        assert plan.status == PlanStatusEnum.PENDING_AI
        assert plan.id is None  # Not yet persisted

    @pytest.mark.asyncio
    async def test_plan_timestamps_auto_set(
        self,
        async_session: AsyncSession,
        sample_note: Note,
    ):
        """Test that created_at and updated_at are automatically set."""
        # Arrange
        plan = Plan(
            note_id=sample_note.id,
            plan_text='Test plan for timestamps',
            type=PlanTypeEnum.MANUAL,
            status=PlanStatusEnum.ACTIVE,
        )

        # Act
        async_session.add(plan)
        await async_session.commit()
        await async_session.refresh(plan)

        # Assert
        assert plan.created_at is not None
        assert plan.updated_at is not None
        assert isinstance(plan.created_at, datetime)
        assert isinstance(plan.updated_at, datetime)

    @pytest.mark.asyncio
    async def test_plan_updated_at_changes_on_update(
        self,
        async_session: AsyncSession,
        sample_note: Note,
    ):
        """Test that updated_at changes when plan is updated."""
        # Arrange
        plan = Plan(
            note_id=sample_note.id,
            plan_text='Original text',
            type=PlanTypeEnum.MANUAL,
            status=PlanStatusEnum.ACTIVE,
        )
        async_session.add(plan)
        await async_session.commit()
        await async_session.refresh(plan)
        original_updated_at = plan.updated_at

        # Act
        plan.plan_text = 'Updated text'
        await async_session.commit()
        await async_session.refresh(plan)

        # Assert
        assert plan.updated_at > original_updated_at

    @pytest.mark.asyncio
    async def test_generation_id_uniqueness(
        self,
        async_session: AsyncSession,
        sample_note: Note,
    ):
        """Test that each plan gets a unique generation_id."""
        # Arrange & Act
        plan1 = Plan(
            note_id=sample_note.id,
            plan_text='First plan',
            type=PlanTypeEnum.MANUAL,
            status=PlanStatusEnum.ACTIVE,
        )
        async_session.add(plan1)

        plan2 = Plan(
            note_id=sample_note.id,
            plan_text='Second plan',
            type=PlanTypeEnum.AI,
            status=PlanStatusEnum.PENDING_AI,
        )
        async_session.add(plan2)

        await async_session.commit()
        await async_session.refresh(plan1)
        await async_session.refresh(plan2)

        # Assert
        assert plan1.generation_id != plan2.generation_id
        assert isinstance(plan1.generation_id, uuid.UUID)
        assert isinstance(plan2.generation_id, uuid.UUID)

    @pytest.mark.asyncio
    async def test_plan_note_relationship(
        self,
        async_session: AsyncSession,
        sample_note: Note,
    ):
        """Test the relationship between Plan and Note."""
        # Arrange
        plan = Plan(
            note_id=sample_note.id,
            plan_text='Test plan',
            type=PlanTypeEnum.MANUAL,
            status=PlanStatusEnum.ACTIVE,
        )
        async_session.add(plan)
        await async_session.commit()
        await async_session.refresh(plan)

        # Act - Load the relationship
        await async_session.refresh(plan, ['note'])

        # Assert
        assert plan.note is not None
        assert plan.note.id == sample_note.id
        assert plan.note.title == sample_note.title

    @pytest.mark.asyncio
    async def test_plan_empty_text_allowed(
        self,
        async_session: AsyncSession,
        sample_note: Note,
    ):
        """Test that empty plan text is allowed by the model."""
        # Arrange & Act
        plan = Plan(
            note_id=sample_note.id,
            plan_text='',  # Empty text
            type=PlanTypeEnum.MANUAL,
            status=PlanStatusEnum.ACTIVE,
        )
        async_session.add(plan)
        await async_session.commit()
        await async_session.refresh(plan)

        # Assert
        assert plan.plan_text == ''
        assert plan.id is not None

    @pytest.mark.asyncio
    async def test_plan_long_text(
        self,
        async_session: AsyncSession,
        sample_note: Note,
    ):
        """Test plan with very long text (within database limits)."""
        # Arrange
        long_text = 'A' * 1000  # 1000 characters
        plan = Plan(
            note_id=sample_note.id,
            plan_text=long_text,
            type=PlanTypeEnum.AI,
            status=PlanStatusEnum.PENDING_AI,
        )

        # Act
        async_session.add(plan)
        await async_session.commit()
        await async_session.refresh(plan)

        # Assert
        assert plan.plan_text == long_text
        assert len(plan.plan_text) == 1000

    @pytest.mark.asyncio
    async def test_plan_special_characters_in_text(
        self,
        async_session: AsyncSession,
        sample_note: Note,
    ):
        """Test plan with special characters and unicode."""
        # Arrange
        special_text = '🚀 Travel plan with émojis and açcénts! @#$%^&*() 测试 旅行计划 🌍'
        plan = Plan(
            note_id=sample_note.id,
            plan_text=special_text,
            type=PlanTypeEnum.MANUAL,
            status=PlanStatusEnum.ACTIVE,
        )

        # Act
        async_session.add(plan)
        await async_session.commit()
        await async_session.refresh(plan)

        # Assert
        assert plan.plan_text == special_text

    @pytest.mark.asyncio
    async def test_multiple_state_transitions(
        self,
        async_session: AsyncSession,
        sample_note: Note,
    ):
        """Test complex state transitions of a plan."""
        # Arrange - Create AI plan
        plan = Plan(
            note_id=sample_note.id,
            plan_text='Original AI Plan',
            type=PlanTypeEnum.AI,
            status=PlanStatusEnum.PENDING_AI,
        )
        async_session.add(plan)
        await async_session.commit()
        await async_session.refresh(plan)

        # Act 1 - Accept as hybrid
        plan.accept_ai_proposal_as_hybrid('Modified AI Plan')
        assert plan.type == PlanTypeEnum.HYBRID
        assert plan.status == PlanStatusEnum.ACTIVE

        # Act 2 - Update again
        plan.update('Further Modified Plan')
        assert plan.type == PlanTypeEnum.HYBRID  # Should remain HYBRID
        assert plan.plan_text == 'Further Modified Plan'

    @pytest.mark.asyncio
    async def test_edge_case_newlines_and_whitespace(
        self,
        async_session: AsyncSession,
        sample_note: Note,
    ):
        """Test plan with various whitespace and newline characters."""
        # Arrange
        text_with_whitespace = """Day 1:

        Morning: Visit Eiffel Tower

        Afternoon: Louvre Museum

        Evening: Seine River cruise
        """
        plan = Plan(
            note_id=sample_note.id,
            plan_text=text_with_whitespace,
            type=PlanTypeEnum.MANUAL,
            status=PlanStatusEnum.ACTIVE,
        )

        # Act
        async_session.add(plan)
        await async_session.commit()
        await async_session.refresh(plan)

        # Assert
        assert plan.plan_text == text_with_whitespace
        assert '\n' in plan.plan_text

    @pytest.mark.asyncio
    async def test_plan_str_representation(
        self,
        async_session: AsyncSession,
        sample_note: Note,
    ):
        """Test that plan has a reasonable string representation."""
        # Arrange
        plan = Plan(
            note_id=sample_note.id,
            plan_text='Test plan content',
            type=PlanTypeEnum.MANUAL,
            status=PlanStatusEnum.ACTIVE,
        )
        async_session.add(plan)
        await async_session.commit()
        await async_session.refresh(plan)

        # Act
        plan_str = str(plan)

        # Assert
        # The model should have some reasonable string representation
        # (exact format depends on implementation, but should not be empty)
        assert plan_str is not None
        assert len(plan_str) > 0
