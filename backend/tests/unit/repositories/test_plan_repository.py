"""Unit tests for PlanRepository class."""

import uuid
from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.apps.notes.models.note import Note
from src.apps.plans.enums import PlanStatusEnum, PlanTypeEnum
from src.apps.plans.exceptions import PlanNotFoundError
from src.apps.plans.models.plan import Plan
from src.apps.plans.repositories.plan_repository import PlanRepository
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
async def another_user(async_session: AsyncSession) -> User:
    """Create another user for testing ownership constraints."""
    user = User(
        id=uuid.uuid4(),
        email=f'another_{uuid.uuid4().hex[:8]}@example.com',  # Unique email
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
        date_from=datetime.now(UTC).date() + timedelta(days=30),
        date_to=datetime.now(UTC).date() + timedelta(days=37),
        number_of_people=2,
        key_ideas='Eiffel Tower, Louvre Museum, Seine River cruise',
    )
    async_session.add(note)
    await async_session.commit()
    await async_session.refresh(note)
    return note


@pytest.fixture
async def another_note(async_session: AsyncSession, another_user: User) -> Note:
    """Create a note for another user."""
    note = Note(
        user_id=another_user.id,
        title='Another Trip',
        place='Tokyo, Japan',
        date_from=datetime.now(tz=UTC).date() + timedelta(days=60),
        date_to=datetime.now(tz=UTC).date() + timedelta(days=67),
        number_of_people=1,
        key_ideas='Tokyo Tower, Shibuya Crossing, Tsukiji Market',
    )
    async_session.add(note)
    await async_session.commit()
    await async_session.refresh(note)
    return note


@pytest.fixture
async def sample_plan_data() -> dict:
    """Sample plan data for testing."""
    return {
        'plan_text': 'Day 1: Visit Eiffel Tower...',
        'type': PlanTypeEnum.MANUAL,
        'status': PlanStatusEnum.ACTIVE,
    }


@pytest.fixture
async def sample_plan(async_session: AsyncSession, sample_note: Note, sample_plan_data: dict) -> Plan:
    """Create a sample plan for testing."""
    plan = Plan(
        note_id=sample_note.id,
        **sample_plan_data,
    )
    async_session.add(plan)
    await async_session.commit()
    await async_session.refresh(plan)
    return plan


