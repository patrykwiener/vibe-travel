<template>
  <div
    class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md dark:hover:shadow-lg transition-shadow duration-200 cursor-pointer"
    @click="navigateToDetail"
  >
    <div class="p-4">
      <!-- Title -->
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
        {{ note.title }}
      </h3>

      <!-- Trip Details -->
      <div class="text-gray-600 dark:text-gray-400 text-sm mb-3 space-y-1">
        <div class="flex items-center">
          <svg
            class="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          {{ note.place }}
        </div>
        <div class="flex items-center">
          <svg
            class="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          {{ formatDateRange(note.date_from, note.date_to) }}
        </div>
        <div class="flex items-center">
          <svg
            class="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
            />
          </svg>
          {{ note.number_of_people }} {{ note.number_of_people === 1 ? 'person' : 'people' }}
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span class="text-primary-600 dark:text-primary-400 font-medium">View details</span>
        <svg
          class="w-4 h-4 text-gray-400 dark:text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type NoteListItemOutSchema } from '@/client'
import { useRouter } from 'vue-router'

interface Props {
  note: NoteListItemOutSchema
}

const props = defineProps<Props>()

const router = useRouter()

const navigateToDetail = () => {
  router.push({ name: 'note-detail', params: { noteId: props.note.id.toString() } })
}

const formatDateRange = (dateFrom: string, dateTo: string): string => {
  const startDate = new Date(dateFrom)
  const endDate = new Date(dateTo)

  const startStr = startDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  const endStr = endDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  // If same month, show "Jun 10-12, 2025"
  if (
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getFullYear() === endDate.getFullYear()
  ) {
    return `${startDate.toLocaleDateString('en-US', { month: 'short' })} ${startDate.getDate()}-${endDate.getDate()}, ${endDate.getFullYear()}`
  }

  return `${startStr} - ${endStr}`
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
