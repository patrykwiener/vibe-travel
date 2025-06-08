<script setup lang="ts">
import type { NoteOutSchema } from '@/client/types.gen'

export interface NoteDisplaySectionProps {
  note: NoteOutSchema
  noteId: string
}

export interface NoteDisplaySectionEmits {
  delete: []
}

defineProps<NoteDisplaySectionProps>()
defineEmits<NoteDisplaySectionEmits>()

// Format date range
const formatDateRange = (startDate: string, endDate: string) => {
  const start = new Date(startDate)
  const end = new Date(endDate)

  const formatOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }

  if (start.getTime() === end.getTime()) {
    return start.toLocaleDateString('en-US', formatOptions)
  }

  return `${start.toLocaleDateString('en-US', formatOptions)} - ${end.toLocaleDateString('en-US', formatOptions)}`
}

// Calculate trip duration
const calculateDuration = (startDate: string, endDate: string) => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays === 1 ? '1 day' : `${diffDays} days`
}
</script>

<template>
  <div>
    <!-- Header Section -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Trip Details</h2>
      </div>

      <!-- Action Buttons -->
      <div class="mt-4 md:mt-0 flex flex-row gap-3">
        <router-link
          :to="`/notes/${noteId}/edit`"
          class="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 rounded-lg dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 transition-colors"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          Edit Note
        </router-link>

        <button
          @click="$emit('delete')"
          class="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 focus:ring-4 focus:ring-red-300 rounded-lg dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800 dark:focus:ring-red-800 transition-colors"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Delete Note
        </button>
      </div>
    </div>

    <!-- Trip Information Cards - Full Width -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4 mb-8">
      <div
        class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
      >
        <div class="flex items-center justify-between mb-2">
          <svg
            class="w-5 h-5 text-primary-600 dark:text-primary-400"
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
        </div>
        <p
          class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1"
        >
          Destination
        </p>
        <p class="text-lg font-semibold text-gray-900 dark:text-white truncate">{{ note.place }}</p>
      </div>

      <div
        class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
      >
        <div class="flex items-center justify-between mb-2">
          <svg
            class="w-5 h-5 text-primary-600 dark:text-primary-400"
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
        </div>
        <p
          class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1"
        >
          Dates
        </p>
        <p class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ formatDateRange(note.date_from, note.date_to) }}
        </p>
      </div>

      <div
        class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
      >
        <div class="flex items-center justify-between mb-2">
          <svg
            class="w-5 h-5 text-primary-600 dark:text-primary-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p
          class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1"
        >
          Duration
        </p>
        <p class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ calculateDuration(note.date_from, note.date_to) }}
        </p>
      </div>

      <div
        class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
      >
        <div class="flex items-center justify-between mb-2">
          <svg
            class="w-5 h-5 text-primary-600 dark:text-primary-400"
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
        </div>
        <p
          class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1"
        >
          Travelers
        </p>
        <p class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ note.number_of_people }}
        </p>
      </div>
    </div>

    <!-- Key Ideas Section -->
    <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
      <div class="flex items-center space-x-2 mb-4">
        <svg
          class="w-5 h-5 text-primary-600 dark:text-primary-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
        <h3 class="text-lg font-bold text-gray-900 dark:text-white">Key Ideas</h3>
      </div>
      <div
        v-if="note.key_ideas && note.key_ideas.trim()"
        class="prose prose-gray dark:prose-invert max-w-none"
      >
        <p class="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
          {{ note.key_ideas }}
        </p>
      </div>
      <div v-else class="text-center py-8">
        <svg
          class="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
        <p class="text-gray-500 dark:text-gray-400 italic">No key ideas provided for this trip.</p>
        <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Add some ideas by editing this note
        </p>
      </div>
    </div>
  </div>
</template>
