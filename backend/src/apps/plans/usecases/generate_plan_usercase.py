from uuid import UUID

from src.apps.notes.models.note import Note
from src.apps.notes.repositories.note_repository import NoteRepository
from src.apps.plans.models.plan import Plan
from src.apps.plans.repositories.plan_repository import PlanRepository
from src.apps.plans.services.plan_generation_service import PlanGenerationService
from src.apps.plans.usecases.dto.plan_dtos import GeneratePlanInDTO, GeneratePlanOutDTO
from src.apps.plans.usecases.dto.plan_generation_dto import TravelPlanGenerationDTO
from src.apps.users.exceptions import ProfileNotFoundError
from src.apps.users.models.profile import UserProfile
from src.apps.users.repositories.profile_repository import UserProfileRepository


class GeneratePlanUseCase:
    """Use case for generating travel plans."""

    def __init__(
        self,
        plan_repository: PlanRepository,
        note_repository: NoteRepository,
        user_profile_repository: UserProfileRepository,
        plan_generation_service: PlanGenerationService,
        plan_max_length: int,
    ):
        self.plan_repository = plan_repository
        self.note_repository = note_repository
        self.user_profile_repository = user_profile_repository
        self.plan_generation_service = plan_generation_service
        self.plan_max_length = plan_max_length

    async def execute(self, input_dto: GeneratePlanInDTO) -> GeneratePlanOutDTO:
        """
        Execute the use case to generate a travel plan.

        Args:
            input_dto: Input DTO containing note_id and user_id

        Returns:
            Output DTO containing generation_id, plan_text, and status

        Raises:
            NoteNotFoundError: If the note doesn't exist
            UserProfileNotFoundError: If the user profile doesn't exist
            PlanGenerationError: If there's an error during plan generation
        """
        note = await self._get_note(
            note_id=input_dto.note_id,
            user_id=input_dto.user_id,
        )

        user_profile = await self._get_user_profile(user_id=input_dto.user_id)

        plan_text = await self._generate_plan_text(
            note=note,
            user_profile=user_profile,
        )

        plan = await self._store_plan_proposal(
            note_id=input_dto.note_id,
            plan_text=plan_text,
        )

        return self._create_output_dto(plan)

    async def _get_note(self, note_id: int, user_id: UUID) -> Note:
        """
        Retrieve the note for which a plan will be generated.

        Raises:
            NoteNotFoundError: If the note doesn't exist or doesn't belong to the user
        """
        return await self.note_repository.get_by_id(note_id=note_id, user_id=user_id)

    async def _get_user_profile(self, user_id: UUID) -> UserProfile:
        """Retrieve user preferences for plan generation."""
        user_profile = await self.user_profile_repository.get_by_user_id(user_id=user_id)
        if user_profile is None:
            raise ProfileNotFoundError
        return user_profile

    async def _generate_plan_text(self, note: Note, user_profile: UserProfile) -> str:
        """
        Generate plan text using the AI service.

        Args:
            note: The note object
            user_profile: User profile containing travel preferences

        Returns:
            Generated plan text

        Raises:
            PlanGenerationError: If there's an error during plan generation
        """
        travel_plan_dto = TravelPlanGenerationDTO.from_note_and_profile(
            note=note,
            user_profile=user_profile,
            max_length=self.plan_max_length,
        )

        return await self.plan_generation_service.generate_plan(
            travel_plan_dto=travel_plan_dto,
        )

    async def _store_plan_proposal(self, note_id: int, plan_text: str) -> Plan:
        """Store the generated plan proposal in the database."""
        return await self.plan_repository.create(
            plan=Plan.create_ai(
                note_id=note_id,
                plan_text=plan_text,
            )
        )

    def _create_output_dto(self, plan: Plan) -> GeneratePlanOutDTO:
        """Create the output DTO from the plan entity."""
        return GeneratePlanOutDTO(
            generation_id=plan.generation_id,
            plan_text=plan.plan_text,
            status=plan.status,
        )
