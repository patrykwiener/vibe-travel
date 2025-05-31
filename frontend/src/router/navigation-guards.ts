import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { ApiErrorHandler } from '@/utils/error-handler'
import { useAuthStore } from '@/stores/auth'

/**
 * Global error handler for navigation guards
 * Automatically handles authentication errors and redirects
 */
export function createErrorNavigationGuard() {
  return async (
    to: RouteLocationNormalized,
    _from: RouteLocationNormalized,
    next: NavigationGuardNext,
  ) => {
    try {
      // Get authentication status from localStorage for SSR-friendly checks
      const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'

      if (to.meta.requiresAuth && !isAuthenticated) {
        // Redirect to login if route requires authentication
        next({
          name: 'login',
          query: { redirect: to.fullPath },
        })
        return
      }

      if ((to.name === 'login' || to.name === 'register') && isAuthenticated) {
        // Redirect to notes if user is already logged in
        next({ name: 'notes' })
        return
      }

      // If user is authenticated, verify token validity for protected routes
      if (isAuthenticated && to.meta.requiresAuth) {
        try {
          const authStore = useAuthStore()
          await authStore.checkAuthStatus()
        } catch (error) {
          // Handle authentication errors
          const apiError = ApiErrorHandler.handleError(error)

          if (ApiErrorHandler.isAuthenticationError(error)) {
            // Clear auth state and redirect to login
            const authStore = useAuthStore()
            authStore.logout()

            next({
              name: 'login',
              query: {
                redirect: to.fullPath,
                error: 'session_expired',
              },
            })
            return
          }

          // For other errors, allow navigation but log the error
          console.error('Navigation error:', apiError.userMessage)
        }
      }

      next()
    } catch (error) {
      // Handle any unexpected errors in navigation
      console.error('Unexpected navigation error:', error)
      next()
    }
  }
}

/**
 * Error handler for route-level errors
 * Can be used in individual route components
 */
export function handleRouteError(error: unknown, routeName?: string) {
  const apiError = ApiErrorHandler.handleError(error)

  // Log error with context
  console.error(`Route error in ${routeName || 'unknown route'}:`, {
    code: apiError.code,
    message: apiError.userMessage,
    status: apiError.statusCode,
    originalError: apiError.originalError,
  })

  // Handle specific error types
  if (ApiErrorHandler.isAuthenticationError(error)) {
    // For auth errors, trigger logout and redirect
    const authStore = useAuthStore()
    authStore.logout()
    return
  }

  if (ApiErrorHandler.isNetworkError(error)) {
    // Could show a network error toast/modal
    console.warn('Network error detected:', apiError.userMessage)
    return
  }

  // For other errors, could show generic error message
  return apiError.userMessage
}
