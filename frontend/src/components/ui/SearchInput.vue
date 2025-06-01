<script setup lang="ts">
import { computed } from 'vue'

// Props
interface Props {
  modelValue: string
  placeholder?: string
  isLoading?: boolean
  maxLength?: number
  minLength?: number
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Search notes...',
  isLoading: false,
  maxLength: 255,
  minLength: 2,
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: string]
  search: [query: string]
  clear: []
}>()

// Local search value
const searchValue = computed({
  get: () => props.modelValue,
  set: (value: string) => {
    // Trim and validate length
    const trimmedValue = value.trim()

    if (trimmedValue.length <= props.maxLength) {
      emit('update:modelValue', trimmedValue)
    }
  },
})

// Clear search
const clearSearch = () => {
  emit('update:modelValue', '')
  emit('clear')
}

// Handle Enter key
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault()
    if (searchValue.value.length >= props.minLength) {
      emit('search', searchValue.value)
    }
  } else if (event.key === 'Escape') {
    clearSearch()
  }
}

// Computed states
const hasValue = computed(() => searchValue.value.length > 0)
const isValidLength = computed(
  () => searchValue.value.length === 0 || searchValue.value.length >= props.minLength,
)
</script>

<template>
  <div class="relative">
    <!-- Search Input -->
    <div class="relative">
      <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <!-- Search Icon -->
        <svg
          class="w-4 h-4 text-gray-500 dark:text-gray-400"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 20 20"
        >
          <path
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
          />
        </svg>
      </div>

      <input
        v-model="searchValue"
        type="text"
        :placeholder="placeholder"
        :maxlength="maxLength"
        @keydown="handleKeydown"
        class="block w-full p-4 pl-10 pr-12 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
        :class="{
          'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400':
            !isValidLength,
        }"
      />

      <!-- Loading Spinner (when loading) -->
      <div v-if="isLoading" class="absolute inset-y-0 right-0 flex items-center pr-3">
        <svg
          class="w-4 h-4 text-gray-400 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>

      <!-- Clear Button (when not loading and has value) -->
      <button
        v-else-if="hasValue"
        @click="clearSearch"
        type="button"
        class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        aria-label="Clear search"
      >
        <svg
          class="w-4 h-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>

    <!-- Validation Message -->
    <div v-if="!isValidLength" class="mt-1 text-sm text-red-600 dark:text-red-400">
      Search query must be at least {{ minLength }} characters long.
    </div>
  </div>
</template>
