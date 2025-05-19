from uuid import UUID

from src.apps.notes.models.note import Note
from src.apps.notes.repositories.note_repository import NoteRepository
from src.apps.plans.exceptions import AIServiceTimeoutError, AIServiceUnavailableError, PlanGenerationError
from src.apps.plans.models.plan import Plan
from src.apps.plans.repositories.plan_repository import PlanRepository
from src.apps.plans.services.plan_generation_service import PlanGenerationService
from src.apps.plans.usecases.dto.plan_dtos import GeneratePlanInDTO, GeneratePlanOutDTO
from src.apps.users.repositories.profile_repository import UserProfileRepository


class GeneratePlanUseCase:
    """Use case for generating travel plans."""

    def __init__(
        self,
        plan_repository: PlanRepository,
        note_repository: NoteRepository,
        user_profile_repository: UserProfileRepository,
        plan_generation_service: PlanGenerationService,
    ):
        self.plan_repository = plan_repository
        self.note_repository = note_repository
        self.user_profile_repository = user_profile_repository
        self.plan_generation_service = plan_generation_service

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
            AIServiceTimeoutError: If the AI service times out
            AIServiceUnavailableError: If the AI service is unavailable
        """
        note = await self._get_note(
            note_id=input_dto.note_id,
            user_id=input_dto.user_id,
        )

        user_preferences = await self._get_user_preferences(user_id=input_dto.user_id)

        plan_text = await self._generate_plan_text(
            note_content=note.title,
            user_preferences=user_preferences,
            note_id=input_dto.note_id,
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

    async def _get_user_preferences(self, user_id: UUID) -> dict:
        """Retrieve user preferences for plan generation."""
        return await self.user_profile_repository.get_user_preferences(user_id=user_id)

    async def _generate_plan_text(self, note_content: str, user_preferences: dict, note_id: int) -> str:
        """
        Generate plan text using the AI service.

        Args:
            note_content: Content of the note
            user_preferences: User travel preferences
            note_id: ID of the note (for error reporting)

        Returns:
            Generated plan text

        Raises:
            AIServiceTimeoutError: If the AI service times out
            AIServiceUnavailableError: If the AI service is unavailable
            PlanGenerationError: If there's a general error during plan generation
        """
        try:
            return await self.plan_generation_service.generate_plan(
                note_content=note_content,
                user_preferences=user_preferences,
            )
        except (AIServiceTimeoutError, AIServiceUnavailableError):
            raise
        except Exception as exc:
            raise PlanGenerationError(note_id, str(exc)) from exc

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
