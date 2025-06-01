<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  totalLoaded: number
  totalAvailable: number
}

const props = defineProps<Props>()

// Show component only if all items are loaded and there are items
const shouldShow = computed(() => {
  return props.totalLoaded > 0 && props.totalLoaded >= props.totalAvailable
})
</script>

<template>
  <div v-if="shouldShow" class="flex flex-col items-center justify-center p-6 text-center">
    <!-- Icon -->
    <div class="w-8 h-8 mb-3 text-gray-400 dark:text-gray-600">
      <svg
        class="w-full h-full"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </div>

    <!-- Message -->
    <p class="text-sm text-gray-500 dark:text-gray-400">
      All notes loaded ({{ totalLoaded }} of {{ totalAvailable }})
    </p>
  </div>
</template>
