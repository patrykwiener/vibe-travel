<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

interface Props {
  show: boolean
  type?: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  duration?: number
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  duration: 5000,
  position: 'top-right',
})

const emit = defineEmits<{
  close: []
}>()

const isVisible = ref(false)
const timeoutId = ref<ReturnType<typeof setTimeout> | null>(null)

// Type-specific styles
const typeStyles = {
  success: {
    bgColor: 'bg-green-50 dark:bg-green-800',
    borderColor: 'border-green-300 dark:border-green-600',
    textColor: 'text-green-800 dark:text-green-200',
    iconColor: 'text-green-500 dark:text-green-200',
  },
  error: {
    bgColor: 'bg-red-50 dark:bg-red-800',
    borderColor: 'border-red-300 dark:border-red-600',
    textColor: 'text-red-800 dark:text-red-200',
    iconColor: 'text-red-500 dark:text-red-200',
  },
  warning: {
    bgColor: 'bg-yellow-50 dark:bg-yellow-800',
    borderColor: 'border-yellow-300 dark:border-yellow-600',
    textColor: 'text-yellow-800 dark:text-yellow-200',
    iconColor: 'text-yellow-500 dark:text-yellow-200',
  },
  info: {
    bgColor: 'bg-blue-50 dark:bg-blue-800',
    borderColor: 'border-blue-300 dark:border-blue-600',
    textColor: 'text-blue-800 dark:text-blue-200',
    iconColor: 'text-blue-500 dark:text-blue-200',
  },
}

// Position styles
const positionStyles = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
}

const handleClose = () => {
  isVisible.value = false
  if (timeoutId.value) {
    clearTimeout(timeoutId.value)
    timeoutId.value = null
  }
  emit('close')
}

// Watch for show prop changes
watch(
  () => props.show,
  (newShow) => {
    if (newShow) {
      isVisible.value = true

      // Auto-hide after duration
      if (props.duration > 0) {
        timeoutId.value = setTimeout(() => {
          handleClose()
        }, props.duration)
      }
    } else {
      isVisible.value = false
    }
  },
)

// Clean up timeout on unmount
onMounted(() => {
  return () => {
    if (timeoutId.value) {
      clearTimeout(timeoutId.value)
    }
  }
})
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0 transform translate-x-full"
    enter-to-class="opacity-100 transform translate-x-0"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="opacity-100 transform translate-x-0"
    leave-to-class="opacity-0 transform translate-x-full"
  >
    <div
      v-if="isVisible"
      :class="[
        'fixed z-50 flex items-center p-4 mb-4 border rounded-lg shadow-lg max-w-xs w-full',
        positionStyles[position],
        typeStyles[type].bgColor,
        typeStyles[type].borderColor,
        typeStyles[type].textColor,
      ]"
      role="alert"
    >
      <!-- Icon -->
      <div class="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg">
        <!-- Success Icon -->
        <svg
          v-if="type === 'success'"
          :class="typeStyles[type].iconColor"
          class="w-5 h-5"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z"
          />
        </svg>

        <!-- Error Icon -->
        <svg
          v-else-if="type === 'error'"
          :class="typeStyles[type].iconColor"
          class="w-5 h-5"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 11.793a1 1 0 1 1-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 0 1-1.414-1.414L8.586 10 6.293 7.707a1 1 0 0 1 1.414-1.414L10 8.586l2.293-2.293a1 1 0 0 1 1.414 1.414L11.414 10l2.293 2.293Z"
          />
        </svg>

        <!-- Warning Icon -->
        <svg
          v-else-if="type === 'warning'"
          :class="typeStyles[type].iconColor"
          class="w-5 h-5"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM10 15a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm1-4a1 1 0 0 1-2 0V6a1 1 0 0 1 2 0v5Z"
          />
        </svg>

        <!-- Info Icon -->
        <svg
          v-else
          :class="typeStyles[type].iconColor"
          class="w-5 h-5"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z"
          />
        </svg>
      </div>

      <!-- Content -->
      <div class="ml-3 text-sm font-normal">
        <span v-if="title" class="mb-1 text-sm font-semibold">{{ title }}</span>
        <div class="text-sm font-normal">{{ message }}</div>
      </div>

      <!-- Close Button -->
      <button
        @click="handleClose"
        type="button"
        :class="[
          'ml-auto -mx-1.5 -my-1.5 rounded-lg focus:ring-2 p-1.5 inline-flex items-center justify-center h-8 w-8',
          typeStyles[type].textColor,
          'hover:bg-white hover:bg-opacity-20 focus:ring-gray-300 dark:hover:bg-gray-700',
        ]"
        aria-label="Close"
      >
        <span class="sr-only">Close</span>
        <svg
          class="w-3 h-3"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 14 14"
        >
          <path
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
          />
        </svg>
      </button>
    </div>
  </Transition>
</template>
