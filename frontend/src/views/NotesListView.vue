<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Page Header -->
      <div class="mb-8">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Travel Notes</h1>
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Manage your travel ideas and transform them into amazing trip plans
            </p>
          </div>
          <div class="flex-shrink-0">
            <CreateNoteButton variant="header" @click="createNote" />
          </div>
        </div>

        <!-- Divider -->
        <div class="border-t border-gray-200 dark:border-gray-700 mb-6"></div>

        <!-- Search Section -->
        <div class="mb-8">
          <div class="mb-4">
            <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-1">Find Your Notes</h2>
            <p class="text-sm text-gray-600 dark:text-gray-400">Search through your travel notes and ideas</p>
          </div>
          <SearchInput
            v-model="searchQuery"
            :is-loading="isSearchingCombined"
            placeholder="Search notes by title..."
            @clear="clearSearch"
          />
        </div>

        <!-- Notes List Section -->
        <div class="mb-6">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-1">Your Travel Notes</h2>
              <p class="text-sm text-gray-600 dark:text-gray-400">Browse and manage your travel ideas</p>
            </div>
            <div v-if="infiniteScroll.totalItems > 0" class="text-sm text-gray-500 dark:text-gray-400">
              {{ searchQuery ? `${infiniteScroll.totalItems} result${infiniteScroll.totalItems === 1 ? '' : 's'}` : `${infiniteScroll.totalItems} note${infiniteScroll.totalItems === 1 ? '' : 's'}` }}
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State for Initial Load or Search -->
      <div v-if="isInitialLoading" class="flex justify-center py-12">
        <LoadingSpinner size="lg" text="Loading your notes..." />
      </div>

      <!-- Loading State for Search -->
      <div v-else-if="isSearchingCombined" class="flex justify-center py-12">
        <LoadingSpinner size="lg" text="Searching notes..." />
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-12">
        <div class="text-red-600 dark:text-red-400 mb-4">
          <svg class="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.876c1.1 0 2.094-.654 2.52-1.668a2.45 2.45 0 000-2.664L13.042 4.668C12.616 3.654 11.622 3 10.522 3H9.478c-1.1 0-2.094.654-2.52 1.668L.542 17.332a2.45 2.45 0 000 2.664C.968 21.346 1.962 22 3.062 22z"
            />
          </svg>
          <p class="text-lg font-medium text-gray-900 dark:text-white">Failed to load notes</p>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">{{ error }}</p>
        </div>
        <button
          @click="retryLoad"
          class="px-4 py-2 text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 transition-colors"
        >
          Try Again
        </button>
      </div>

      <!-- Notes Content -->
      <div v-else-if="!isSearchingCombined">
        <!-- Empty State -->
        <EmptyStateMessage
          v-if="notes.length === 0 && !isLoading"
          :type="searchQuery ? 'no-search-results' : 'no-notes'"
          :search-query="searchQuery"
          @create-note="createNote"
          @clear-search="clearSearch"
        />

        <!-- Notes List -->
        <div v-else>
          <div class="space-y-6">
            <div
              v-for="note in notes"
              :key="note.id"
              class="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 cursor-pointer group"
              @click="viewNote(note.id)"
            >
              <div class="flex items-center justify-between">
                <div class="flex-1 min-w-0">
                  <!-- Title -->
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors mb-4">
                    {{ note.title }}
                  </h3>
                  <!-- Metadata Section - All grouped together -->
                  <div class="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <!-- Date first -->
                    <div class="flex items-center">
                      <svg class="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span class="font-medium">{{ formatDateRange(note.date_from, note.date_to) }}</span>
                    </div>
                    <!-- Location -->
                    <div class="flex items-center">
                      <svg class="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {{ note.place }}
                    </div>
                    <!-- People count -->
                    <div class="flex items-center">
                      <svg class="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                      {{ note.number_of_people }} {{ note.number_of_people === 1 ? 'person' : 'people' }}
                    </div>
                  </div>
                </div>
                <!-- CTA Arrow -->
                <div class="ml-6 flex-shrink-0 flex items-center justify-center">
                  <svg class="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <!-- Loading More -->
          <div v-if="isLoadingMore" class="flex justify-center py-6">
            <LoadingSpinner text="Loading more notes..." />
          </div>

          <!-- Scroll to Load More -->
          <ScrollToLoadMessage
            v-else-if="infiniteScroll.hasMore && notes.length > 0"
            :total-loaded="notes.length"
            :total-available="infiniteScroll.totalItems"
          />

          <!-- End of List -->
          <EndOfListMessage
            v-else-if="infiniteScroll.allLoaded && notes.length > 0"
            :total-loaded="notes.length"
            :total-available="infiniteScroll.totalItems"
          />
        </div>
      </div>
    </div>

    <!-- Floating Create Button for Mobile -->
    <CreateNoteButton variant="floating" class="md:hidden" @click="createNote" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useNotesStore } from '@/stores/notes'
