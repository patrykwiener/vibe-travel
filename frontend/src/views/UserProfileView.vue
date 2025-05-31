<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import type { UserTravelStyleEnum, UserTravelPaceEnum, UserBudgetEnum } from '@/client/types.gen'
import { ApiError } from '@/utils/api-errors'

const authStore = useAuthStore()

// Form data
const travelStyle = ref<UserTravelStyleEnum | null>(null)
const preferredPace = ref<UserTravelPaceEnum | null>(null)
const budget = ref<UserBudgetEnum | null>(null)
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

// Load profile data on mount
onMounted(async () => {
  isLoading.value = true
  localError.value = null
  try {
    await authStore.fetchProfile()
    if (authStore.profile) {
      travelStyle.value = authStore.profile.travel_style || null
      preferredPace.value = authStore.profile.preferred_pace || null
      budget.value = authStore.profile.budget || null
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
const handleSubmit = async (event: Event) => {
  event.preventDefault()
  
  isSaving.value = true
  localError.value = null
  successMessage.value = null
  
  try {
    await authStore.updateProfile(travelStyle.value, preferredPace.value, budget.value)
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
    class="py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-6 bg-gray-100 dark:bg-gray-800 min-h-screen"
  >
    <div class="mx-auto max-w-2xl p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
      <div class="mb-6">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">Travel Preferences</h2>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Set your travel preferences to get personalized travel plans.
        </p>
      </div>

      <!-- Loading state -->
      <div v-if="isLoading" class="flex justify-center items-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700"></div>
        <span class="ml-2 text-gray-600 dark:text-gray-400">Loading profile...</span>
      </div>

      <!-- Form -->
      <div v-else>
        <form class="space-y-6" @submit="handleSubmit">
          <div>
            <label
              for="travel_style"
              class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Travel Style
            </label>
            <select
              id="travel_style"
              v-model="travelStyle"
              :disabled="isLoading || isSaving"
              class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500 disabled:opacity-50"
            >
              <option :value="null">Not Specified</option>
              <option value="RELAX">Relax</option>
              <option value="ADVENTURE">Adventure</option>
              <option value="CULTURE">Culture</option>
              <option value="PARTY">Party</option>
            </select>
          </div>

          <div>
            <label
              for="preferred_pace"
              class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Preferred Pace
            </label>
            <select
              id="preferred_pace"
              v-model="preferredPace"
              :disabled="isLoading || isSaving"
              class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500 disabled:opacity-50"
            >
              <option :value="null">Not Specified</option>
              <option value="CALM">Calm</option>
              <option value="MODERATE">Moderate</option>
              <option value="INTENSE">Intense</option>
            </select>
          </div>

          <div>
            <label
              for="budget"
              class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Budget
            </label>
            <select
              id="budget"
              v-model="budget"
              :disabled="isLoading || isSaving"
              class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500 disabled:opacity-50"
            >
              <option :value="null">Not Specified</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Last updated: <span class="font-medium">{{ lastUpdated }}</span>
            </p>
          </div>

          <!-- Success message display -->
          <div
            v-if="successMessage"
            class="p-4 mb-4 text-sm text-green-800 rounded-lg bg-green-50 dark:bg-gray-800 dark:text-green-400"
          >
            {{ successMessage }}
          </div>

          <!-- Error message display -->
          <div
            v-if="localError"
            class="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400"
          >
            {{ localError }}
          </div>

          <button
            type="submit"
            :disabled="isLoading || isSaving"
            class="text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="isSaving">Saving...</span>
            <span v-else>Save Preferences</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
