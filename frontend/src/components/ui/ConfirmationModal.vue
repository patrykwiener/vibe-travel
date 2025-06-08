<script setup lang="ts">
export interface ConfirmationModalProps {
  show: boolean
  title: string
  message: string
  confirmText?: string
  confirmButtonClass?: string
  cancelText?: string
}

export interface ConfirmationModalEmits {
  confirm: []
  cancel: []
}

withDefaults(defineProps<ConfirmationModalProps>(), {
  confirmText: 'Confirm',
  confirmButtonClass:
    'text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800',
  cancelText: 'Cancel',
})

defineEmits<ConfirmationModalEmits>()
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/50"
    @click.self="$emit('cancel')"
  >
    <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4 dark:bg-gray-800">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">{{ title }}</h3>
      <p class="text-gray-700 dark:text-gray-400 mb-6">{{ message }}</p>
      <div class="flex justify-end space-x-4">
        <button
          @click="$emit('cancel')"
          type="button"
          class="text-gray-900 bg-white hover:bg-gray-100 border border-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:focus:ring-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700"
        >
          {{ cancelText }}
        </button>
        <button @click="$emit('confirm')" type="button" :class="confirmButtonClass">
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>
