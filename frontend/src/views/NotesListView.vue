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

        <!-- Search Bar -->
        <SearchInput
          v-model="searchQuery"
          :is-loading="isSearchingCombined"
          placeholder="Search notes by title..."
          @clear="clearSearch"
        />
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

        <!-- Notes Grid -->
        <div v-else>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            <NoteCard v-for="note in notes" :key="note.id" :note="note" />
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
import NoteCard from '@/components/notes/NoteCard.vue'
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
const { setupScrollListener, cleanupScrollListener } = useInfiniteScroll(async () => {
  console.log('Infinite scroll callback triggered!', {
    isLoadingMore: isLoadingMore.value,
    hasMore: infiniteScroll.value.hasMore,
    currentOffset: infiniteScroll.value.currentOffset,
    totalItems: infiniteScroll.value.totalItems,
  })

  // Only load more if we're not already loading and there are more items
  if (!isLoadingMore.value && infiniteScroll.value.hasMore) {
    console.log('Triggering load more notes...')
    await notesStore.loadMoreNotes()
  }
}, 300) // Increased threshold to trigger earlier

// Methods
const createNote = () => {
  router.push({ name: 'create-note' })
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

    // Setup infinite scroll
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
