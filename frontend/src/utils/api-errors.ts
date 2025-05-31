import type {
  ErrorModel,
  HttpValidationError,
  ValidationError as OpenApiValidationError,
} from '@/client/types.gen'

/**
 * API Error Response Structure from hey-api client
 */
export interface ApiErrorResponse {
  error: ErrorModel | HttpValidationError
  request: Request
  response: Response
}

export abstract class ApiError extends Error {
  abstract readonly code: string
  abstract readonly statusCode: number
  abstract readonly userMessage: string
  abstract readonly originalError: ApiErrorResponse | unknown
}
/**
 * Base class for all API errors
 */
export abstract class ApiResponseError extends ApiError {
  abstract readonly code: string
  abstract readonly statusCode: number
  abstract readonly userMessage: string

  constructor(
    message: string,
    public readonly originalError: ApiErrorResponse,
  ) {
    super(message)
    this.name = this.constructor.name
  }
}

export class BadRequestError extends ApiResponseError {
  readonly code = 'BAD_REQUEST_ERROR'
  readonly statusCode = 400
  readonly userMessage: string

  constructor(originalError: ApiErrorResponse, userMessage?: string) {
    super('Bad request', originalError)
    this.userMessage = userMessage || 'The request was invalid or malformed'
  }
}

/**
 * Login errors (400)
 * Specific error for invalid credentials during login
 */
export class LoginBadCredentialsError extends BadRequestError {
  constructor(originalError: ApiErrorResponse) {
    super(originalError, 'Invalid email or password')
  }
}

/** 
 * Register user already exists error (400)
 */
export class UserAlreadyExistsError extends BadRequestError {
  constructor(originalError: ApiErrorResponse) {
    super(originalError, 'A user with this email already exists')
  }
}

/**
 * Authentication/Authorization errors (401, 403)
 */
export class AuthenticationError extends ApiResponseError {
  readonly code = 'AUTHENTICATION_ERROR'
  readonly statusCode: number
  readonly userMessage: string

  constructor(originalError: ApiErrorResponse, detail?: string) {
    const statusCode = originalError.response.status
    const message = detail || 'Authentication failed'

    let userMessage: string
    if (statusCode === 401) {
      userMessage = 'Your session has expired. Please log in again.'
    } else if (statusCode === 403) {
      userMessage = 'You do not have permission to perform this action'
    } else {
      userMessage = 'Unknown authentication error'
    }

    super(message, originalError)
    this.statusCode = statusCode
    this.userMessage = userMessage
  }
}

/**
 * Validation errors (422)
 */
export class ApiValidationError extends ApiResponseError {
  readonly code = 'VALIDATION_ERROR'
  readonly statusCode = 422
  readonly userMessage: string
  readonly fieldErrors: Map<string, string[]>

  constructor(originalError: ApiErrorResponse, validationErrors?: OpenApiValidationError[]) {
    super('Validation failed', originalError)

    this.fieldErrors = new Map()
    this.userMessage = this.parseValidationErrors(validationErrors)
  }

  private parseValidationErrors(errors?: OpenApiValidationError[]): string {
    if (!errors || errors.length === 0) {
      return 'Please check your input and try again'
    }

    // Group errors by field
    errors.forEach((error) => {
      const field = error.loc.join('.')
      const messages = this.fieldErrors.get(field) || []
      messages.push(error.msg)
      this.fieldErrors.set(field, messages)
    })

    // Return first error message for simple display
    return errors[0].msg
  }

  getFieldError(fieldName: string): string[] {
    return this.fieldErrors.get(fieldName) || []
  }

  getAllFieldErrors(): Record<string, string[]> {
    return Object.fromEntries(this.fieldErrors)
  }
}

/**
 * Not Found errors (404)
 */
export class NotFoundError extends ApiResponseError {
  readonly code = 'NOT_FOUND_ERROR'
  readonly statusCode = 404
  readonly userMessage = 'The requested resource was not found'

  constructor(originalError: ApiErrorResponse) {
    super('Resource not found', originalError)
  }
}

/**
 * Server errors (500+)
 */
export class ServerError extends ApiResponseError {
  readonly code = 'SERVER_ERROR'
  readonly statusCode: number
  readonly userMessage = 'Something went wrong on our end. Please try again later.'

  constructor(originalError: ApiErrorResponse) {
    super('Server error', originalError)
    this.statusCode = originalError.response.status
  }
}

/**
 * Unknown errors
 */
export class UnknownApiError extends ApiResponseError {
  readonly code = 'UNKNOWN_ERROR'
  readonly userMessage = 'An unexpected error occurred. Please try again.'
  readonly statusCode: number

  constructor(originalError: ApiErrorResponse) {
    super('Unknown API error', originalError)
    this.statusCode = originalError.response.status
  }
}

/**
 * Network/Connection errors
 */
export class NetworkError extends ApiError {
  readonly code = 'NETWORK_ERROR'
  readonly statusCode = 0
  readonly userMessage =
    'Unable to connect to the server. Please check your internet connection and try again.'
  readonly originalError: unknown

  constructor(originalError: unknown) {
    super()
    this.originalError = originalError
  }
}

/**
 * Unknown error
 */
export class UnknownError extends ApiError {
  readonly code = 'UNKNOWN_ERROR'
  readonly statusCode = 0
  readonly userMessage = 'An unexpected error occurred. Please try again later.'
  readonly originalError: unknown

  constructor(originalError: unknown) {
    super()
    this.originalError = originalError
  }
}
