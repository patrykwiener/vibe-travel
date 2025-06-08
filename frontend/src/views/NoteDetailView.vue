<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNotesStore } from '@/stores/notes'
import { usePlanStore } from '@/stores/plan'
import type { NoteOutSchema } from '@/client/types.gen'
import NoteDisplaySection from '@/components/notes/NoteDisplaySection.vue'
import PlanSection from '@/components/notes/PlanSection.vue'
import ConfirmationModal from '@/components/ui/ConfirmationModal.vue'
import PlanGenerationModal from '@/components/ui/PlanGenerationModal.vue'

const route = useRoute()
const router = useRouter()
const notesStore = useNotesStore()
const planStore = usePlanStore()

// State
const note = ref<NoteOutSchema | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)
const showDeleteConfirmation = ref(false)
const showPlanGenerationModal = ref(false)

// Get note ID from route params
const noteId = computed(() => route.params.noteId as string)

// Load note and plan data
const loadNoteData = async () => {
  if (!noteId.value) {
    error.value = 'Invalid note ID'
    isLoading.value = false
    return
  }

  try {
    isLoading.value = true
    error.value = null

    // Set the active note ID in the plan store first
    planStore.setActiveNoteId(parseInt(noteId.value))

    // Load note details
    const noteData = await notesStore.getNoteById(noteId.value)
    if (!noteData) {
      error.value = 'Note not found'
      return
    }
    note.value = noteData

    // Load plan for this note
    await planStore.loadPlanForNote(parseInt(noteId.value))
  } catch (e) {
    console.error('Failed to load note data:', e)
    error.value = 'Failed to load note. Please try again.'
  } finally {
    isLoading.value = false
  }
}

// Generate new plan
const generatePlan = async () => {
  if (!note.value) return

  try {
    // Check if user has unsaved changes and confirm overwrite
    if (planStore.canSaveChanges && !showPlanGenerationModal.value) {
      showPlanGenerationModal.value = true
      return
    }

    // Show modal during generation
    if (!showPlanGenerationModal.value) {
      showPlanGenerationModal.value = true
    }

    await planStore.generatePlan()
    showPlanGenerationModal.value = false
  } catch (e) {
    console.error('Failed to generate plan:', e)
    error.value = 'Failed to generate plan. Please try again.'
    showPlanGenerationModal.value = false
  }
}

// Save plan changes
const savePlan = async () => {
  console.log('savePlan called, canSaveChanges:', planStore.canSaveChanges)

  if (!planStore.canSaveChanges) {
    console.log('Cannot save changes, canSaveChanges is false')
    return
  }

  try {
    await planStore.savePlan()
  } catch (e) {
    console.error('Failed to save plan:', e)
    error.value = 'Failed to save plan. Please try again.'
  }
}

// Delete note
const deleteNote = async () => {
  if (!noteId.value) return

  try {
    await notesStore.deleteNote(noteId.value)
    router.push('/notes')
  } catch (e) {
    console.error('Failed to delete note:', e)
    error.value = 'Failed to delete note. Please try again.'
  }
}

// Confirm deletion
const confirmDelete = () => {
  showDeleteConfirmation.value = true
}

// Cancel deletion
const cancelDelete = () => {
  showDeleteConfirmation.value = false
}

// Confirm overwrite plan
const confirmOverwritePlan = () => {
  generatePlan()
}

// Cancel overwrite plan
const cancelOverwritePlan = () => {
  showPlanGenerationModal.value = false
}

// Update plan text
const updatePlanText = (value: string) => {
  planStore.updatePlanText(value)
}

// Discard changes
const discardChanges = async () => {
  try {
    await planStore.discardChanges()
  } catch (e) {
    console.error('Failed to discard changes:', e)
    error.value = 'Failed to discard changes. Please try again.'
  }
}

// Watch for route changes and load data immediately
watch(
  () => route.params.noteId,
  () => {
    if (route.params.noteId) {
      loadNoteData()
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      <div v-else-if="error" class="text-center py-12">
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
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">{{ error }}</p>
        </div>
        <button
          @click="loadNoteData"
          class="px-4 py-2 text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 transition-colors"
        >
          Try Again
        </button>
      </div>

      <!-- Note Content -->
      <div v-else-if="note">
        <!-- Page Header -->
        <div class="mb-8">
          <div class="flex items-center gap-4 mb-6">
            <!-- Back Button -->
            <router-link
              to="/notes"
              class="inline-flex items-center gap-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Go back to notes list"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span class="text-sm font-medium">Back</span>
            </router-link>

            <div class="flex-1">
              <h1 class="text-3xl font-bold text-gray-900 dark:text-white">{{ note.title }}</h1>
              <p class="mt-2 text-lg text-gray-600 dark:text-gray-400">
                Travel details and plan for your trip
              </p>
            </div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="space-y-8">
          <!-- Note Details Section -->
          <div
            class="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-xl p-8"
          >
            <NoteDisplaySection :note="note" :note-id="noteId" @delete="confirmDelete" />
          </div>

          <!-- Plan Section -->
          <div
            class="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-xl p-8"
          >
            <PlanSection
              :plan-text="planStore.planText || ''"
              :plan-type="planStore.currentPlanType"
              :is-generating="planStore.isGeneratingPlan"
              :is-saving="planStore.isSavingPlan"
              :can-save="planStore.canSaveChanges"
              :can-discard="planStore.canDiscardChanges"
              @generate="generatePlan"
              @save="savePlan"
              @discard="discardChanges"
              @update:plan-text="updatePlanText"
            />
          </div>
        </div>

        <!-- Navigation Footer -->
        <div class="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <router-link
            to="/notes"
            class="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Notes List
          </router-link>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <ConfirmationModal
      :show="showDeleteConfirmation"
      title="Delete Note"
      message="Are you sure you want to delete this note? This action cannot be undone."
      confirm-text="Delete"
      confirm-button-class="text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800"
      @confirm="deleteNote"
      @cancel="cancelDelete"
    />

    <!-- Plan Generation Modal -->
    <PlanGenerationModal
      :show="showPlanGenerationModal"
      :is-generating="planStore.isGeneratingPlan"
      :has-unsaved-changes="planStore.canSaveChanges"
      title="Generate New Plan"
      message="You have unsaved changes to your current plan. Generating a new plan will overwrite your current changes. Do you want to continue?"
      confirm-text="Generate New Plan"
      @confirm="confirmOverwritePlan"
      @cancel="cancelOverwritePlan"
    />
  </div>
</template>
