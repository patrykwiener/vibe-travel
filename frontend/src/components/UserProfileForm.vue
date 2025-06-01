<script setup lang="ts">
import { computed } from 'vue'
import SelectInput from '@/components/SelectInput.vue'
import type { UserTravelStyleEnum, UserTravelPaceEnum, UserBudgetEnum } from '@/client/types.gen'

interface ProfileFormData {
  travelStyle: UserTravelStyleEnum | null
  preferredPace: UserTravelPaceEnum | null
  budget: UserBudgetEnum | null
}

interface Props {
  modelValue: ProfileFormData
  lastUpdated: string
  isLoading?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: ProfileFormData): void
  (e: 'submit'): void
  (e: 'change'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Travel style options
const travelStyleOptions = [
  { value: 'RELAX', label: 'Relax' },
  { value: 'ADVENTURE', label: 'Adventure' },
  { value: 'CULTURE', label: 'Culture' },
  { value: 'PARTY', label: 'Party' },
]

// Preferred pace options
const preferredPaceOptions = [
  { value: 'CALM', label: 'Calm' },
  { value: 'MODERATE', label: 'Moderate' },
  { value: 'INTENSE', label: 'Intense' },
]

// Budget options
const budgetOptions = [
  { value: 'LOW', label: 'Low Budget' },
  { value: 'MEDIUM', label: 'Medium Budget' },
  { value: 'HIGH', label: 'High Budget' },
]

// Computed properties for v-model
const travelStyle = computed({
  get: () => props.modelValue.travelStyle,
  set: (value: UserTravelStyleEnum | null) => {
    emit('update:modelValue', { ...props.modelValue, travelStyle: value })
    emit('change')
  },
})

const preferredPace = computed({
  get: () => props.modelValue.preferredPace,
  set: (value: UserTravelPaceEnum | null) => {
    emit('update:modelValue', { ...props.modelValue, preferredPace: value })
    emit('change')
  },
})

const budget = computed({
  get: () => props.modelValue.budget,
  set: (value: UserBudgetEnum | null) => {
    emit('update:modelValue', { ...props.modelValue, budget: value })
    emit('change')
  },
})

const handleSubmit = (event: Event) => {
  event.preventDefault()
  emit('submit')
}
</script>

<template>
  <form @submit="handleSubmit" class="space-y-6">
    <!-- Travel Style -->
    <SelectInput
      id="travel-style"
      v-model="travelStyle"
      label="Travel Style"
      :options="travelStyleOptions"
      help-text="Select the type of travel experience you prefer"
    />

    <!-- Preferred Pace -->
    <SelectInput
      id="preferred-pace"
      v-model="preferredPace"
      label="Preferred Pace"
      :options="preferredPaceOptions"
      help-text="How fast-paced do you like your trips to be?"
    />

    <!-- Budget -->
    <SelectInput
      id="budget"
      v-model="budget"
      label="Budget Range"
      :options="budgetOptions"
      help-text="Choose your typical travel budget range"
    />

    <!-- Last Updated Info -->
    <div class="pt-4 border-t border-gray-200 dark:border-gray-600">
      <p class="text-sm text-gray-500 dark:text-gray-400">Last updated: {{ lastUpdated }}</p>
    </div>

    <!-- Submit Button -->
    <button
      type="submit"
      :disabled="isLoading"
      class="w-full text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span v-if="isLoading">
        <svg
          class="inline w-4 h-4 mr-2 text-gray-200 animate-spin fill-primary-600"
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
        Saving...
      </span>
      <span v-else>Save Profile</span>
    </button>
  </form>
</template>
