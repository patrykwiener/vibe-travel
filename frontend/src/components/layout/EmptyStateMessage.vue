<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  type: 'no-notes' | 'no-search-results'
  searchQuery?: string
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'create-note': []
  'clear-search': []
}>()

// Content based on type
const content = computed(() => {
  if (props.type === 'no-search-results') {
    return {
      title: 'No notes found',
      message: props.searchQuery
        ? `No notes match "${props.searchQuery}". Try adjusting your search terms.`
        : 'No notes match your search criteria.',
      actionText: 'Clear search',
      showAction: true,
    }
  }

  return {
    title: 'No travel notes yet',
    message: 'Create your first travel note to start planning amazing trips with AI assistance.',
    actionText: 'Create your first note',
    showAction: true,
  }
})

// Handle action click
const handleAction = () => {
  if (props.type === 'no-search-results') {
    // For search results, emit clear search event
    emit('clear-search')
  } else {
    // For no notes, emit create note event
    emit('create-note')
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center p-8 text-center">
    <!-- Icon -->
    <div class="w-16 h-16 mb-4 text-gray-400 dark:text-gray-600">
      <!-- No Notes Icon -->
      <svg
        v-if="type === 'no-notes'"
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
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>

      <!-- No Search Results Icon -->
      <svg
        v-else
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
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    </div>

    <!-- Title -->
    <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
      {{ content.title }}
    </h3>

    <!-- Message -->
    <p class="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
      {{ content.message }}
    </p>

    <!-- Action Button -->
    <button
      v-if="content.showAction"
      @click="handleAction"
      type="button"
      class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 transition-colors"
    >
      <!-- Plus Icon for Create Note -->
      <svg
        v-if="type === 'no-notes'"
        class="w-4 h-4 mr-2"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>

      <!-- Clear Icon for Search -->
      <svg v-else class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>

      {{ content.actionText }}
    </button>
  </div>
</template>