class TestPlanRepository:
    """Test cases for PlanRepository."""

    @pytest.mark.asyncio
    async def test_create_plan_success(
        self,
        async_session: AsyncSession,
        sample_note: Note,
        sample_plan_data: dict,
    ):
        """Test successful plan creation."""
        # Arrange
        repository = PlanRepository(session=async_session)
        plan = Plan(
            note_id=sample_note.id,
            **sample_plan_data,
        )

        # Act
        created_plan = await repository.create(plan)

        # Assert
        assert created_plan.id is not None
        assert created_plan.note_id == sample_note.id
        assert created_plan.plan_text == sample_plan_data['plan_text']
        assert created_plan.type == sample_plan_data['type']
        assert created_plan.status == sample_plan_data['status']
        assert created_plan.generation_id is not None
        assert created_plan.created_at is not None
        assert created_plan.updated_at is not None

        # Verify plan is in database
        query = select(Plan).where(Plan.id == created_plan.id)
        result = await async_session.execute(query)
        db_plan = result.scalar_one_or_none()
        assert db_plan is not None
        assert db_plan.id == created_plan.id

    @pytest.mark.asyncio
    async def test_create_ai_plan_with_pending_status(
        self,
        async_session: AsyncSession,
        sample_note: Note,
    ):
        """Test creating an AI plan with PENDING_AI status."""
        # Arrange
        repository = PlanRepository(session=async_session)
        plan_data = {
            'plan_text': 'AI Generated: Day 1: Explore the city center...',
            'type': PlanTypeEnum.AI,
            'status': PlanStatusEnum.PENDING_AI,
        }
        plan = Plan(
            note_id=sample_note.id,
            **plan_data,
        )

        # Act
        created_plan = await repository.create(plan)

        # Assert
        assert created_plan.type == PlanTypeEnum.AI
        assert created_plan.status == PlanStatusEnum.PENDING_AI
        assert created_plan.plan_text == plan_data['plan_text']

    @pytest.mark.asyncio
    async def test_create_hybrid_plan(
        self,
        async_session: AsyncSession,
        sample_note: Note,
    ):
        """Test creating a hybrid plan."""
        # Arrange
        repository = PlanRepository(session=async_session)
        plan_data = {
            'plan_text': 'Modified AI plan with user changes...',
            'type': PlanTypeEnum.HYBRID,
            'status': PlanStatusEnum.ACTIVE,
        }
        plan = Plan(
            note_id=sample_note.id,
            **plan_data,
        )

        # Act
        created_plan = await repository.create(plan)

        # Assert
        assert created_plan.type == PlanTypeEnum.HYBRID
        assert created_plan.status == PlanStatusEnum.ACTIVE
        assert created_plan.plan_text == plan_data['plan_text']

    @pytest.mark.asyncio
    async def test_update_plan_success(
        self,
        async_session: AsyncSession,
        sample_plan: Plan,
    ):
        """Test successful plan update."""
        # Arrange
        repository = PlanRepository(session=async_session)
        original_updated_at = sample_plan.updated_at
        sample_plan.plan_text = 'Updated plan text...'

        # Act
        updated_plan = await repository.update_plan(sample_plan)

        # Assert
        assert updated_plan.id == sample_plan.id
        assert updated_plan.plan_text == 'Updated plan text...'
        assert updated_plan.updated_at > original_updated_at

        # Verify in database
        query = select(Plan).where(Plan.id == sample_plan.id)
        result = await async_session.execute(query)
        db_plan = result.scalar_one_or_none()
        assert db_plan.plan_text == 'Updated plan text...'

    @pytest.mark.asyncio
    async def test_get_by_generation_id_and_note_id_and_status_success(
        self,
        async_session: AsyncSession,
        sample_note: Note,
    ):
        """Test successful retrieval by generation_id, note_id, and status."""
        # Arrange
        repository = PlanRepository(session=async_session)
        plan = Plan(
            note_id=sample_note.id,
            plan_text='Test plan for retrieval',
            type=PlanTypeEnum.AI,
            status=PlanStatusEnum.PENDING_AI,
        )
        created_plan = await repository.create(plan)

        # Act
        retrieved_plan = await repository.get_by_generation_id_and_note_id_and_status(
            generation_id=created_plan.generation_id,
            note_id=sample_note.id,
            status=PlanStatusEnum.PENDING_AI,
        )

        # Assert
        assert retrieved_plan.id == created_plan.id
        assert retrieved_plan.generation_id == created_plan.generation_id
        assert retrieved_plan.note_id == sample_note.id
        assert retrieved_plan.status == PlanStatusEnum.PENDING_AI

    @pytest.mark.asyncio
    async def test_get_by_generation_id_and_note_id_and_status_not_found(
        self,
        async_session: AsyncSession,
        sample_note: Note,
    ):
        """Test retrieval with non-existent generation_id raises PlanNotFoundError."""
        # Arrange
        repository = PlanRepository(session=async_session)
        non_existent_generation_id = uuid.uuid4()

        # Act & Assert
        with pytest.raises(PlanNotFoundError) as exc_info:
            await repository.get_by_generation_id_and_note_id_and_status(
                generation_id=non_existent_generation_id,
                note_id=sample_note.id,
                status=PlanStatusEnum.PENDING_AI,
            )

        assert exc_info.value.generation_id == non_existent_generation_id
        assert exc_info.value.note_id == sample_note.id

    @pytest.mark.asyncio
    async def test_get_by_generation_id_and_note_id_and_status_wrong_status(
        self,
        async_session: AsyncSession,
        sample_note: Note,
    ):
        """Test retrieval with wrong status raises PlanNotFoundError."""
        # Arrange
        repository = PlanRepository(session=async_session)
        plan = Plan(
            note_id=sample_note.id,
            plan_text='Test plan',
            type=PlanTypeEnum.AI,
            status=PlanStatusEnum.PENDING_AI,
        )
        created_plan = await repository.create(plan)

        # Act & Assert
        with pytest.raises(PlanNotFoundError):
            await repository.get_by_generation_id_and_note_id_and_status(
                generation_id=created_plan.generation_id,
                note_id=sample_note.id,
                status=PlanStatusEnum.ACTIVE,  # Wrong status
            )

    @pytest.mark.asyncio
    async def test_get_by_generation_id_and_note_id_and_status_wrong_note_id(
        self,
        async_session: AsyncSession,
        sample_note: Note,
        another_note: Note,
    ):
        """Test retrieval with wrong note_id raises PlanNotFoundError."""
        # Arrange
        repository = PlanRepository(session=async_session)
        plan = Plan(
            note_id=sample_note.id,
            plan_text='Test plan',
            type=PlanTypeEnum.AI,
            status=PlanStatusEnum.PENDING_AI,
        )
        created_plan = await repository.create(plan)

        # Act & Assert
        with pytest.raises(PlanNotFoundError):
            await repository.get_by_generation_id_and_note_id_and_status(
                generation_id=created_plan.generation_id,
                note_id=another_note.id,  # Wrong note_id
                status=PlanStatusEnum.PENDING_AI,
            )

    @pytest.mark.asyncio
    async def test_get_by_generation_id_and_note_id_and_status_with_for_update(
        self,
        async_session: AsyncSession,
        sample_note: Note,
    ):
        """Test retrieval with for_update=True."""
        # Arrange
        repository = PlanRepository(session=async_session)
        plan = Plan(
            note_id=sample_note.id,
            plan_text='Test plan for update lock',
            type=PlanTypeEnum.AI,
            status=PlanStatusEnum.PENDING_AI,
        )
        created_plan = await repository.create(plan)

        # Act
        retrieved_plan = await repository.get_by_generation_id_and_note_id_and_status(
            generation_id=created_plan.generation_id,
            note_id=sample_note.id,
            status=PlanStatusEnum.PENDING_AI,
            for_update=True,
        )

        # Assert
        assert retrieved_plan.id == created_plan.id
        # Note: Actual row locking is hard to test in unit tests,
        # but we can verify the method doesn't fail

    @pytest.mark.asyncio
    async def test_get_last_updated_by_note_id_and_status_success(
        self,
        async_session: AsyncSession,
        sample_note: Note,
    ):
        """Test successful retrieval of the last updated plan."""
        # Arrange
        repository = PlanRepository(session=async_session)

        # Create first plan
        plan1 = Plan(
            note_id=sample_note.id,
            plan_text='First plan',
            type=PlanTypeEnum.MANUAL,
            status=PlanStatusEnum.ACTIVE,
        )
        await repository.create(plan1)

        # Wait a bit to ensure different timestamps
        await async_session.commit()

        # Create second plan (should be the most recent)
        plan2 = Plan(
            note_id=sample_note.id,
            plan_text='Second plan',
            type=PlanTypeEnum.MANUAL,
            status=PlanStatusEnum.ACTIVE,
        )
        await repository.create(plan2)

        # Act
        last_plan = await repository.get_last_updated_by_note_id_and_status(
            note_id=sample_note.id,
            status=PlanStatusEnum.ACTIVE,
        )

        # Assert
        assert last_plan is not None
        assert last_plan.id == plan2.id
        assert last_plan.plan_text == 'Second plan'

    @pytest.mark.asyncio
    async def test_get_last_updated_by_note_id_and_status_no_plans(
        self,
        async_session: AsyncSession,
        sample_note: Note,
    ):
        """Test retrieval when no plans exist for the note and status."""
        # Arrange
        repository = PlanRepository(session=async_session)

        # Act
        result = await repository.get_last_updated_by_note_id_and_status(
            note_id=sample_note.id,
            status=PlanStatusEnum.ACTIVE,
        )

        # Assert
        assert result is None

    @pytest.mark.asyncio
    async def test_get_last_updated_by_note_id_and_status_wrong_status(
        self,
        async_session: AsyncSession,
        sample_note: Note,
    ):
        """Test retrieval with wrong status returns None."""
        # Arrange
        repository = PlanRepository(session=async_session)
        plan = Plan(
            note_id=sample_note.id,
            plan_text='Test plan',
            type=PlanTypeEnum.MANUAL,
            status=PlanStatusEnum.ACTIVE,
        )
        await repository.create(plan)

        # Act
        result = await repository.get_last_updated_by_note_id_and_status(
            note_id=sample_note.id,
            status=PlanStatusEnum.PENDING_AI,  # Wrong status
        )

        # Assert
        assert result is None

    @pytest.mark.asyncio
    async def test_get_last_updated_ordering(
        self,
        async_session: AsyncSession,
        sample_note: Note,
    ):
        """Test that the method returns the truly last updated plan."""
        # Arrange
        repository = PlanRepository(session=async_session)

        # Create and update plans to test ordering
        plan1 = Plan(
            note_id=sample_note.id,
            plan_text='First plan',
            type=PlanTypeEnum.MANUAL,
            status=PlanStatusEnum.ACTIVE,
        )
        created_plan1 = await repository.create(plan1)

        plan2 = Plan(
            note_id=sample_note.id,
            plan_text='Second plan',
            type=PlanTypeEnum.MANUAL,
            status=PlanStatusEnum.ACTIVE,
        )
        created_plan2 = await repository.create(plan2)

        # Update the first plan to make it the most recently updated
        created_plan1.plan_text = 'Updated first plan'
        updated_plan1 = await repository.update_plan(created_plan1)

        # Act
        last_plan = await repository.get_last_updated_by_note_id_and_status(
            note_id=sample_note.id,
            status=PlanStatusEnum.ACTIVE,
        )

        # Assert
        assert last_plan is not None
        assert last_plan.id == updated_plan1.id
        assert last_plan.plan_text == 'Updated first plan'
        assert last_plan.updated_at > created_plan2.updated_at

    @pytest.mark.asyncio
    async def test_get_last_updated_filters_by_note_id(
        self,
        async_session: AsyncSession,
        sample_note: Note,
        another_note: Note,
    ):
        """Test that the method correctly filters by note_id."""
        # Arrange
        repository = PlanRepository(session=async_session)

        # Create plan for first note
        plan1 = Plan(
            note_id=sample_note.id,
            plan_text='Plan for first note',
            type=PlanTypeEnum.MANUAL,
            status=PlanStatusEnum.ACTIVE,
        )
        await repository.create(plan1)

        # Create plan for second note
        plan2 = Plan(
            note_id=another_note.id,
            plan_text='Plan for second note',
            type=PlanTypeEnum.MANUAL,
            status=PlanStatusEnum.ACTIVE,
        )
        await repository.create(plan2)

        # Act
        result1 = await repository.get_last_updated_by_note_id_and_status(
            note_id=sample_note.id,
            status=PlanStatusEnum.ACTIVE,
        )
        result2 = await repository.get_last_updated_by_note_id_and_status(
            note_id=another_note.id,
            status=PlanStatusEnum.ACTIVE,
        )

        # Assert
        assert result1.note_id == sample_note.id
        assert result1.plan_text == 'Plan for first note'
        assert result2.note_id == another_note.id
        assert result2.plan_text == 'Plan for second note'

    @pytest.mark.asyncio
    async def test_plan_generation_id_uniqueness(
        self,
        async_session: AsyncSession,
        sample_note: Note,
    ):
        """Test that each plan gets a unique generation_id."""
        # Arrange
        repository = PlanRepository(session=async_session)

        # Create multiple plans
        plan1 = Plan(
            note_id=sample_note.id,
            plan_text='First plan',
            type=PlanTypeEnum.MANUAL,
            status=PlanStatusEnum.ACTIVE,
        )
        created_plan1 = await repository.create(plan1)

        plan2 = Plan(
            note_id=sample_note.id,
            plan_text='Second plan',
            type=PlanTypeEnum.AI,
            status=PlanStatusEnum.PENDING_AI,
        )
        created_plan2 = await repository.create(plan2)

        # Assert
        assert created_plan1.generation_id != created_plan2.generation_id
        assert isinstance(created_plan1.generation_id, uuid.UUID)
        assert isinstance(created_plan2.generation_id, uuid.UUID)

    @pytest.mark.asyncio
    async def test_plan_cascade_delete(
        self,
        async_session: AsyncSession,
        sample_note: Note,
    ):
        """Test that plans are deleted when the associated note is deleted."""
        # Arrange
        repository = PlanRepository(session=async_session)
        plan = Plan(
            note_id=sample_note.id,
            plan_text='Test plan for cascade',
            type=PlanTypeEnum.MANUAL,
            status=PlanStatusEnum.ACTIVE,
        )
        created_plan = await repository.create(plan)
        plan_id = created_plan.id

        # Act - Delete the note
        await async_session.delete(sample_note)
        await async_session.commit()

        # Assert - Plan should be deleted due to cascade
        query = select(Plan).where(Plan.id == plan_id)
        result = await async_session.execute(query)
        deleted_plan = result.scalar_one_or_none()
        assert deleted_plan is None

    @pytest.mark.asyncio
    async def test_multiple_plans_different_statuses(
        self,
        async_session: AsyncSession,
        sample_note: Note,
    ):
        """Test handling plans with different statuses for the same note."""
        # Arrange
        repository = PlanRepository(session=async_session)

        # Create pending AI plan
        pending_plan = Plan(
            note_id=sample_note.id,
            plan_text='Pending AI plan',
            type=PlanTypeEnum.AI,
            status=PlanStatusEnum.PENDING_AI,
        )
        created_pending = await repository.create(pending_plan)

        # Create active plan
        active_plan = Plan(
            note_id=sample_note.id,
            plan_text='Active plan',
            type=PlanTypeEnum.MANUAL,
            status=PlanStatusEnum.ACTIVE,
        )
        created_active = await repository.create(active_plan)

        # Act & Assert
        # Should find pending plan when searching for PENDING_AI
        pending_result = await repository.get_last_updated_by_note_id_and_status(
            note_id=sample_note.id,
            status=PlanStatusEnum.PENDING_AI,
        )
        assert pending_result.id == created_pending.id

        # Should find active plan when searching for ACTIVE
        active_result = await repository.get_last_updated_by_note_id_and_status(
            note_id=sample_note.id,
            status=PlanStatusEnum.ACTIVE,
        )
        assert active_result.id == created_active.id

        # Should find pending plan by generation_id
        pending_by_generation = await repository.get_by_generation_id_and_note_id_and_status(
            generation_id=created_pending.generation_id,
            note_id=sample_note.id,
            status=PlanStatusEnum.PENDING_AI,
        )
        assert pending_by_generation.id == created_pending.id

    @pytest.mark.asyncio
    async def test_edge_case_empty_plan_text(
        self,
        async_session: AsyncSession,
        sample_note: Note,
    ):
        """Test handling plan with minimal content."""
        # Arrange
        repository = PlanRepository(session=async_session)
        plan = Plan(
            note_id=sample_note.id,
            plan_text='',  # Empty plan text
            type=PlanTypeEnum.MANUAL,
            status=PlanStatusEnum.ACTIVE,
        )

        # Act
        created_plan = await repository.create(plan)

        # Assert
        assert created_plan.plan_text == ''
        assert created_plan.id is not None

    @pytest.mark.asyncio
    async def test_edge_case_very_long_plan_text(
        self,
        async_session: AsyncSession,
        sample_note: Note,
    ):
        """Test handling plan with very long text (within limits)."""
        # Arrange
        repository = PlanRepository(session=async_session)
        long_text = 'A' * 1000  # 1000 characters
        plan = Plan(
            note_id=sample_note.id,
            plan_text=long_text,
            type=PlanTypeEnum.AI,
            status=PlanStatusEnum.PENDING_AI,
        )

        # Act
        created_plan = await repository.create(plan)

        # Assert
        assert created_plan.plan_text == long_text
        assert len(created_plan.plan_text) == 1000
