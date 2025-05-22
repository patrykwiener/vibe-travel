from uuid import UUID


class PlanBaseError(Exception):
    """Base class for all Plan-related exceptions."""


class PlanGenerationError(PlanBaseError):
    """Raised when there is an error during plan generation."""

    def __init__(self, note_id: int, message: str = 'Error occurred during plan generation'):
        self.note_id = note_id
        self.message = message
        super().__init__(f'{message} for note {note_id}')


class PlanNotFoundError(PlanBaseError):
    """Raised when a plan is not found."""

    def __init__(self, generation_id: UUID | None = None, note_id: int | None = None):
        self.generation_id = generation_id
        self.note_id = note_id
        message = 'Plan not found'
        if generation_id:
            message += f' with generation_id {generation_id}'
        if note_id:
            message += f' for note {note_id}'
        self.message = message
        super().__init__(self.message)


class ActivePlanNotFoundError(PlanBaseError):
    """Raised when an active plan is not found."""

    def __init__(self, note_id: int):
        self.note_id = note_id
        self.message = f'No active plan found for note {note_id}'
        super().__init__(self.message)


class PlanConflictError(PlanBaseError):
    """Raised when an active plan already exists for a note."""

    def __init__(self, note_id: int):
        self.note_id = note_id
        self.message = f'An active plan already exists for note {note_id}'
        super().__init__(self.message)
