<script setup lang="ts">
import LoadingSpinner from './LoadingSpinner.vue'

export interface PlanGenerationModalProps {
  show: boolean
  isGenerating: boolean
  hasUnsavedChanges: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
}

export interface PlanGenerationModalEmits {
  confirm: []
  cancel: []
}

withDefaults(defineProps<PlanGenerationModalProps>(), {
  confirmText: 'Generate Plan',
  cancelText: 'Cancel',
})

defineEmits<PlanGenerationModalEmits>()
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/50"
    @click.self="$emit('cancel')"
  >
    <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4 dark:bg-gray-800">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">{{ title }}</h3>

      <!-- Show spinner when generating -->
      <div v-if="isGenerating" class="text-center py-6">
        <LoadingSpinner size="md" text="Generating your travel plan..." />
      </div>

      <!-- Show confirmation when there are unsaved changes and not generating -->
      <div v-else-if="hasUnsavedChanges">
        <p class="text-gray-700 dark:text-gray-400 mb-6">{{ message }}</p>
        <div class="flex justify-end space-x-4">
          <button
            @click="$emit('cancel')"
            type="button"
            class="text-gray-900 bg-white hover:bg-gray-100 border border-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:focus:ring-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700"
          >
            {{ cancelText }}
          </button>
          <button
            @click="$emit('confirm')"
            type="button"
            class="text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
          >
            {{ confirmText }}
          </button>
        </div>
      </div>

      <!-- Show just the generation process when no unsaved changes -->
      <div v-else>
        <LoadingSpinner size="md" text="Generating your travel plan..." />
      </div>
    </div>
  </div>
</template>
