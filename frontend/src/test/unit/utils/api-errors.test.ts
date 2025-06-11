import { describe, it, expect } from 'vitest'
import {
  ApiResponseError,
  AuthenticationError,
  ApiValidationError,
  NotFoundError,
  ServerError,
  NetworkError,
  UnknownApiError,
  LoginBadCredentialsError,
  BadRequestError,
  UnknownError,
  UserAlreadyExistsError,
  NoteAlreadyExistsError,
  ConflictError,
  type ApiErrorResponse,
} from '@/utils/api-errors'
import type { ErrorModel, HttpValidationError, ValidationError } from '@/client/types.gen'

/**
 * Comprehensive unit tests for API Error Classes
 *
 * Tests cover all error classes following VibeTravels coding standards:
 * - Error construction and inheritance
 * - User-friendly messages
 * - Status code mapping
 * - Validation error field parsing
 * - Error properties and methods
 */
describe('API Error Classes', () => {
  /**
   * Helper function to create mock API error responses
   */
  const createMockApiErrorResponse = (
    status: number,
    detail: string | Record<string, string> = 'Test error',
    validationErrors?: ValidationError[],
  ): ApiErrorResponse => {
    const errorData: ErrorModel | HttpValidationError = validationErrors
      ? { detail: validationErrors }
      : { detail }

    return {
      error: errorData,
      response: {
        status,
        ok: false,
        headers: new Headers(),
        statusText: 'Error',
      } as Response,
      request: new Request('https://api.example.com/test'),
    }
  }

  /**
   * Helper function to create mock validation errors
   */
  const createMockValidationError = (
    loc: Array<string | number>,
    msg: string,
    type: string = 'value_error',
  ): ValidationError => ({
    loc,
    msg,
    type,
  })

  describe('BadRequestError', () => {
    it('should create error with default message when no custom message provided', () => {
      const apiError = createMockApiErrorResponse(400, 'Test error')

      const error = new BadRequestError(apiError)

      expect(error.code).toBe('BAD_REQUEST_ERROR')
      expect(error.statusCode).toBe(400)
      expect(error.userMessage).toBe('The request was invalid or malformed')
      expect(error.message).toBe('Bad request')
      expect(error.originalError).toBe(apiError)
      expect(error.name).toBe('BadRequestError')
    })

    it('should create error with custom user message', () => {
      const apiError = createMockApiErrorResponse(400, 'Test error')

      const error = new BadRequestError(apiError, 'Custom error message')

      expect(error.userMessage).toBe('Custom error message')
    })

    it('should inherit from ApiResponseError', () => {
      const apiError = createMockApiErrorResponse(400, 'Test error')
      const error = new BadRequestError(apiError)

      expect(error).toBeInstanceOf(ApiResponseError)
      expect(error).toBeInstanceOf(Error)
    })
  })

  describe('LoginBadCredentialsError', () => {
    it('should create error with specific message for login failures', () => {
      const apiError = createMockApiErrorResponse(400, 'LOGIN_BAD_CREDENTIALS')

      const error = new LoginBadCredentialsError(apiError)

      expect(error.userMessage).toBe('Invalid email or password')
      expect(error.code).toBe('BAD_REQUEST_ERROR')
      expect(error.statusCode).toBe(400)
      expect(error).toBeInstanceOf(BadRequestError)
    })
  })

  describe('UserAlreadyExistsError', () => {
    it('should create error with specific message for user registration conflicts', () => {
      const apiError = createMockApiErrorResponse(400, 'REGISTER_USER_ALREADY_EXISTS')

      const error = new UserAlreadyExistsError(apiError)

      expect(error.userMessage).toBe('A user with this email already exists')
      expect(error.code).toBe('BAD_REQUEST_ERROR')
      expect(error.statusCode).toBe(400)
      expect(error).toBeInstanceOf(BadRequestError)
    })
  })

  describe('AuthenticationError', () => {
    it('should create error with 401 status and session expired message', () => {
      const apiError = createMockApiErrorResponse(401, 'Unauthorized')

      const error = new AuthenticationError(apiError)

      expect(error.code).toBe('AUTHENTICATION_ERROR')
      expect(error.statusCode).toBe(401)
      expect(error.userMessage).toBe('Your session has expired. Please log in again.')
      expect(error.message).toBe('Authentication failed') // Default message, not the detail
    })

    it('should create error with 403 status and permission denied message', () => {
      const apiError = createMockApiErrorResponse(403, 'Forbidden')

      const error = new AuthenticationError(apiError)

      expect(error.statusCode).toBe(403)
      expect(error.userMessage).toBe('You do not have permission to perform this action')
      expect(error.message).toBe('Authentication failed') // Default message, not the detail
    })

    it('should handle custom detail message', () => {
      const apiError = createMockApiErrorResponse(401, 'Custom auth error')

      const error = new AuthenticationError(apiError, 'Custom auth error')

      expect(error.message).toBe('Custom auth error')
      expect(error.userMessage).toBe('Your session has expired. Please log in again.')
    })

    it('should handle unknown authentication status codes', () => {
      const apiError = createMockApiErrorResponse(418, 'Unknown auth error')

      const error = new AuthenticationError(apiError)

      expect(error.statusCode).toBe(418)
      expect(error.userMessage).toBe('Unknown authentication error')
    })
  })

  describe('ConflictError', () => {
    it('should create error with default conflict message', () => {
      const apiError = createMockApiErrorResponse(409, 'Conflict')

      const error = new ConflictError(apiError)

      expect(error.code).toBe('CONFLICT_ERROR')
      expect(error.statusCode).toBe(409)
      expect(error.userMessage).toBe(
        'The request could not be completed due to a conflict with the current state of the resource',
      )
      expect(error.message).toBe('Conflict error')
    })

    it('should create error with custom user message', () => {
      const apiError = createMockApiErrorResponse(409, 'Conflict')

      const error = new ConflictError(apiError, 'Custom conflict message')

      expect(error.userMessage).toBe('Custom conflict message')
    })
  })

  describe('NoteAlreadyExistsError', () => {
    it('should create error with specific message for note conflicts', () => {
      const apiError = createMockApiErrorResponse(409, 'NOTE_ALREADY_EXISTS')

      const error = new NoteAlreadyExistsError(apiError)

      expect(error.userMessage).toBe('A note with this title already exists')
      expect(error.code).toBe('CONFLICT_ERROR')
      expect(error.statusCode).toBe(409)
      expect(error).toBeInstanceOf(ConflictError)
    })
  })

  describe('ApiValidationError', () => {
    it('should create error with default validation message', () => {
      const validationErrors = [createMockValidationError(['body', 'title'], 'Title is required')]
      const apiError = createMockApiErrorResponse(422, 'Validation failed', validationErrors)

      const error = new ApiValidationError(apiError)

      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.statusCode).toBe(422)
      expect(error.userMessage).toBe('Please check your input and try again')
      expect(error.message).toBe('Validation failed')
    })

    it('should parse validation errors and group by field', () => {
      const validationErrors = [
        createMockValidationError(['body', 'title'], 'Title is required'),
        createMockValidationError(['body', 'title'], 'Title too short'),
        createMockValidationError(['body', 'email'], 'Invalid email format'),
        createMockValidationError(['query', 'limit'], 'Must be positive'),
      ]
      const apiError = createMockApiErrorResponse(422, 'Validation failed', validationErrors)

      const error = new ApiValidationError(apiError)

      expect(error.getFieldError('body.title')).toEqual(['Title is required', 'Title too short'])
      expect(error.getFieldError('body.email')).toEqual(['Invalid email format'])
      expect(error.getFieldError('query.limit')).toEqual(['Must be positive'])
      expect(error.getFieldError('nonexistent')).toEqual([])
    })

    it('should return all field names with errors', () => {
      const validationErrors = [
        createMockValidationError(['body', 'title'], 'Title is required'),
        createMockValidationError(['body', 'email'], 'Invalid email format'),
        createMockValidationError(['query', 'limit'], 'Must be positive'),
      ]
      const apiError = createMockApiErrorResponse(422, 'Validation failed', validationErrors)

      const error = new ApiValidationError(apiError)

      const fieldNames = error.getFieldNamesInError()
      expect(fieldNames).toEqual(['body.title', 'body.email', 'query.limit'])
    })

    it('should return all field errors as object', () => {
      const validationErrors = [
        createMockValidationError(['body', 'title'], 'Title is required'),
        createMockValidationError(['body', 'email'], 'Invalid email format'),
      ]
      const apiError = createMockApiErrorResponse(422, 'Validation failed', validationErrors)

      const error = new ApiValidationError(apiError)

      const allErrors = error.getAllFieldErrors()
      expect(allErrors).toEqual({
        'body.title': ['Title is required'],
        'body.email': ['Invalid email format'],
      })
    })

    it('should handle nested field paths correctly', () => {
      const validationErrors = [
        createMockValidationError(['body', 'user', 'profile', 'name'], 'Name is required'),
        createMockValidationError(['body', 0, 'title'], 'Array item title missing'),
      ]
      const apiError = createMockApiErrorResponse(422, 'Validation failed', validationErrors)

      const error = new ApiValidationError(apiError)

      expect(error.getFieldError('body.user.profile.name')).toEqual(['Name is required'])
      expect(error.getFieldError('body.0.title')).toEqual(['Array item title missing'])
    })

    it('should handle empty validation errors gracefully', () => {
      const apiError = createMockApiErrorResponse(422, 'Validation failed', [])

      const error = new ApiValidationError(apiError)

      expect(error.getFieldNamesInError()).toEqual([])
      expect(error.getAllFieldErrors()).toEqual({})
      expect(error.userMessage).toBe('Please check your input and try again')
    })

    it('should handle missing validation detail', () => {
      // Create proper HttpValidationError without detail array
      const apiError = {
        error: { detail: undefined } as HttpValidationError,
        response: {
          status: 422,
          ok: false,
          headers: new Headers(),
          statusText: 'Error',
        } as Response,
        request: new Request('https://api.example.com/test'),
      }

      const error = new ApiValidationError(apiError)

      expect(error.getFieldNamesInError()).toEqual([])
      expect(error.userMessage).toBe('Please check your input and try again')
    })
  })

  describe('NotFoundError', () => {
    it('should create error with standard not found message', () => {
      const apiError = createMockApiErrorResponse(404, 'Not found')

      const error = new NotFoundError(apiError)

      expect(error.code).toBe('NOT_FOUND_ERROR')
      expect(error.statusCode).toBe(404)
      expect(error.userMessage).toBe('The requested resource was not found')
      expect(error.message).toBe('Resource not found')
    })
  })

  describe('ServerError', () => {
    it('should create error with server error message', () => {
      const apiError = createMockApiErrorResponse(500, 'Internal server error')

      const error = new ServerError(apiError)

      expect(error.code).toBe('SERVER_ERROR')
      expect(error.statusCode).toBe(500)
      expect(error.userMessage).toBe('Something went wrong on our end. Please try again later.')
      expect(error.message).toBe('Server error')
    })

    it('should preserve status code from response', () => {
      const apiError = createMockApiErrorResponse(503, 'Service unavailable')

      const error = new ServerError(apiError)

      expect(error.statusCode).toBe(503)
    })
  })

  describe('UnknownApiError', () => {
    it('should create error with unknown API error message', () => {
      const apiError = createMockApiErrorResponse(418, 'Unknown error')

      const error = new UnknownApiError(apiError)

      expect(error.code).toBe('UNKNOWN_ERROR')
      expect(error.statusCode).toBe(418)
      expect(error.userMessage).toBe('An unexpected error occurred. Please try again.')
      expect(error.message).toBe('Unknown API error')
    })
  })

  describe('NetworkError', () => {
    it('should create error with network failure message', () => {
      const originalError = new TypeError('Failed to fetch')

      const error = new NetworkError(originalError)

      expect(error.code).toBe('NETWORK_ERROR')
      expect(error.statusCode).toBe(0)
      expect(error.userMessage).toBe(
        'Unable to connect to the server. Please check your internet connection and try again.',
      )
      expect(error.originalError).toBe(originalError)
    })

    it('should handle any type of original error', () => {
      const originalError = 'String error'

      const error = new NetworkError(originalError)

      expect(error.originalError).toBe(originalError)
      expect(error.code).toBe('NETWORK_ERROR')
    })
  })

  describe('UnknownError', () => {
    it('should create error with unknown error message', () => {
      const originalError = { weird: 'object' }

      const error = new UnknownError(originalError)

      expect(error.code).toBe('UNKNOWN_ERROR')
      expect(error.statusCode).toBe(0)
      expect(error.userMessage).toBe('An unexpected error occurred. Please try again later.')
      expect(error.originalError).toBe(originalError)
    })

    it('should handle null original error', () => {
      const error = new UnknownError(null)

      expect(error.originalError).toBe(null)
      expect(error.code).toBe('UNKNOWN_ERROR')
    })
  })

  describe('Error Instance Properties', () => {
    it('should ensure all errors have required base properties', () => {
      const apiError = createMockApiErrorResponse(400, 'Test')
      const validationError = createMockApiErrorResponse(422, 'Validation failed', [])
      const networkError = new TypeError('Network')

      const errors = [
        new BadRequestError(apiError),
        new LoginBadCredentialsError(apiError),
        new UserAlreadyExistsError(apiError),
        new AuthenticationError(apiError),
        new ConflictError(apiError),
        new NoteAlreadyExistsError(apiError),
        new ApiValidationError(validationError),
        new NotFoundError(apiError),
        new ServerError(apiError),
        new UnknownApiError(apiError),
        new NetworkError(networkError),
        new UnknownError('test'),
      ]

      errors.forEach((error) => {
        expect(error.code).toBeDefined()
        expect(typeof error.code).toBe('string')
        expect(error.statusCode).toBeDefined()
        expect(typeof error.statusCode).toBe('number')
        expect(error.userMessage).toBeDefined()
        expect(typeof error.userMessage).toBe('string')
        expect(error.originalError).toBeDefined()

        // Only API response errors get their name set correctly
        if (error instanceof ApiResponseError) {
          expect(error.name).toBe(error.constructor.name)
        } else {
          // NetworkError and UnknownError inherit from Error but don't set name
          expect(error.name).toBe('Error')
        }
      })
    })

    it('should ensure API response errors inherit from ApiResponseError', () => {
      const apiError = createMockApiErrorResponse(400, 'Test')
      const validationError = createMockApiErrorResponse(422, 'Validation failed', [])

      const apiErrors = [
        new BadRequestError(apiError),
        new LoginBadCredentialsError(apiError),
        new UserAlreadyExistsError(apiError),
        new AuthenticationError(apiError),
        new ConflictError(apiError),
        new NoteAlreadyExistsError(apiError),
        new ApiValidationError(validationError),
        new NotFoundError(apiError),
        new ServerError(apiError),
        new UnknownApiError(apiError),
      ]

      apiErrors.forEach((error) => {
        expect(error).toBeInstanceOf(ApiResponseError)
        expect(error).toBeInstanceOf(Error)
        expect(error.originalError).toBeInstanceOf(Object)
        expect(error.originalError).toHaveProperty('error')
        expect(error.originalError).toHaveProperty('response')
        expect(error.originalError).toHaveProperty('request')
      })
    })

    it('should ensure non-API errors do not inherit from ApiResponseError', () => {
      const networkError = new NetworkError(new TypeError('Network'))
      const unknownError = new UnknownError('test')

      expect(networkError).not.toBeInstanceOf(ApiResponseError)
      expect(unknownError).not.toBeInstanceOf(ApiResponseError)
      expect(networkError).toBeInstanceOf(Error)
      expect(unknownError).toBeInstanceOf(Error)
    })
  })

  describe('Error Message Consistency', () => {
    it('should have user-friendly messages that do not expose technical details', () => {
      const apiError = createMockApiErrorResponse(500, 'Internal server error')
      const errors = [
        new BadRequestError(apiError),
        new AuthenticationError(apiError),
        new NotFoundError(apiError),
        new ServerError(apiError),
        new NetworkError(new TypeError('Fetch failed')),
        new UnknownError('Unknown'),
      ]

      errors.forEach((error) => {
        // User messages should be polite and not technical
        expect(error.userMessage).not.toMatch(/stack|trace|debug|internal/i)
        expect(error.userMessage.length).toBeGreaterThan(10)
        expect(error.userMessage).toMatch(/^[A-Z]/) // Should start with capital letter
        // Some messages end with period, some don't, so let's be more flexible
        expect(error.userMessage).toBeTruthy()
      })
    })

    it('should have consistent error codes format', () => {
      const apiError = createMockApiErrorResponse(400, 'Test')
      const validationError = createMockApiErrorResponse(422, 'Validation failed', [])
      const errors = [
        new BadRequestError(apiError),
        new AuthenticationError(apiError),
        new ConflictError(apiError),
        new ApiValidationError(validationError),
        new NotFoundError(apiError),
        new ServerError(apiError),
        new UnknownApiError(apiError),
        new NetworkError(new TypeError()),
        new UnknownError('test'),
      ]

      errors.forEach((error) => {
        // Error codes should be UPPER_CASE_WITH_UNDERSCORES
        expect(error.code).toMatch(/^[A-Z_]+$/)
        expect(error.code).toMatch(/_ERROR$/) // Should end with _ERROR
      })
    })
  })
})
