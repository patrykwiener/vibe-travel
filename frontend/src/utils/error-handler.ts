import {
  ApiResponseError,
  AuthenticationError,
  ApiValidationError,
  NotFoundError,
  ServerError,
  NetworkError,
  UnknownApiError,
  type ApiErrorResponse,
  LoginBadCredentialsError,
  BadRequestError,
  UnknownError,
  UserAlreadyExistsError,
} from './api-errors'

/**
 * Global API Error Handler
 *
 * Converts hey-api client errors into typed error classes
 * with user-friendly messages and proper error categorization
 */
export class ApiErrorHandler {
  /**
   * Parse error from hey-api client and return appropriate ApiError instance
   */
  static handleError(error: unknown): ApiResponseError | NetworkError | UnknownError {
    console.log('ApiErrorHandler.handleError - Processing error:', error)

    const errorObj = error as Record<string, unknown>

    // Check for network errors (fetch failures, etc.)
    if (errorObj.name === 'TypeError' || errorObj.name === 'NetworkError') {
      return new NetworkError(error)
    }

    // Check for hey-api structured error response: { error, request, response }
    if (errorObj.error && errorObj.response && errorObj.request) {
      return this.parseApiError(error as ApiErrorResponse)
    }

    return new UnknownError(error)
  }

  /**
   * Parse structured API error response from hey-api
   */
  private static parseApiError(apiError: ApiErrorResponse): ApiResponseError {
    const { error: errorData, response } = apiError
    const status = response.status

    return this.createErrorByStatus(status, apiError, errorData.detail as string)
  }

  /**
   * Create appropriate error type based on HTTP status code
   */
  private static createErrorByStatus(
    status: number,
    originalError: ApiErrorResponse,
    detail?: string,
  ): ApiResponseError {
    if (status == 400) {
      if (detail === 'LOGIN_BAD_CREDENTIALS') {
        return new LoginBadCredentialsError(originalError)
      }
      if (detail === 'REGISTER_USER_ALREADY_EXISTS') {
        return new UserAlreadyExistsError(originalError)
      }
      return new BadRequestError(originalError, detail)
    }

    if (status == 401 || status == 403) {
      return new AuthenticationError(originalError, detail)
    }

    if (status === 404) {
      return new NotFoundError(originalError)
    }

    if (status === 422) {
      return new ApiValidationError(originalError)
    }

    if (status >= 500) {
      return new ServerError(originalError)
    }

    return new UnknownApiError(originalError)
  }

  /**
   * Check if error is of specific type
   */
  static isAuthenticationError(error: unknown): boolean {
    return this.handleError(error) instanceof AuthenticationError
  }

  static isValidationError(error: unknown): boolean {
    return this.handleError(error) instanceof ApiValidationError
  }

  static isNetworkError(error: unknown): boolean {
    return this.handleError(error) instanceof NetworkError
  }
}
