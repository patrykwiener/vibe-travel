from src.apps.plans.interfaces.prompt_adapter import AbstractTravelPlanPromptAdapter
from src.apps.plans.usecases.dto.plan_generation_dto import TravelPlanGenerationDTO
from src.insfrastructure.ai.prompts import AIPrompt, Message


class TravelPlanPromptAdapter(AbstractTravelPlanPromptAdapter):
    """
    Adapter that builds AI prompts for travel plan generation.

    This adapter translates domain concepts (note travel info, user preferences)
    into the appropriate format for AI model communication.
    """

    MAX_LENGTH_CORRECTION = 1000

    def __init__(self, model: str):
        """
        Initialize prompt adapter with model ID.

        Args:
            model: The AI model identifier to use for generation
        """
        self.model = model

    def build_prompt(
        self,
        travel_plan_dto: TravelPlanGenerationDTO,
        max_tokens: int | None = None,
        temperature: float | None = None,
    ) -> AIPrompt:
        """
        Build a complete prompt for travel plan generation.

        Args:
            travel_plan_dto: Combined DTO with note information and user preferences
            max_tokens: Optional maximum tokens for the AI response
            temperature: Optional temperature for the AI response

        Returns:
            AIPrompt object with all messages configured
        """
        messages = [
            self._build_system_message(travel_plan_dto),
            self._build_user_message(travel_plan_dto),
        ]

        return AIPrompt(
            messages=messages,
            model=self.model,
            max_tokens=max_tokens,
            temperature=temperature,
        )

    def _build_system_message(self, travel_plan_dto: 'TravelPlanGenerationDTO') -> Message:
        """Build system message incorporating user preferences from the DTO."""
        content = (
            'You are a travel planning assistant. Create detailed travel plans that include:\n'
            '- Daily activities and attractions\n'
            '- Dining recommendations\n'
            '- Accommodation suggestions\n'
            '- Transportation tips'
            "Don't include any information about the weather.\n"
            'Use a friendly and engaging tone.\n'
            'Be creative and provide unique suggestions.\n'
            'Avoid generic or overly common recommendations.\n'
            'Be concise and clear in your responses but add some flair (maybe some interesting facts or anecdotes).\n'
            'The plan should be organized but involving some creativity.\n'
            'Use bullet points or numbered lists for easy readability.\n'
            'Include a summary at the end of the plan.'
            'Do not include emojis.\n'
            'Generate only the plan. Do not include any additional text, discussion, disclaimer, explaination '
            'or questions.\n'
        )

        pref_lines = []
        if travel_plan_dto.budget:
            pref_lines.append(f'Budget level: {travel_plan_dto.budget}')
        if travel_plan_dto.preferred_pace:
            pref_lines.append(f'Travel pace: {travel_plan_dto.preferred_pace}')
        if travel_plan_dto.travel_style:
            pref_lines.append(f'Travel style: {travel_plan_dto.travel_style}')

        if pref_lines:
            content += '\n\nConsider these preferences:\n' + '\n'.join(pref_lines)

        content += (
            f'\n\nTravel plan max length: {travel_plan_dto.max_length - self.MAX_LENGTH_CORRECTION} characters\n\n'
        )

        return Message(role='system', content=content)

    def _build_user_message(self, travel_plan_dto: TravelPlanGenerationDTO) -> Message:
        """Build user message with note travel information from the DTO."""
        # Calculate trip duration
        trip_duration = (travel_plan_dto.date_to - travel_plan_dto.date_from).days + 1

        content = (
            f'Create a detailed travel plan for {travel_plan_dto.place} '
            f'from {travel_plan_dto.date_from.isoformat()} to {travel_plan_dto.date_to.isoformat()} '
            f'({trip_duration} days) for {travel_plan_dto.number_of_people} people.\n\n'
            f'Trip title: {travel_plan_dto.title}\n\n'
        )

        if travel_plan_dto.key_ideas:
            content += f'Additional notes/ideas: {travel_plan_dto.key_ideas}\n\n'

        content += 'Organize the plan by days and include specific recommendations.'

        return Message(role='user', content=content)
