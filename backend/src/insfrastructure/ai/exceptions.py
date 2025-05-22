class AIBaseError(Exception):
    """Base class for all AI-related exceptions."""

    def __init__(self, message='An error occurred in the AI service'):
        self.message = message
        super().__init__(self.message)


class AIServiceTimeoutError(AIBaseError):
    """Raised when the AI service times out."""

    def __init__(self, timeout_seconds=5):
        self.timeout_seconds = timeout_seconds
        self.message = f'AI service request timed out after {timeout_seconds} seconds'
        super().__init__(self.message)


class AIServiceUnavailableError(AIBaseError):
    """Raised when the AI service is unavailable."""

    def __init__(self):
        self.message = 'AI service is currently unavailable'
        super().__init__(self.message)


class AIModelError(AIBaseError):
    """Raised for model-specific errors during generation."""

    def __init__(self, message='Error occurred during model request'):
        self.message = message
        super().__init__(self.message)
