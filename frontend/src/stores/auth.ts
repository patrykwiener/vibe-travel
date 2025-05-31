import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useRouter } from 'vue-router'
import {
  usersAuthJwtLogin,
  usersAuthJwtLogout,
  usersRegisterRegister,
  usersUsersCurrentUser,
  profileUserProfileCbvGetProfile,
  profileUserProfileCbvUpdateProfile,
} from '@/client/sdk.gen'
import { apiCall } from '@/utils/api-interceptor'
import { ApiError } from '@/utils/api-errors'
import type {
  UserRead,
  UserCreate,
  Login,
  UserProfileOutSchema,
  UserProfileInSchema,
  UserTravelStyleEnum,
  UserTravelPaceEnum,
  UserBudgetEnum,
} from '@/client/types.gen'

// Using OpenAPI types directly
export type User = UserRead
export type UserProfile = UserProfileOutSchema

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()

  const user = ref<User | null>(null)
  const profile = ref<UserProfile | null>(null)
  const isAuthenticated = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Load authentication state from localStorage on initialization
  const initializeAuth = async () => {
    const storedUser = localStorage.getItem('user')
    const storedAuthState = localStorage.getItem('isAuthenticated')

    if (storedUser && storedAuthState === 'true') {
      try {
        user.value = JSON.parse(storedUser)
        isAuthenticated.value = true

        // Verify token validity with backend
        await checkAuthStatus()
      } catch (e) {
        console.error('Failed to parse stored user data:', e)
        // Clear invalid data
        clearAuthStateIncludingErrors()
      }
    }
  }
  const checkAuthStatus = async () => {
    if (!isAuthenticated.value) return

    try {
      const userData = await apiCall(() => usersUsersCurrentUser())
      user.value = userData
      isAuthenticated.value = true
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('isAuthenticated', 'true')
    } catch (e) {
      console.error('Token validation failed:', e)
      clearAuthStateIncludingErrors()
      throw e
    }
  }

  const clearAuthState = () => {
    user.value = null
    profile.value = null
    isAuthenticated.value = false
    localStorage.removeItem('user')
    localStorage.removeItem('isAuthenticated')
  }

  const clearAuthStateIncludingErrors = () => {
    clearAuthState()
    error.value = null
  }

  const login = async (email: string, password: string) => {
    isLoading.value = true
    error.value = null

    const loginData: Login = {
      username: email, // Backend expects 'username' field for email
      password: password,
    }

    console.log('About to call usersAuthJwtLogin with:', loginData)

    // Login call - the backend sets HTTP-only cookies
    try {
      await apiCall(() => usersAuthJwtLogin({ body: loginData }))
    } catch (e) {
      isLoading.value = false
      if (e instanceof ApiError) {
        error.value = e.userMessage
      } else {
        console.error('Login error:', e)
        error.value = 'Authentication failed. Please try again.'
      }
      clearAuthState()
      return
    }

    try {
      console.log('Login successful, fetching user data')

      // Get current user data after successful login
      const userData = await apiCall(() => usersUsersCurrentUser())

      user.value = userData
      isAuthenticated.value = true
      isLoading.value = false

      // Store user data and auth state in localStorage
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('isAuthenticated', 'true')

      // Check for redirect URL from query params
      const redirectTo = router.currentRoute.value.query.redirect as string

      // Redirect to the intended page or default to notes
      router.push(redirectTo || { name: 'notes' })
    } catch (e) {
      isLoading.value = false
      console.error('Error fetching user data after login:', e)
      error.value = 'Login successful but failed to load user data. Please refresh the page.'
    }
  }

  const logout = async () => {
    isLoading.value = true
    error.value = null

    try {
      // Call backend logout to clear HTTP-only cookies
      await apiCall(() => usersAuthJwtLogout())
    } catch (e) {
      console.error('Logout error:', e)
      // Continue with local cleanup even if backend call fails
    } finally {
      // Clear local state regardless of backend response
      clearAuthState()

      // Redirect to home page
      router.push({ name: 'home' })

      isLoading.value = false
    }
  }

  const register = async (email: string, password: string) => {
    const result = await withErrorHandling(
      async () => {
        const registerData: UserCreate = {
          email: email,
          password: password,
        }

        const userData = await apiCall(() => usersRegisterRegister({ body: registerData }))

        // After successful registration, redirect to login page as per requirement
        router.push({ name: 'login' })
        return userData
      },
      {
        onError: (apiError) => {
          error.value = apiError.userMessage
        },
        onSuccess: () => {
          error.value = null
        },
      },
    )

    return result
  }

  // Profile management
  const updateProfile = async (
    travelStyle?: UserTravelStyleEnum | null,
    preferredPace?: UserTravelPaceEnum | null,
    budget?: UserBudgetEnum | null,
  ): Promise<UserProfileOutSchema | null> => {
    const result = await withErrorHandling(
      async () => {
        const profileData: UserProfileInSchema = {
          travel_style: travelStyle,
          preferred_pace: preferredPace,
          budget: budget,
        }

        const updatedProfile = await apiCall(() =>
          profileUserProfileCbvUpdateProfile({ body: profileData }),
        )

        profile.value = updatedProfile
        return updatedProfile
      },
      {
        onError: (apiError) => {
          error.value = apiError.userMessage
          throw apiError
        },
        onSuccess: () => {
          error.value = null
        },
      },
    )

    return result || null
  }

  const fetchProfile = async (): Promise<UserProfileOutSchema | null> => {
    if (!isAuthenticated.value || !user.value) return null

    try {
      const profileData = await apiCall(() => profileUserProfileCbvGetProfile())
      profile.value = profileData
      return profileData
    } catch (e) {
      if (e instanceof ApiError) {
        error.value = e.userMessage
      }  else {
        console.error('Error fetching profile:', e)
        error.value = 'Failed to load profile. Please try again later.'
      }
      return null
    }
  }


  // Initialize auth on store creation
  initializeAuth()

  return {
    user,
    profile,
    isLoading,
    error,
    isAuthenticated,
    login,
    logout,
    register,
    fetchProfile,
    checkAuthStatus,
    updateProfile,
  }
})
