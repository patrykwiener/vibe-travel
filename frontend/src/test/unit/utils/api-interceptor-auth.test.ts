import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ApiInterceptor } from '@/utils/api-interceptor'
import { ApiErrorHandler } from '@/utils/error-handler'
import { AuthenticationError, type ApiErrorResponse } from '@/utils/api-errors'
import type { ErrorModel } from '@/client/types.gen'

// Mock the error handler
vi.mock('@/utils/error-handler', () => ({
  ApiErrorHandler: {
    handleError: vi.fn(),
  },
}))

/**
 * Comprehensive tests for ApiInterceptor authentication error handling
 *
 * These tests focus specifically on the complex authentication error handling
 * that requires dynamic imports and side effects testing.
 *
 * The authentication error handler:
 * - Dynamically imports auth store and router to avoid circular dependencies
 * - Clears authentication state
 * - Redirects to login for non-public routes
 * - Handles import and navigation failures gracefully
 * - Always re-throws the original error
 */
describe('ApiInterceptor - Authentication Error Handling', () => {
  let mockApiErrorHandler: any

  beforeEach(() => {
    // Get the mocked ApiErrorHandler
    mockApiErrorHandler = vi.mocked(ApiErrorHandler)

    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})

    // Clear all dynamic imports before each test
    vi.resetModules()
    vi.doUnmock('@/stores/auth')
    vi.doUnmock('@/router')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  /**
   * Helper function to create mock API error responses
   */
  const createMockApiErrorResponse = (
    status: number,
    detail: string = 'Test error',
  ): ApiErrorResponse => ({
    error: { detail } as ErrorModel,
    response: {
      status,
      ok: false,
      headers: new Headers(),
      statusText: 'Error',
    } as Response,
    request: new Request('https://api.example.com/test'),
  })

  /**
   * Helper function to setup authentication error mocks
   */
  const setupAuthErrorMocks = (routeName = 'notes', routePath = '/notes') => {
    const mockAuthStore = {
      clearAuthState: vi.fn(),
    }
    const mockRouter = {
      default: {
        push: vi.fn(),
        currentRoute: {
          value: {
            name: routeName,
            fullPath: routePath,
          },
        },
      },
    }

    // Mock the dynamic imports
    vi.doMock('@/stores/auth', () => ({
      useAuthStore: () => mockAuthStore,
    }))
    vi.doMock('@/router', () => mockRouter)

    return { mockAuthStore, mockRouter }
  }

  describe('Authentication Error Handling Scenarios', () => {
    it('should redirect to login for non-public routes', async () => {
      const { mockAuthStore, mockRouter } = setupAuthErrorMocks('notes', '/notes/create')
      const authError = new AuthenticationError(createMockApiErrorResponse(401))
      const mockApiCall = vi.fn().mockRejectedValue(authError)

      mockApiErrorHandler.handleError.mockReturnValue(authError)

      await expect(ApiInterceptor.call(mockApiCall)).rejects.toThrow(AuthenticationError)

      expect(mockAuthStore.clearAuthState).toHaveBeenCalledOnce()
      expect(mockRouter.default.push).toHaveBeenCalledWith({
        name: 'login',
        query: {
          redirect: '/notes/create',
          error: 'session_expired',
        },
      })
    })

    it('should not redirect for public route - login', async () => {
      const { mockAuthStore, mockRouter } = setupAuthErrorMocks('login', '/login')
      const authError = new AuthenticationError(createMockApiErrorResponse(401))
      const mockApiCall = vi.fn().mockRejectedValue(authError)

      mockApiErrorHandler.handleError.mockReturnValue(authError)

      await expect(ApiInterceptor.call(mockApiCall)).rejects.toThrow(AuthenticationError)

      expect(mockAuthStore.clearAuthState).toHaveBeenCalledOnce()
      expect(mockRouter.default.push).not.toHaveBeenCalled()
    })

    it('should not redirect for public route - register', async () => {
      const { mockAuthStore, mockRouter } = setupAuthErrorMocks('register', '/register')
      const authError = new AuthenticationError(createMockApiErrorResponse(401))
      const mockApiCall = vi.fn().mockRejectedValue(authError)

      mockApiErrorHandler.handleError.mockReturnValue(authError)

      await expect(ApiInterceptor.call(mockApiCall)).rejects.toThrow(AuthenticationError)

      expect(mockAuthStore.clearAuthState).toHaveBeenCalledOnce()
      expect(mockRouter.default.push).not.toHaveBeenCalled()
    })

    it('should not redirect for public route - home', async () => {
      const { mockAuthStore, mockRouter } = setupAuthErrorMocks('home', '/')
      const authError = new AuthenticationError(createMockApiErrorResponse(401))
      const mockApiCall = vi.fn().mockRejectedValue(authError)

      mockApiErrorHandler.handleError.mockReturnValue(authError)

      await expect(ApiInterceptor.call(mockApiCall)).rejects.toThrow(AuthenticationError)

      expect(mockAuthStore.clearAuthState).toHaveBeenCalledOnce()
      expect(mockRouter.default.push).not.toHaveBeenCalled()
    })

    it('should handle dynamic import failures gracefully', async () => {
      const authError = new AuthenticationError(createMockApiErrorResponse(401))
      const mockApiCall = vi.fn().mockRejectedValue(authError)

      // Mock auth store import failure
      vi.doMock('@/stores/auth', () => {
        throw new Error('Failed to import auth store')
      })

      mockApiErrorHandler.handleError.mockReturnValue(authError)

      await expect(ApiInterceptor.call(mockApiCall)).rejects.toThrow(AuthenticationError)

      expect(console.error).toHaveBeenCalledWith(
        'Authentication error handler failed:',
        expect.any(Error),
      )
    })

    it('should handle router import failures gracefully', async () => {
      const authError = new AuthenticationError(createMockApiErrorResponse(401))
      const mockApiCall = vi.fn().mockRejectedValue(authError)
      const mockAuthStore = { clearAuthState: vi.fn() }

      // Mock successful auth import but failed router import
      vi.doMock('@/stores/auth', () => ({
        useAuthStore: () => mockAuthStore,
      }))
      vi.doMock('@/router', () => {
        throw new Error('Failed to import router')
      })

      mockApiErrorHandler.handleError.mockReturnValue(authError)

      await expect(ApiInterceptor.call(mockApiCall)).rejects.toThrow(AuthenticationError)

      expect(mockAuthStore.clearAuthState).toHaveBeenCalledOnce()
      expect(console.error).toHaveBeenCalledWith(
        'Authentication error handler failed:',
        expect.any(Error),
      )
    })

    it('should handle navigation failures gracefully', async () => {
      const authError = new AuthenticationError(createMockApiErrorResponse(401))
      const mockApiCall = vi.fn().mockRejectedValue(authError)
      const mockAuthStore = { clearAuthState: vi.fn() }
      const mockRouter = {
        default: {
          push: vi.fn().mockRejectedValue(new Error('Navigation failed')),
          currentRoute: {
            value: {
              name: 'notes',
              fullPath: '/notes',
            },
          },
        },
      }

      vi.doMock('@/stores/auth', () => ({
        useAuthStore: () => mockAuthStore,
      }))
      vi.doMock('@/router', () => mockRouter)

      mockApiErrorHandler.handleError.mockReturnValue(authError)

      await expect(ApiInterceptor.call(mockApiCall)).rejects.toThrow(AuthenticationError)

      expect(mockAuthStore.clearAuthState).toHaveBeenCalledOnce()
      expect(mockRouter.default.push).toHaveBeenCalledWith({
        name: 'login',
        query: {
          redirect: '/notes',
          error: 'session_expired',
        },
      })
      expect(console.error).toHaveBeenCalledWith(
        'Authentication error handler failed:',
        expect.any(Error),
      )
    })

    it('should always re-throw the original authentication error', async () => {
      const { mockAuthStore } = setupAuthErrorMocks()
      const authError = new AuthenticationError(createMockApiErrorResponse(401))
      const mockApiCall = vi.fn().mockRejectedValue(authError)

      mockApiErrorHandler.handleError.mockReturnValue(authError)

      const thrownError = await ApiInterceptor.call(mockApiCall).catch((error) => error)

      expect(thrownError).toBe(authError) // Same instance should be re-thrown
      expect(thrownError).toBeInstanceOf(AuthenticationError)
      expect(mockAuthStore.clearAuthState).toHaveBeenCalledOnce()
    })
  })

  describe('Multiple Authentication Errors', () => {
    it('should handle multiple authentication errors in sequence', async () => {
      const { mockAuthStore, mockRouter } = setupAuthErrorMocks()
      const authError = new AuthenticationError(createMockApiErrorResponse(401))
      const mockApiCall1 = vi.fn().mockRejectedValue(authError)
      const mockApiCall2 = vi.fn().mockRejectedValue(authError)

      mockApiErrorHandler.handleError.mockReturnValue(authError)

      // First call
      await expect(ApiInterceptor.call(mockApiCall1)).rejects.toThrow(AuthenticationError)

      // Second call
      await expect(ApiInterceptor.call(mockApiCall2)).rejects.toThrow(AuthenticationError)

      // Should handle both calls independently
      expect(mockAuthStore.clearAuthState).toHaveBeenCalledTimes(2)
      expect(mockRouter.default.push).toHaveBeenCalledTimes(2)
    })
  })
})
