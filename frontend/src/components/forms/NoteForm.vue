<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <!-- Title Field -->
    <div>
      <label for="title" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
        Title <span class="text-red-500">*</span>
      </label>
      <input
        id="title"
        v-model="formData.title"
        type="text"
        required
        minlength="3"
        maxlength="255"
        class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
        placeholder="Enter trip title..."
        :class="{ 'border-red-500 dark:border-red-500': fieldErrors.title }"
        @input="emit('change')"
        @blur="validateField('title')"
      />
      <p v-if="fieldErrors.title" class="mt-1 text-sm text-red-600 dark:text-red-400">
        {{ fieldErrors.title }}
      </p>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Give your trip a memorable name (3-255 characters)
      </p>
    </div>

    <!-- Place Field -->
    <div>
      <label for="place" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
        Destination <span class="text-red-500">*</span>
      </label>
      <input
        id="place"
        v-model="formData.place"
        type="text"
        required
        minlength="3"
        maxlength="255"
        class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
        placeholder="Where are you going?"
        :class="{ 'border-red-500 dark:border-red-500': fieldErrors.place }"
        @input="emit('change')"
        @blur="validateField('place')"
      />
      <p v-if="fieldErrors.place" class="mt-1 text-sm text-red-600 dark:text-red-400">
        {{ fieldErrors.place }}
      </p>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Enter your travel destination (3-255 characters)
      </p>
    </div>

    <!-- Date Fields -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label for="date_from" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
          Start Date <span class="text-red-500">*</span>
        </label>
        <input
          id="date_from"
          v-model="formData.date_from"
          type="date"
          required
          :min="minDate"
          :max="maxDate"
          class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
          :class="{ 'border-red-500 dark:border-red-500': fieldErrors.date_from }"
          @input="emit('change')"
          @blur="validateDateRange"
          @change="validateDateRange"
        />
        <p v-if="fieldErrors.date_from" class="mt-1 text-sm text-red-600 dark:text-red-400">
          {{ fieldErrors.date_from }}
        </p>
      </div>
      <div>
        <label for="date_to" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
          End Date <span class="text-red-500">*</span>
        </label>
        <input
          id="date_to"
          v-model="formData.date_to"
          type="date"
          required
          :min="formData.date_from || minDate"
          :max="maxEndDate"
          class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
          :class="{ 'border-red-500 dark:border-red-500': fieldErrors.date_to }"
          @input="emit('change')"
          @blur="validateDateRange"
          @change="validateDateRange"
        />
        <p v-if="fieldErrors.date_to" class="mt-1 text-sm text-red-600 dark:text-red-400">
          {{ fieldErrors.date_to }}
        </p>
      </div>
    </div>
    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
      End date must be within 14 days of start date
    </p>

    <!-- Number of People Field -->
    <div>
      <label
        for="number_of_people"
        class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
      >
        Number of Travelers <span class="text-red-500">*</span>
      </label>
      <input
        id="number_of_people"
        v-model.number="formData.number_of_people"
        type="number"
        required
        min="1"
        max="20"
        class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
        placeholder="How many people are traveling?"
        :class="{ 'border-red-500 dark:border-red-500': fieldErrors.number_of_people }"
        @input="emit('change')"
        @blur="validateField('number_of_people')"
      />
      <p v-if="fieldErrors.number_of_people" class="mt-1 text-sm text-red-600 dark:text-red-400">
        {{ fieldErrors.number_of_people }}
      </p>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Enter number of travelers (1-20 people)
      </p>
    </div>

    <!-- Key Ideas Field -->
    <div>
      <label for="key_ideas" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
        Key Ideas & Activities
      </label>
      <textarea
        id="key_ideas"
        v-model="formData.key_ideas"
        rows="4"
        maxlength="2000"
        class="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
        placeholder="Describe what you want to do during your trip..."
        :class="{ 'border-red-500 dark:border-red-500': fieldErrors.key_ideas }"
        @input="emit('change')"
        @blur="validateField('key_ideas')"
      ></textarea>
      <div class="flex justify-between mt-1">
        <p v-if="fieldErrors.key_ideas" class="text-sm text-red-600 dark:text-red-400">
          {{ fieldErrors.key_ideas }}
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ keyIdeasLength }}/2000 characters</p>
      </div>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Optional: Describe activities, places you want to visit, or special interests
      </p>
    </div>

    <!-- Form Actions -->
    <div class="flex items-center space-x-4">
      <button
        type="submit"
        :disabled="isSubmitting || !isFormValid"
        class="text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span v-if="isSubmitting">
          <svg
            class="animate-spin -ml-1 mr-3 h-4 w-4 text-white inline"
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
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          {{ isEditing ? 'Saving...' : 'Creating...' }}
        </span>
        <span v-else> {{ isEditing ? 'Save Changes' : 'Create Note' }} </span>
      </button>

      <button
        type="button"
        @click="handleCancel"
        class="py-2.5 px-5 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-primary-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
      >
        Cancel
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import type { NoteCreateInSchema, NoteUpdateInSchema } from '@/client/types.gen'

// Props
interface Props {
  initialData?: Partial<NoteCreateInSchema>
  isSubmitting?: boolean
  isEditing?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  initialData: () => ({}),
  isSubmitting: false,
  isEditing: false,
})

