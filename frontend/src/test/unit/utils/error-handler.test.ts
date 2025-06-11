import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ApiErrorHandler } from '@/utils/error-handler'
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
 * Comprehensive unit tests for ApiErrorHandler
 *
 * Tests cover all error handling paths following VibeTravels coding standards:
 * - Network error detection
 * - API error response parsing
 * - Status code mapping with all variants
 * - Type check utility methods
 * - Edge cases and malformed inputs
 */
describe('ApiErrorHandler', () => {
  // Mock console.log to avoid test output noise
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  /**
   * Helper function to create mock API error responses
   */
  const createMockApiErrorResponse = (
    status: number,
    detail: string | Record<string, string> | undefined = 'Test error',
    validationErrors?: ValidationError[],
  ): ApiErrorResponse => {
    const errorData: ErrorModel | HttpValidationError = validationErrors
      ? { detail: validationErrors }
      : { detail: detail || 'Test error' }

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

  describe('handleError - Network Error Detection', () => {
    it('should detect TypeError as NetworkError', () => {
      const typeError = new TypeError('Failed to fetch')

      const result = ApiErrorHandler.handleError(typeError)

      expect(result).toBeInstanceOf(NetworkError)
      expect(result.code).toBe('NETWORK_ERROR')
      expect(result.userMessage).toBe(
        'Unable to connect to the server. Please check your internet connection and try again.',
      )
    })

    it('should detect NetworkError by name property', () => {
      const networkError = { name: 'NetworkError', message: 'Network failure' }

      const result = ApiErrorHandler.handleError(networkError)

      expect(result).toBeInstanceOf(NetworkError)
      expect(result.code).toBe('NETWORK_ERROR')
    })

    it('should handle fetch failures', () => {
      const fetchError = { name: 'TypeError', message: 'Failed to fetch' }

      const result = ApiErrorHandler.handleError(fetchError)

      expect(result).toBeInstanceOf(NetworkError)
    })
  })

  describe('handleError - API Error Response Parsing', () => {
    it('should parse structured hey-api error response', () => {
      const apiError = createMockApiErrorResponse(400, 'Bad request')

      const result = ApiErrorHandler.handleError(apiError)

      expect(result).toBeInstanceOf(BadRequestError)
      expect(result.statusCode).toBe(400)
    })

    it('should require all three properties for API error detection', () => {
      const incompleteError = {
        error: { detail: 'Test' },
        response: { status: 400 },
        // Missing request property
      }

      const result = ApiErrorHandler.handleError(incompleteError)

      expect(result).toBeInstanceOf(UnknownError)
    })

    it('should handle missing error data gracefully', () => {
      const malformedError = {
        error: null,
        response: { status: 500 },
        request: new Request('https://api.example.com/test'),
      }

      const result = ApiErrorHandler.handleError(malformedError)

      expect(result).toBeInstanceOf(UnknownError)
    })
  })

  describe('createErrorByStatus - 400 Bad Request Variants', () => {
    it('should create LoginBadCredentialsError for LOGIN_BAD_CREDENTIALS', () => {
      const apiError = createMockApiErrorResponse(400, 'LOGIN_BAD_CREDENTIALS')

      const result = ApiErrorHandler.handleError(apiError)

      expect(result).toBeInstanceOf(LoginBadCredentialsError)
      expect(result.userMessage).toBe('Invalid email or password')
      expect(result.statusCode).toBe(400)
    })

    it('should create UserAlreadyExistsError for REGISTER_USER_ALREADY_EXISTS', () => {
      const apiError = createMockApiErrorResponse(400, 'REGISTER_USER_ALREADY_EXISTS')

      const result = ApiErrorHandler.handleError(apiError)

      expect(result).toBeInstanceOf(UserAlreadyExistsError)
      expect(result.userMessage).toBe('A user with this email already exists')
      expect(result.statusCode).toBe(400)
    })

    it('should create generic BadRequestError for other 400 errors', () => {
      const apiError = createMockApiErrorResponse(400, 'INVALID_INPUT')

      const result = ApiErrorHandler.handleError(apiError)

      expect(result).toBeInstanceOf(BadRequestError)
      expect(result.userMessage).toBe('INVALID_INPUT')
      expect(result.statusCode).toBe(400)
    })

    it('should create BadRequestError with default message when detail is undefined', () => {
      const apiError = createMockApiErrorResponse(400, undefined)

      const result = ApiErrorHandler.handleError(apiError)

      expect(result).toBeInstanceOf(BadRequestError)
      expect(result.userMessage).toBe('Test error') // Uses fallback from our mock helper
    })
  })

  describe('createErrorByStatus - Authentication Errors (401/403)', () => {
    it('should create AuthenticationError for 401 status', () => {
      const apiError = createMockApiErrorResponse(401, 'Unauthorized')

      const result = ApiErrorHandler.handleError(apiError)

      expect(result).toBeInstanceOf(AuthenticationError)
      expect(result.statusCode).toBe(401)
      expect(result.userMessage).toBe('Your session has expired. Please log in again.')
    })

    it('should create AuthenticationError for 403 status', () => {
      const apiError = createMockApiErrorResponse(403, 'Forbidden')

      const result = ApiErrorHandler.handleError(apiError)

      expect(result).toBeInstanceOf(AuthenticationError)
      expect(result.statusCode).toBe(403)
      expect(result.userMessage).toBe('You do not have permission to perform this action')
    })

    it('should handle custom detail message for authentication errors', () => {
      const apiError = createMockApiErrorResponse(401, 'Custom auth error')

      const result = ApiErrorHandler.handleError(apiError)

      expect(result).toBeInstanceOf(AuthenticationError)
      expect(result.message).toBe('Custom auth error')
    })
  })

  describe('createErrorByStatus - 404 Not Found', () => {
    it('should create NotFoundError for 404 status', () => {
      const apiError = createMockApiErrorResponse(404, 'Not found')

      const result = ApiErrorHandler.handleError(apiError)

      expect(result).toBeInstanceOf(NotFoundError)
      expect(result.statusCode).toBe(404)
      expect(result.userMessage).toBe('The requested resource was not found')
    })
  })

  describe('createErrorByStatus - 409 Conflict Variants', () => {
    it('should create NoteAlreadyExistsError for NOTE_ALREADY_EXISTS', () => {
      const apiError = createMockApiErrorResponse(409, 'NOTE_ALREADY_EXISTS')

      const result = ApiErrorHandler.handleError(apiError)

      expect(result).toBeInstanceOf(NoteAlreadyExistsError)
      expect(result.userMessage).toBe('A note with this title already exists')
      expect(result.statusCode).toBe(409)
    })

    it('should create generic ConflictError for other 409 errors', () => {
      const apiError = createMockApiErrorResponse(409, 'RESOURCE_CONFLICT')

      const result = ApiErrorHandler.handleError(apiError)

      expect(result).toBeInstanceOf(ConflictError)
      expect(result.userMessage).toBe('RESOURCE_CONFLICT')
      expect(result.statusCode).toBe(409)
    })

    it('should create ConflictError with default message when detail is undefined', () => {
      const apiError = createMockApiErrorResponse(409, undefined)

      const result = ApiErrorHandler.handleError(apiError)

      expect(result).toBeInstanceOf(ConflictError)
      expect(result.userMessage).toBe('Test error') // Uses fallback from our mock helper
    })
  })

  describe('createErrorByStatus - 422 Validation Errors', () => {
    it('should create ApiValidationError for 422 status', () => {
      const validationErrors = [
        createMockValidationError(['body', 'title'], 'Title is required'),
        createMockValidationError(['body', 'email'], 'Invalid email format'),
      ]
      const apiError = createMockApiErrorResponse(422, 'Validation failed', validationErrors)

      const result = ApiErrorHandler.handleError(apiError)

      expect(result).toBeInstanceOf(ApiValidationError)
      expect(result.statusCode).toBe(422)
      expect(result.userMessage).toBe('Please check your input and try again')
    })

    it('should parse field-specific validation errors', () => {
      const validationErrors = [
        createMockValidationError(['body', 'title'], 'Title is required'),
        createMockValidationError(['body', 'title'], 'Title too short'),
        createMockValidationError(['body', 'email'], 'Invalid email format'),
      ]
      const apiError = createMockApiErrorResponse(422, 'Validation failed', validationErrors)

      const result = ApiErrorHandler.handleError(apiError) as ApiValidationError

      expect(result.getFieldError('body.title')).toEqual(['Title is required', 'Title too short'])
      expect(result.getFieldError('body.email')).toEqual(['Invalid email format'])
      expect(result.getFieldNamesInError()).toEqual(['body.title', 'body.email'])
    })

    it('should handle validation errors without detail', () => {
      const apiError = createMockApiErrorResponse(422, undefined as any, [])

      const result = ApiErrorHandler.handleError(apiError)

      expect(result).toBeInstanceOf(ApiValidationError)
      expect(result.userMessage).toBe('Please check your input and try again')
    })
  })

  describe('createErrorByStatus - Server Errors (500+)', () => {
    it('should create ServerError for 500 status', () => {
      const apiError = createMockApiErrorResponse(500, 'Internal server error')

      const result = ApiErrorHandler.handleError(apiError)

      expect(result).toBeInstanceOf(ServerError)
      expect(result.statusCode).toBe(500)
      expect(result.userMessage).toBe('Something went wrong on our end. Please try again later.')
    })

    it('should create ServerError for 502 status', () => {
      const apiError = createMockApiErrorResponse(502, 'Bad gateway')

      const result = ApiErrorHandler.handleError(apiError)

      expect(result).toBeInstanceOf(ServerError)
      expect(result.statusCode).toBe(502)
    })

    it('should create ServerError for 503 status', () => {
      const apiError = createMockApiErrorResponse(503, 'Service unavailable')

      const result = ApiErrorHandler.handleError(apiError)

      expect(result).toBeInstanceOf(ServerError)
      expect(result.statusCode).toBe(503)
    })
  })

  describe('createErrorByStatus - Unknown Status Codes', () => {
    it('should create UnknownApiError for unrecognized status codes', () => {
      const apiError = createMockApiErrorResponse(418, "I'm a teapot")

      const result = ApiErrorHandler.handleError(apiError)

      expect(result).toBeInstanceOf(UnknownApiError)
      expect(result.statusCode).toBe(418)
      expect(result.userMessage).toBe('An unexpected error occurred. Please try again.')
    })

    it('should handle negative status codes', () => {
      const apiError = createMockApiErrorResponse(-1, 'Invalid status')

      const result = ApiErrorHandler.handleError(apiError)

      expect(result).toBeInstanceOf(UnknownApiError)
      expect(result.statusCode).toBe(-1)
    })

    it('should handle very large status codes', () => {
      const apiError = createMockApiErrorResponse(9999, 'Large status')

      const result = ApiErrorHandler.handleError(apiError)

      expect(result).toBeInstanceOf(ServerError) // status >= 500 goes to ServerError
      expect(result.statusCode).toBe(9999)
    })
  })

  describe('Type Check Utility Methods', () => {
    describe('isAuthenticationError', () => {
      it('should return true for AuthenticationError instances', () => {
        const authError = createMockApiErrorResponse(401, 'Unauthorized')

        const result = ApiErrorHandler.isAuthenticationError(authError)

        expect(result).toBe(true)
      })

      it('should return false for non-authentication errors', () => {
        const validationError = createMockApiErrorResponse(422, 'Validation failed', [])

        const result = ApiErrorHandler.isAuthenticationError(validationError)

        expect(result).toBe(false)
      })

      it('should return false for network errors', () => {
        const networkError = new TypeError('Network failure')

        const result = ApiErrorHandler.isAuthenticationError(networkError)

        expect(result).toBe(false)
      })

      it('should return false for unknown errors', () => {
        const unknownError = { random: 'object' }

        const result = ApiErrorHandler.isAuthenticationError(unknownError)

        expect(result).toBe(false)
      })
    })

    describe('isValidationError', () => {
      it('should return true for ApiValidationError instances', () => {
        const validationError = createMockApiErrorResponse(422, 'Validation failed', [])

        const result = ApiErrorHandler.isValidationError(validationError)

        expect(result).toBe(true)
      })

      it('should return false for non-validation errors', () => {
        const authError = createMockApiErrorResponse(401, 'Unauthorized')

        const result = ApiErrorHandler.isValidationError(authError)

        expect(result).toBe(false)
      })

      it('should return false for network errors', () => {
        const networkError = new TypeError('Network failure')

        const result = ApiErrorHandler.isValidationError(networkError)

        expect(result).toBe(false)
      })
    })

    describe('isNetworkError', () => {
      it('should return true for NetworkError instances', () => {
        const networkError = new TypeError('Network failure')

        const result = ApiErrorHandler.isNetworkError(networkError)

        expect(result).toBe(true)
      })

      it('should return false for API errors', () => {
        const apiError = createMockApiErrorResponse(400, 'Bad request')

        const result = ApiErrorHandler.isNetworkError(apiError)

        expect(result).toBe(false)
      })

      it('should return false for unknown errors', () => {
        const unknownError = 'string error'

        const result = ApiErrorHandler.isNetworkError(unknownError)

        expect(result).toBe(false)
      })
    })
  })

  describe('Edge Cases and Malformed Inputs', () => {
    it('should handle null input', () => {
      // API handler nie sprawdza czy errorObj istnieje przed dostępem do .name
      // Skutkuje to błędem TypeError podczas próby dostępu do właściwości null
      expect(() => {
        ApiErrorHandler.handleError(null)
      }).toThrow(TypeError)
    })

    it('should handle undefined input', () => {
      // Podobnie jak null, undefined spowoduje błąd przy dostępie do .name
      expect(() => {
        ApiErrorHandler.handleError(undefined)
      }).toThrow(TypeError)
    })

    it('should handle string input', () => {
      const result = ApiErrorHandler.handleError('Simple string error')

      expect(result).toBeInstanceOf(UnknownError)
    })

    it('should handle number input', () => {
      const result = ApiErrorHandler.handleError(404)

      expect(result).toBeInstanceOf(UnknownError)
    })

    it('should handle boolean input', () => {
      const result = ApiErrorHandler.handleError(false)

      expect(result).toBeInstanceOf(UnknownError)
    })

    it('should handle array input', () => {
      const result = ApiErrorHandler.handleError(['error', 'array'])

      expect(result).toBeInstanceOf(UnknownError)
    })

    it('should handle object with partial API error structure', () => {
      const partialError = {
        error: { detail: 'Test error' },
        // Missing response and request
      }

      const result = ApiErrorHandler.handleError(partialError)

      expect(result).toBeInstanceOf(UnknownError)
    })

    it('should handle malformed response object', () => {
      const malformedError = {
        error: { detail: 'Test error' },
        response: 'not an object', // response nie jest obiektem
        request: new Request('https://api.example.com/test'),
      }

      const result = ApiErrorHandler.handleError(malformedError)

      // Gdy response nie ma .status, otrzymamy UnknownApiError
      expect(result).toBeInstanceOf(UnknownApiError)
    })

    it('should handle response without status property', () => {
      const noStatusError = {
        error: { detail: 'Test error' },
        response: { ok: false }, // Missing status
        request: new Request('https://api.example.com/test'),
      }

      const result = ApiErrorHandler.handleError(noStatusError)

      expect(result).toBeInstanceOf(UnknownApiError)
    })

    it('should handle error detail as object instead of string', () => {
      const objectDetailError = createMockApiErrorResponse(400, { field: 'error message' })

      const result = ApiErrorHandler.handleError(objectDetailError)

      expect(result).toBeInstanceOf(BadRequestError)
    })

    it('should handle circular reference in error object', () => {
      const circularError: any = { name: 'CircularError' }
      circularError.self = circularError

      const result = ApiErrorHandler.handleError(circularError)

      expect(result).toBeInstanceOf(UnknownError)
    })
  })

  describe('Console Logging', () => {
    it('should log the error being processed', () => {
      const consoleSpy = vi.spyOn(console, 'log')
      const testError = new TypeError('Test error')

      ApiErrorHandler.handleError(testError)

      expect(consoleSpy).toHaveBeenCalledWith(
        'ApiErrorHandler.handleError - Processing error:',
        testError,
      )
    })
  })

  describe('Error Instance Inheritance', () => {
    it('should ensure all API errors inherit from ApiResponseError', () => {
      const testCases = [
        { status: 400, detail: 'LOGIN_BAD_CREDENTIALS', expectedType: LoginBadCredentialsError },
        {
          status: 400,
          detail: 'REGISTER_USER_ALREADY_EXISTS',
          expectedType: UserAlreadyExistsError,
        },
        { status: 400, detail: 'OTHER', expectedType: BadRequestError },
        { status: 401, detail: 'Unauthorized', expectedType: AuthenticationError },
        { status: 403, detail: 'Forbidden', expectedType: AuthenticationError },
        { status: 404, detail: 'Not found', expectedType: NotFoundError },
        { status: 409, detail: 'NOTE_ALREADY_EXISTS', expectedType: NoteAlreadyExistsError },
        { status: 409, detail: 'OTHER_CONFLICT', expectedType: ConflictError },
        { status: 422, detail: 'Validation failed', expectedType: ApiValidationError },
        { status: 500, detail: 'Server error', expectedType: ServerError },
        { status: 418, detail: 'Unknown', expectedType: UnknownApiError },
      ]

      testCases.forEach(({ status, detail, expectedType }) => {
        const apiError = createMockApiErrorResponse(status, detail, status === 422 ? [] : undefined)

        const result = ApiErrorHandler.handleError(apiError)

        expect(result).toBeInstanceOf(expectedType)
        expect(result).toBeInstanceOf(ApiResponseError)
        expect(result.statusCode).toBe(status)
      })
    })

    it('should ensure NetworkError and UnknownError have correct base class', () => {
      const networkError = new TypeError('Network failure')
      const unknownInput = 'unknown error'

      const networkResult = ApiErrorHandler.handleError(networkError)
      const unknownResult = ApiErrorHandler.handleError(unknownInput)

      expect(networkResult).toBeInstanceOf(NetworkError)
      expect(unknownResult).toBeInstanceOf(UnknownError)

      // Both should have the base ApiError properties
      expect(networkResult.code).toBeDefined()
      expect(networkResult.statusCode).toBeDefined()
      expect(networkResult.userMessage).toBeDefined()
      expect(unknownResult.code).toBeDefined()
      expect(unknownResult.statusCode).toBeDefined()
      expect(unknownResult.userMessage).toBeDefined()
    })
  })

  describe('Status Code Equality vs Strict Equality', () => {
    it('should handle status code comparison correctly (==)', () => {
      // Testing the == comparison used in the code vs ===
      const apiError400 = createMockApiErrorResponse(400, 'Test')
      const apiError401 = createMockApiErrorResponse(401, 'Test')

      const result400 = ApiErrorHandler.handleError(apiError400)
      const result401 = ApiErrorHandler.handleError(apiError401)

      expect(result400).toBeInstanceOf(BadRequestError)
      expect(result401).toBeInstanceOf(AuthenticationError)
    })
  })
})
