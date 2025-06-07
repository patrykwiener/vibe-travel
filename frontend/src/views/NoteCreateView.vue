<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useNotesStore } from '@/stores/notes'
import NoteForm from '@/components/forms/NoteForm.vue'
import type { NoteCreateInSchema } from '@/client/types.gen'
import { ApiError } from '@/utils/api-errors'

const router = useRouter()
const notesStore = useNotesStore()

// Form state
const isSubmitting = ref(false)
const localError = ref<string | null>(null)

// Clear error when user starts interacting with form
const clearError = () => {
  localError.value = null
}

// Handle form submission
const handleSubmit = async (formData: NoteCreateInSchema) => {
  isSubmitting.value = true
  localError.value = null // Clear previous errors

  try {
    const createdNote = await notesStore.createNote(formData)

    // Navigate to the newly created note detail view
    router.push({
      name: 'note-detail',
      params: { noteId: createdNote.id.toString() },
    })
  } catch (error) {
    console.error('Failed to create note:', error)

    if (error instanceof ApiError) {
      // All API errors (including validation and conflict errors) are handled at view level
      localError.value = error.userMessage
    } else {
      localError.value = 'An unexpected error occurred. Please try again.'
    }
  } finally {
    isSubmitting.value = false
  }
}

// Handle form cancellation
const handleCancel = () => {
  router.push({ name: 'notes' })
}

// Form reference for validation
const formRef = ref<InstanceType<typeof NoteForm> | null>(null)
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Page Header -->
      <div class="mb-8">
        <div class="flex items-center gap-4 mb-6">
          <!-- Back Button -->
          <button
            type="button"
            @click="handleCancel"
            class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Go back to notes list"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Create New Note</h1>
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Add details about your upcoming trip to get started
            </p>
          </div>
        </div>

        <!-- Divider -->
        <div class="border-t border-gray-200 dark:border-gray-700"></div>
      </div>

      <!-- Main Content -->
      <div class="max-w-2xl mx-auto">
        <div
          class="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-xl p-6"
        >
          <div class="mb-6">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Trip Details</h2>
            <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Fill in the information about your travel plans
            </p>
          </div>

          <!-- Error Alert - Following Flowbite alert standards -->
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

          <NoteForm
            ref="formRef"
            :is-submitting="isSubmitting"
            @submit="handleSubmit"
            @cancel="handleCancel"
            @change="clearError"
          />
        </div>
      </div>
    </div>
  </div>
</template>