// Emits
interface Emits {
  submit: [data: NoteCreateInSchema | NoteUpdateInSchema]
  cancel: []
  change: []
}

const emit = defineEmits<Emits>()

// Form data
const formData = reactive<NoteCreateInSchema>({
  title: props.initialData.title || '',
  place: props.initialData.place || '',
  date_from: props.initialData.date_from || '',
  date_to: props.initialData.date_to || '',
  number_of_people: props.initialData.number_of_people || 1,
  key_ideas: props.initialData.key_ideas || '',
})

// Validation state
const fieldErrors = reactive<Record<string, string>>({})

// Date constraints
const today = new Date()
const minDate = computed(() => {
  return today.toISOString().split('T')[0]
})

const maxDate = computed(() => {
  const maxDate = new Date()
  maxDate.setFullYear(maxDate.getFullYear() + 2)
  return maxDate.toISOString().split('T')[0]
})

const maxEndDate = computed(() => {
  if (!formData.date_from) return maxDate.value

  const startDate = new Date(formData.date_from)
  const maxEndDate = new Date(startDate)
  maxEndDate.setDate(startDate.getDate() + 14)

  return maxEndDate.toISOString().split('T')[0]
})

// Character count for key_ideas
const keyIdeasLength = computed(() => formData.key_ideas?.length || 0)

// Form validation
const validateField = (fieldName: keyof NoteCreateInSchema) => {
  delete fieldErrors[fieldName]

  switch (fieldName) {
    case 'title':
      if (!formData.title) {
        fieldErrors.title = 'Title is required'
      } else if (formData.title.length < 3) {
        fieldErrors.title = 'Title must be at least 3 characters'
      } else if (formData.title.length > 255) {
        fieldErrors.title = 'Title must not exceed 255 characters'
      }
      break

    case 'place':
      if (!formData.place) {
        fieldErrors.place = 'Destination is required'
      } else if (formData.place.length < 3) {
        fieldErrors.place = 'Destination must be at least 3 characters'
      } else if (formData.place.length > 255) {
        fieldErrors.place = 'Destination must not exceed 255 characters'
      }
      break

    case 'date_from':
      if (!formData.date_from) {
        fieldErrors.date_from = 'Start date is required'
      } else {
        const startDate = new Date(formData.date_from)
        const todayDate = new Date(today.toISOString().split('T')[0])
        if (startDate < todayDate) {
          fieldErrors.date_from = 'Start date cannot be in the past'
        }
      }
      break

    case 'date_to':
      if (!formData.date_to) {
        fieldErrors.date_to = 'End date is required'
      } else if (formData.date_from && formData.date_to < formData.date_from) {
        fieldErrors.date_to = 'End date must be after start date'
      }
      break

    case 'number_of_people':
      if (!formData.number_of_people || formData.number_of_people < 1) {
        fieldErrors.number_of_people = 'Number of people must be at least 1'
      } else if (formData.number_of_people > 20) {
        fieldErrors.number_of_people = 'Number of people cannot exceed 20'
      }
      break

    case 'key_ideas':
      if (formData.key_ideas && formData.key_ideas.length > 2000) {
        fieldErrors.key_ideas = 'Key ideas must not exceed 2000 characters'
      }
      break
  }
}

const validateDateRange = () => {
  validateField('date_from')
  validateField('date_to')

  // Only validate range if both dates are present and individually valid
  if (formData.date_from && formData.date_to && !fieldErrors.date_from && !fieldErrors.date_to) {
    const startDate = new Date(formData.date_from)
    const endDate = new Date(formData.date_to)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays > 14) {
      fieldErrors.date_to = 'Trip duration cannot exceed 14 days'
    }
  }
}

const validateForm = () => {
  // Clear previous errors
  Object.keys(fieldErrors).forEach((key) => delete fieldErrors[key])

  // Validate all fields
  validateField('title')
  validateField('place')
  validateField('date_from')
  validateField('date_to')
  validateField('number_of_people')
  validateField('key_ideas')
  validateDateRange()

  return Object.keys(fieldErrors).length === 0
}

const isFormValid = computed(() => {
  return (
    formData.title.length >= 3 &&
    formData.place.length >= 3 &&
    formData.date_from &&
    formData.date_to &&
    formData.number_of_people >= 1 &&
    formData.number_of_people <= 20 &&
    (!formData.key_ideas || formData.key_ideas.length <= 2000) &&
    Object.keys(fieldErrors).length === 0
  )
})

// Form handlers
const handleSubmit = () => {
  if (!validateForm()) {
    return
  }

  // Clear any non-empty key_ideas that's just whitespace
  const submissionData: NoteCreateInSchema | NoteUpdateInSchema = {
    ...formData,
    key_ideas: formData.key_ideas?.trim() || null,
  }

  emit('submit', submissionData)
}

const handleCancel = () => {
  emit('cancel')
}

// Watch for changes in date_from to update date_to validation
watch(
  () => formData.date_from,
  () => {
    if (formData.date_to) {
      validateDateRange()
    }
  },
)

// Watch for changes in date_to to validate range
watch(
  () => formData.date_to,
  () => {
    if (formData.date_from && formData.date_to) {
      validateDateRange()
    }
  },
)

// Expose validation method for parent component
defineExpose({
  validateForm,
})
</script>
