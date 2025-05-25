import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useRouter } from 'vue-router'

export interface User {
  id: string
  email: string
  username?: string
  isActive: boolean
}

export interface UserProfile {
  id: string
  userId: string
  preferredDestinations?: string[]
  travelStyle?: string
  budgetLevel?: string
  dietaryRestrictions?: string[]
  activityPreferences?: string[]
}

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()
  const user = ref<User | null>(null)
  const profile = ref<UserProfile | null>(null)
  const token = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value)

  // Load token from localStorage on initialization
  const initializeAuth = () => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (storedToken) {
      token.value = storedToken
    }

    if (storedUser) {
      try {
        user.value = JSON.parse(storedUser)
      } catch (e) {
        console.error('Failed to parse stored user data:', e)
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const login = async (email: string, _password: string) => {
    isLoading.value = true
    error.value = null

    try {
      // TODO: Implement actual API call once backend is connected
      // For now, just simulate a successful login
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Simulated response
      const mockToken = 'mock-jwt-token'
      const mockUser = {
        id: '1',
        email,
        isActive: true,
      }

      // Store in state
      token.value = mockToken
      user.value = mockUser

      // Store in localStorage for persistence
      localStorage.setItem('token', mockToken)
      localStorage.setItem('user', JSON.stringify(mockUser))

      // Redirect to notes page after successful login
      router.push({ name: 'notes' })
    } catch (e) {
      console.error('Login error:', e)
      error.value = 'Failed to login. Please check your credentials and try again.'
    } finally {
      isLoading.value = false
    }
  }

  const logout = () => {
    // Clear state
    user.value = null
    token.value = null
    profile.value = null

    // Clear localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('user')

    // Redirect to home page
    router.push({ name: 'home' })
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const register = async (email: string, password: string, _username?: string) => {
    isLoading.value = true
    error.value = null

    try {
      // TODO: Implement actual API call once backend is connected
      // For now, just simulate a successful registration
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // After successful registration, log the user in automatically
      await login(email, password)
    } catch (e) {
      console.error('Registration error:', e)
      error.value = 'Failed to register. Please try again with different credentials.'
    } finally {
      isLoading.value = false
    }
  }

  const fetchProfile = async () => {
    if (!token.value || !user.value) return

    isLoading.value = true
    error.value = null

    try {
      // TODO: Implement actual API call once backend is connected
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Simulated response
      profile.value = {
        id: '1',
        userId: user.value.id,
        preferredDestinations: ['Beach', 'Mountains'],
        travelStyle: 'Adventure',
        budgetLevel: 'Medium',
        dietaryRestrictions: [],
        activityPreferences: ['Hiking', 'Sightseeing'],
      }
    } catch (e) {
      console.error('Fetch profile error:', e)
      error.value = 'Failed to load profile data.'
    } finally {
      isLoading.value = false
    }
  }

  // Initialize auth on store creation
  initializeAuth()

  return {
    user,
    profile,
    token,
    isLoading,
    error,
    isAuthenticated,
    login,
    logout,
    register,
    fetchProfile,
  }
})
