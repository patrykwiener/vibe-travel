import { ApiErrorHandler } from './error-handler'
import { AuthenticationError } from './api-errors'

/**
 * Global API Response Interceptor
 *
 * Wraps hey-api client calls to provide consistent error handling across the application.
 * Automatically converts API responses and errors into typed ApiError instances.
 * Includes global 401 authentication error handling that automatically triggers logout.
 */
export class ApiInterceptor {
  /**
   * Global 401 authentication error handler
   * Automatically triggers logout and redirect when authentication fails
   */
  private static async handleAuthenticationError(error: AuthenticationError): Promise<never> {
    try {
      // Dynamically import auth store to avoid circular dependencies
      const { useAuthStore } = await import('@/stores/auth')
      const authStore = useAuthStore()

      // Clear authentication state - don't call backend logout since the token is already invalid
      authStore.clearAuthState()

      // Import router dynamically to handle redirection
      const router = await import('@/router')

      // Get current route - use router instance directly instead of useRouter composable
      const currentRoute = router.default.currentRoute.value
      const publicRoutes = ['login', 'register', 'home']

      if (!publicRoutes.includes(currentRoute.name as string)) {
        // Redirect to login with current path for redirect after re-login
        await router.default.push({
          name: 'login',
          query: {
            redirect: currentRoute.fullPath,
            error: 'session_expired',
          },
        })
      }
    } catch (handlerError) {
      console.error('Authentication error handler failed:', handlerError)
    }

    // Re-throw the error for component-level handling if needed
    throw error
  }
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
      const apiError = ApiErrorHandler.handleError(error)

      // Handle authentication errors globally
      if (apiError instanceof AuthenticationError) {
        await ApiInterceptor.handleAuthenticationError(apiError)
      }

      throw apiError
    }

    // Check if the response indicates success
    if (result.data !== undefined && result.response?.ok) {
      return result.data
    }

    const apiError = ApiErrorHandler.handleError(result)

    // Handle authentication errors globally
    if (apiError instanceof AuthenticationError) {
      await ApiInterceptor.handleAuthenticationError(apiError)
    }

    throw apiError
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
        const apiError = ApiErrorHandler.handleError(result.error)

        // Handle authentication errors globally
        if (apiError instanceof AuthenticationError) {
          await ApiInterceptor.handleAuthenticationError(apiError)
        }

        throw apiError
      }

      // If response is not ok, create error from response
      if (result.response && !result.response.ok) {
        const apiError = ApiErrorHandler.handleError({ response: result.response })

        // Handle authentication errors globally
        if (apiError instanceof AuthenticationError) {
          await ApiInterceptor.handleAuthenticationError(apiError)
        }

        throw apiError
      }

      // Fallback
      const apiError = ApiErrorHandler.handleError(new Error('Unexpected API response structure'))
      throw apiError
    } catch (error) {
      const apiError = ApiErrorHandler.handleError(error)

      // Handle authentication errors globally
      if (apiError instanceof AuthenticationError) {
        await ApiInterceptor.handleAuthenticationError(apiError)
      }

      throw apiError
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
        const apiError = ApiErrorHandler.handleError(result.error)

        // Handle authentication errors globally
        if (apiError instanceof AuthenticationError) {
          await ApiInterceptor.handleAuthenticationError(apiError)
        }

        throw apiError
      }

      if (result.response && !result.response.ok) {
        const apiError = ApiErrorHandler.handleError({ response: result.response })

        // Handle authentication errors globally
        if (apiError instanceof AuthenticationError) {
          await ApiInterceptor.handleAuthenticationError(apiError)
        }

        throw apiError
      }

      const apiError = ApiErrorHandler.handleError(new Error('Unexpected API response structure'))
      throw apiError
    } catch (error) {
      const apiError = ApiErrorHandler.handleError(error)

      // Handle authentication errors globally
      if (apiError instanceof AuthenticationError) {
        await ApiInterceptor.handleAuthenticationError(apiError)
      }

      throw apiError
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
