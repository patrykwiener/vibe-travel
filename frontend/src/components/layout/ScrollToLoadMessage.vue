<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  totalLoaded: number
  totalAvailable: number
}

const props = defineProps<Props>()

// Show component only if there are more items to load
const shouldShow = computed(() => {
  return props.totalLoaded > 0 && props.totalLoaded < props.totalAvailable
})

const remainingCount = computed(() => {
  return props.totalAvailable - props.totalLoaded
})
</script>

<template>
  <div v-if="shouldShow" class="flex flex-col items-center justify-center p-6 text-center">
    <!-- Icon with subtle animation -->
    <div class="w-8 h-8 mb-3 text-primary-500 dark:text-primary-400 animate-bounce">
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
          d="M19 14l-7 7m0 0l-7-7m7 7V3"
        />
      </svg>
    </div>

    <!-- Message -->
    <p class="text-sm text-gray-600 dark:text-gray-300 mb-1">Scroll down to load more notes</p>
    <p class="text-xs text-gray-500 dark:text-gray-400">
      {{ remainingCount }} more {{ remainingCount === 1 ? 'note' : 'notes' }} available ({{
        totalLoaded
      }}
      of {{ totalAvailable }} loaded)
    </p>
  </div>
</template>
