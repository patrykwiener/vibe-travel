import { ApiErrorHandler } from './error-handler'

/**
 * Global API Response Interceptor
 *
 * Wraps hey-api client calls to provide consistent error handling across the application.
 * Automatically converts API responses and errors into typed ApiError instances.
 */
export class ApiInterceptor {
  /**
   * Wrap any hey-api client call with global error handling
   *
   * @param apiCall - The hey-api client function to call
   * @returns Promise that resolves to data or throws typed ApiError
   */
  static async call<T>(
    apiCall: () => Promise<{ data?: T; response?: Response; error?: unknown }>,
  ): Promise<T> {
    let result = undefined
    try {
      result = await apiCall()
    } catch (error) {
      throw ApiErrorHandler.handleError(error)
    }

    console.log('ApiInterceptor.call - Result:', result)
    // Check if the response indicates success
    if (result.data !== undefined && result.response?.ok) {
      return result.data
    }

    throw ApiErrorHandler.handleError(result)
  }

  /**
   * Wrap hey-api calls that may return null/undefined data as valid responses
   *
   * @param apiCall - The hey-api client function to call
   * @returns Promise that resolves to data, null, or throws typed ApiError
   */
  static async callOptional<T>(
    apiCall: () => Promise<{ data?: T; response?: Response; error?: unknown }>,
  ): Promise<T | null> {
    try {
      const result = await apiCall()

      // Handle successful responses
      if (result.response?.ok) {
        // For 204 No Content or cases where data is intentionally null/undefined
        if (result.response.status === 204 || result.data === undefined || result.data === null) {
          return null
        }
        return result.data as T
      }

      // Handle error responses
      if (result.error) {
        throw ApiErrorHandler.handleError(result.error)
      }

      // If response is not ok, create error from response
      if (result.response && !result.response.ok) {
        throw ApiErrorHandler.handleError({ response: result.response })
      }

      // Fallback
      throw ApiErrorHandler.handleError(new Error('Unexpected API response structure'))
    } catch (error) {
      throw ApiErrorHandler.handleError(error)
    }
  }

  /**
   * Handle operations that don't return data (like DELETE)
   */
  static async callVoid(
    apiCall: () => Promise<{ data?: unknown; response?: Response; error?: unknown }>,
  ): Promise<void> {
    try {
      const result = await apiCall()

      if (result.response?.ok) {
        return // Success - void operations don't return data
      }

      if (result.error) {
        throw ApiErrorHandler.handleError(result.error)
      }

      if (result.response && !result.response.ok) {
        throw ApiErrorHandler.handleError({ response: result.response })
      }

      throw ApiErrorHandler.handleError(new Error('Unexpected API response structure'))
    } catch (error) {
      throw ApiErrorHandler.handleError(error)
    }
  }
}

/**
 * Convenience function for simple API calls
 */
export const apiCall = ApiInterceptor.call

/**
 * Convenience function for API calls that may return null
 */
export const apiCallOptional = ApiInterceptor.callOptional

/**
 * Convenience function for void operations
 */
export const apiCallVoid = ApiInterceptor.callVoid