import { useSearchDebounce } from '@/composables/useSearchDebounce'
import { useInfiniteScroll } from '@/composables/useInfiniteScroll'
import SearchInput from '@/components/ui/SearchInput.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import EmptyStateMessage from '@/components/layout/EmptyStateMessage.vue'
import EndOfListMessage from '@/components/layout/EndOfListMessage.vue'
import ScrollToLoadMessage from '@/components/layout/ScrollToLoadMessage.vue'
import CreateNoteButton from '@/components/ui/buttons/CreateNoteButton.vue'
import { storeToRefs } from 'pinia'

const router = useRouter()
const notesStore = useNotesStore()

// Store state
const { notes, isLoading, isLoadingMore, isSearching, error, infiniteScroll } =
  storeToRefs(notesStore)

// Local state
const isInitialLoading = ref(true)

// Search functionality
const { searchQuery, debouncedQuery, isSearching: isSearchDebouncing } = useSearchDebounce(500, 2)

// Combined search state (debouncing OR store searching)
const isSearchingCombined = computed(() => isSearchDebouncing.value || isSearching.value)

// Watch for search changes
watch(debouncedQuery, async (newSearch, oldSearch) => {
  if (newSearch !== oldSearch) {
    await notesStore.searchNotes(newSearch)
  }
})

// Infinite scroll functionality
const { setupScrollListener, cleanupScrollListener, resetScrollState } = useInfiniteScroll(async () => {
  // The external loading state check is already done in the composable,
  // so we only need to check if there are more items here
  if (infiniteScroll.value.hasMore) {
    try {
      await notesStore.loadMoreNotes()
    } catch (error) {
      console.error('Failed to load more notes:', error)
    }
  }
}, 500, () => isLoadingMore.value || isLoading.value) // Pass combined loading state

// Methods
const createNote = () => {
  router.push({ name: 'create-note' })
}

const viewNote = (noteId: number) => {
  router.push({ name: 'note-detail', params: { noteId: noteId } })
}

const formatDateRange = (dateFrom: string, dateTo: string): string => {
  // Parse ISO date format (YYYY-MM-DD) from backend
  const parseDate = (dateStr: string): Date => {
    return new Date(dateStr)
  }

  const formatDate = (date: Date, includeYear: boolean = true): string => {
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric'
    }
    if (includeYear) {
      options.year = 'numeric'
    }
    return date.toLocaleDateString('en-US', options)
  }

  const startDate = parseDate(dateFrom)
  const endDate = parseDate(dateTo)
  
  // If same date, show only once
  if (dateFrom === dateTo) {
    return formatDate(startDate)
  }
  
  const startYear = startDate.getFullYear()
  const endYear = endDate.getFullYear()
  
  // If same year, don't repeat the year in the start date
  if (startYear === endYear) {
    return `${formatDate(startDate, false)} - ${formatDate(endDate, true)}`
  }
  
  // Different years - show both years for clarity
  // This handles cases like "Dec 31, 2024 - Jan 2, 2025"
  return `${formatDate(startDate, true)} - ${formatDate(endDate, true)}`
}

const clearSearch = async () => {
  searchQuery.value = ''
  await notesStore.clearSearch()
}

const retryLoad = async () => {
  isInitialLoading.value = true
  try {
    await notesStore.fetchNotes()
  } finally {
    isInitialLoading.value = false
  }
}

// Lifecycle
onMounted(async () => {
  try {
    // Load initial notes
    await notesStore.fetchNotes()

    // Reset infinite scroll state after initial load and setup listener
    resetScrollState()
    setupScrollListener()
  } catch (err) {
    console.error('Failed to load notes:', err)
  } finally {
    isInitialLoading.value = false
  }
})

onUnmounted(() => {
  cleanupScrollListener()
})
</script>
