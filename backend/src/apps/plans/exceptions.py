class PlanBaseError(Exception):
    """Base class for all Plan-related exceptions."""


class PlanGenerationError(PlanBaseError):
    """Raised when there is an error during plan generation."""

    def __init__(self, note_id, message='Error occurred during plan generation'):
        self.note_id = note_id
        self.message = message
        super().__init__(f'{message} for note {note_id}')


class AIServiceUnavailableError(PlanBaseError):
    """Raised when the AI service is unavailable."""

    def __init__(self):
        self.message = 'AI service is currently unavailable'
        super().__init__(self.message)


class AIServiceTimeoutError(PlanBaseError):
    """Raised when the AI service times out."""

    def __init__(self, timeout_seconds=5):
        self.timeout_seconds = timeout_seconds
        self.message = f'AI service request timed out after {timeout_seconds} seconds'
        super().__init__(self.message)
