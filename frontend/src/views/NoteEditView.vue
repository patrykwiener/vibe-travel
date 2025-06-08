<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNotesStore } from '@/stores/notes'
import NoteForm from '@/components/forms/NoteForm.vue'
import type { NoteOutSchema, NoteUpdateInSchema } from '@/client/types.gen'
import { ApiError } from '@/utils/api-errors'

const route = useRoute()
const router = useRouter()
const notesStore = useNotesStore()

// State
const note = ref<NoteOutSchema | null>(null)
const isLoading = ref(true)
const isSubmitting = ref(false)
const localError = ref<string | null>(null)

// Get note ID from route params
const noteId = computed(() => route.params.noteId as string)

// Clear error when user starts interacting with form
const clearError = () => {
  localError.value = null
}

// Load note data for editing
const loadNoteData = async () => {
  if (!noteId.value) {
    localError.value = 'Invalid note ID'
    isLoading.value = false
    return
  }

  try {
    isLoading.value = true
    localError.value = null

    const noteData = await notesStore.getNoteById(noteId.value)
    if (!noteData) {
      localError.value = 'Note not found'
      return
    }
    note.value = noteData
  } catch (error) {
    console.error('Failed to load note data:', error)
    if (error instanceof ApiError) {
      localError.value = error.userMessage
    } else {
      localError.value = 'Failed to load note. Please try again.'
    }
  } finally {
    isLoading.value = false
  }
}

// Handle form submission
const handleSubmit = async (formData: NoteUpdateInSchema) => {
  if (!noteId.value) return

  isSubmitting.value = true
  localError.value = null

  try {
    const updatedNote = await notesStore.updateNote(noteId.value, formData)

    // Navigate to the updated note detail view
    router.push({
      name: 'note-detail',
      params: { noteId: updatedNote.id.toString() },
    })
  } catch (error) {
    console.error('Failed to update note:', error)

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
  router.push({
    name: 'note-detail',
    params: { noteId: noteId.value },
  })
}

// Load note data on component mount
onMounted(() => {
  loadNoteData()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center items-center min-h-[400px]">
        <div class="text-center">
          <svg
            class="animate-spin -ml-1 mr-3 h-12 w-12 text-primary-600 mx-auto mb-4"
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
          <p class="text-lg font-medium text-gray-900 dark:text-white">Loading note...</p>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Please wait while we fetch your travel details
          </p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="localError && !note" class="text-center py-12">
        <div class="text-red-600 dark:text-red-400 mb-4">
          <svg class="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <p class="text-lg font-medium text-gray-900 dark:text-white">Failed to load note</p>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">{{ localError }}</p>
        </div>

        <button
          @click="loadNoteData"
          class="px-4 py-2 text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 transition-colors"
        >
          Try Again
        </button>
      </div>

      <!-- Note Edit Content -->
      <div v-else-if="note">
        <!-- Page Header -->
        <div class="mb-8">
          <div class="flex items-center gap-4 mb-6">
            <!-- Back Button -->
            <button
              type="button"
              @click="handleCancel"
              class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Go back to note details"
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
              <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Edit Note</h1>
              <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Update your travel plan details
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
                Update the information about your travel plans
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
              :initial-data="{
                title: note.title,
                place: note.place,
                date_from: note.date_from,
                date_to: note.date_to,
                number_of_people: note.number_of_people,
                key_ideas: note.key_ideas,
              }"
              :is-submitting="isSubmitting"
              :is-editing="true"
              @submit="handleSubmit"
              @cancel="handleCancel"
              @change="clearError"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
