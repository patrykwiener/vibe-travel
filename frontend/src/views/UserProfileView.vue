<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import UserProfileForm from '@/components/forms/UserProfileForm.vue'
import type { UserTravelStyleEnum, UserTravelPaceEnum, UserBudgetEnum } from '@/client/types.gen'
import { ApiError } from '@/utils/api-errors'

const authStore = useAuthStore()

// Profile form data interface
interface ProfileFormData {
  travelStyle: UserTravelStyleEnum | null
  preferredPace: UserTravelPaceEnum | null
  budget: UserBudgetEnum | null
}

// State management
const profileFormData = ref<ProfileFormData>({
  travelStyle: null,
  preferredPace: null,
  budget: null,
})

const isLoading = ref(false)
const isSaving = ref(false)
const localError = ref<string | null>(null)
const successMessage = ref<string | null>(null)

// Computed for last updated display
const lastUpdated = computed(() => {
  if (authStore.profile?.updated_at) {
    return new Date(authStore.profile.updated_at).toLocaleDateString()
  }
  return 'Not updated yet'
})

// Clear error when user starts interacting with form
const clearError = () => {
  localError.value = null
  successMessage.value = null
}

// Load profile data on mount
onMounted(async () => {
  isLoading.value = true
  localError.value = null
  try {
    await authStore.fetchProfile()
    if (authStore.profile) {
      profileFormData.value = {
        travelStyle: authStore.profile.travel_style || null,
        preferredPace: authStore.profile.preferred_pace || null,
        budget: authStore.profile.budget || null,
      }
    }
  } catch (error) {
    console.error('Failed to load profile:', error)
    if (error instanceof ApiError) {
      localError.value = error.userMessage
    } else {
      localError.value = 'Failed to load profile. Please try again.'
    }
  } finally {
    isLoading.value = false
  }
})

// Handle form submission
const handleSubmit = async () => {
  isSaving.value = true
  localError.value = null
  successMessage.value = null

  try {
    await authStore.updateProfile(
      profileFormData.value.travelStyle,
      profileFormData.value.preferredPace,
      profileFormData.value.budget,
    )
    successMessage.value = 'Profile updated successfully!'
  } catch (error) {
    console.error('Failed to update profile:', error)
    if (error instanceof ApiError) {
      localError.value = error.userMessage
    } else {
      localError.value = 'Failed to update profile. Please try again.'
    }
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div
    class="py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-6 bg-gray-50 dark:bg-gray-900 min-h-screen"
  >
    <div
      class="mx-auto max-w-2xl p-6 bg-white rounded-lg shadow-lg dark:bg-gray-800 border dark:border-gray-700"
    >
      <!-- Header -->
      <div class="mb-6">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">Travel Preferences</h2>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Update your travel preferences to get personalized trip recommendations
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center items-center py-8">
        <svg
          class="w-8 h-8 text-gray-200 animate-spin fill-primary-600"
          viewBox="0 0 100 101"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
            fill="currentColor"
          />
          <path
            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
            fill="currentFill"
          />
        </svg>
        <span class="ml-2 text-gray-500">Loading profile...</span>
      </div>

      <!-- Error Alert -->
      <div
        v-if="localError"
        class="flex items-center p-4 mb-4 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800"
        role="alert"
      >
        <svg
          class="flex-shrink-0 inline w-4 h-4 mr-3"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z"
          />
        </svg>
        <span class="sr-only">Error</span>
        <div>{{ localError }}</div>
      </div>

      <!-- Success Alert -->
      <div
        v-if="successMessage"
        class="flex items-center p-4 mb-4 text-sm text-green-800 border border-green-300 rounded-lg bg-green-50 dark:bg-gray-800 dark:text-green-400 dark:border-green-800"
        role="alert"
      >
        <svg
          class="flex-shrink-0 inline w-4 h-4 mr-3"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM13.5 6a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM10 15a1 1 0 0 1-1-1v-3a1 1 0 0 1 2 0v3a1 1 0 0 1-1 1Z"
          />
        </svg>
        <span class="sr-only">Success</span>
        <div>{{ successMessage }}</div>
      </div>

      <!-- Profile Form -->
      <UserProfileForm
        v-if="!isLoading"
        v-model="profileFormData"
        :last-updated="lastUpdated"
        :is-loading="isSaving"
        @submit="handleSubmit"
        @change="clearError"
      />
    </div>
  </div>
</template>
