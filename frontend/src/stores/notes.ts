import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from './auth'
import {
  notesNoteCbvListNotes,
  notesNoteCbvCreateNote,
  notesNoteCbvGetNoteById,
  notesNoteCbvUpdateNote,
  notesNoteCbvDeleteNote,
} from '@/client/sdk.gen'
import { apiCall } from '@/utils/api-interceptor'
import type {
  NoteListItemOutSchema,
  LimitOffsetPageNoteListItemOutSchema,
  NoteCreateInSchema,
  NoteUpdateInSchema,
  NoteOutSchema,
} from '@/client/types.gen'
import { ApiError } from '@/utils/api-errors'

interface InfiniteScrollInfo {
  currentOffset: number
  itemsPerPage: number
  totalItems: number
  hasMore: boolean
  allLoaded: boolean
}

interface NotesApiParams {
  offset?: number
  limit?: number
  search_title?: string
}

export const useNotesStore = defineStore('notes', () => {
  const authStore = useAuthStore()

  // State
  const notes = ref<NoteListItemOutSchema[]>([])
  const isLoading = ref(false)
  const isLoadingMore = ref(false)
  const isSearching = ref(false)
  const error = ref<string | null>(null)
  const searchQuery = ref('')

  // Request cancellation tracking
  let currentSearchController: AbortController | null = null
  let searchRequestId = 0

  const infiniteScroll = ref<InfiniteScrollInfo>({
    currentOffset: 0,
    itemsPerPage: 5, // Load only ~3-4 notes visible on screen + 1
    totalItems: 0,
    hasMore: true,
    allLoaded: false,
  })

  // Computed
  const userNotes = computed(() => {
    return notes.value
  })

  // Helper to reset infinite scroll state
  const resetInfiniteScroll = () => {
    infiniteScroll.value = {
      currentOffset: 0,
      itemsPerPage: 5, // Load only ~3-4 notes visible on screen + 1
      totalItems: 0,
      hasMore: true,
      allLoaded: false,
    }
  }

  // Fetch notes with pagination and search
  const fetchNotes = async (params: NotesApiParams = {}) => {
    if (!authStore.isAuthenticated) return

    const isInitialLoad = params.offset === undefined || params.offset === 0

    if (isInitialLoad) {
      isLoading.value = true
      if (!params.search_title) {
        resetInfiniteScroll()
      }
    } else {
      isLoadingMore.value = true
    }

    error.value = null

    try {
      const response = await apiCall(() =>
        notesNoteCbvListNotes({
          query: {
            offset: params.offset || 0,
            limit: params.limit || infiniteScroll.value.itemsPerPage,
            search_title: params.search_title || undefined,
          },
        }),
      )

      const data = response as LimitOffsetPageNoteListItemOutSchema

      // Update infinite scroll info
      infiniteScroll.value.totalItems = data.total || 0
      infiniteScroll.value.currentOffset = (params.offset || 0) + (data.items?.length || 0)
      infiniteScroll.value.hasMore =
        infiniteScroll.value.currentOffset < infiniteScroll.value.totalItems
      infiniteScroll.value.allLoaded = !infiniteScroll.value.hasMore

      if (isInitialLoad) {
        // Replace notes for initial load or search
        notes.value = data.items || []
      } else {
        // Append notes for infinite scroll
        notes.value = [...notes.value, ...(data.items || [])]
      }
    } catch (e) {
      console.error('Failed to fetch notes:', e)
      if (e instanceof ApiError) {
        error.value = e.userMessage
      } else {
        error.value = 'Failed to load notes. Please try again.'
      }
    } finally {
      isLoading.value = false
      isLoadingMore.value = false
      isSearching.value = false
    }
  }

  // Load more notes for infinite scroll
  const loadMoreNotes = async () => {
    console.log('loadMoreNotes called', {
      hasMore: infiniteScroll.value.hasMore,
      isLoadingMore: isLoadingMore.value,
      isLoading: isLoading.value,
      currentOffset: infiniteScroll.value.currentOffset,
      totalItems: infiniteScroll.value.totalItems,
    })

    // Enhanced guard conditions to prevent race conditions
    if (
      !infiniteScroll.value.hasMore ||
      isLoadingMore.value ||
      isLoading.value ||
      isSearching.value
    ) {
      console.log('Early return from loadMoreNotes', {
        hasMore: infiniteScroll.value.hasMore,
        isLoadingMore: isLoadingMore.value,
        isLoading: isLoading.value,
        isSearching: isSearching.value,
      })
      return
    }

    console.log('Fetching more notes...')
    await fetchNotes({
      offset: infiniteScroll.value.currentOffset,
      limit: infiniteScroll.value.itemsPerPage,
      search_title: searchQuery.value || undefined,
    })
  }

  // Search notes with debouncing handled by component
  const searchNotes = async (query: string) => {
    // Cancel any existing search request
    if (currentSearchController) {
      currentSearchController.abort()
    }

    // Create new AbortController for this search
    currentSearchController = new AbortController()
    const requestId = ++searchRequestId

    isSearching.value = true
    searchQuery.value = query
    resetInfiniteScroll()

    try {
      await fetchNotes({
        offset: 0,
        limit: infiniteScroll.value.itemsPerPage,
        search_title: query || undefined,
      })

      // Only clear the controller if this is still the latest request
      if (requestId === searchRequestId) {
        currentSearchController = null
      }
    } catch (error) {
      // Only handle the error if this is still the latest request and not aborted
      if (requestId === searchRequestId && currentSearchController) {
        currentSearchController = null
        throw error
      }
    } finally {
      // Only update loading state if this is still the latest request
      if (requestId === searchRequestId) {
        isSearching.value = false
      }
    }
  }

  // Set search query without triggering search
  const setSearchQuery = (query: string) => {
    searchQuery.value = query
  }

  // Clear search and reload all notes
  const clearSearch = async () => {
    // Cancel any existing search request
    if (currentSearchController) {
      currentSearchController.abort()
      currentSearchController = null
    }

    searchQuery.value = ''
    resetInfiniteScroll()
    await fetchNotes()
  }

  const createNote = async (noteData: NoteCreateInSchema): Promise<NoteOutSchema> => {
    if (!authStore.isAuthenticated) {
      throw new Error('User must be authenticated to create a note')
    }

    try {
      const response = await apiCall(() =>
        notesNoteCbvCreateNote({
          body: noteData,
        }),
      )

      const createdNote = response as NoteOutSchema
      return createdNote
    } catch (e) {
      console.error('Failed to create note:', e)
      throw e
    }
  }

  const getNoteById = async (noteId: string): Promise<NoteOutSchema | null> => {
    if (!authStore.isAuthenticated) {
      throw new Error('User must be authenticated to view a note')
    }

    try {
      const response = await apiCall(() =>
        notesNoteCbvGetNoteById({
          path: {
            note_id: parseInt(noteId),
          },
        }),
      )

      const note = response as NoteOutSchema
      return note
    } catch (e) {
      console.error('Failed to fetch note:', e)
      throw e
    }
  }

  const deleteNote = async (noteId: string): Promise<void> => {
    if (!authStore.isAuthenticated) {
      throw new Error('User must be authenticated to delete a note')
    }

    try {
      await apiCall(() =>
        notesNoteCbvDeleteNote({
          path: {
            note_id: parseInt(noteId),
          },
        }),
      )
    } catch (e) {
      console.error('Failed to delete note:', e)
      throw e
    }
  }

  const updateNote = async (
    noteId: string,
    noteData: NoteUpdateInSchema,
  ): Promise<NoteOutSchema> => {
    if (!authStore.isAuthenticated) {
      throw new Error('User must be authenticated to update a note')
    }

    try {
      const response = await apiCall(() =>
        notesNoteCbvUpdateNote({
          path: {
            note_id: parseInt(noteId),
          },
          body: noteData,
        }),
      )

      const updatedNote = response as NoteOutSchema
      return updatedNote
    } catch (e) {
      console.error('Failed to update note:', e)
      throw e
    }
  }

  // Reset store state
  const resetState = () => {
    // Cancel any pending search requests
    if (currentSearchController) {
      currentSearchController.abort()
      currentSearchController = null
    }

    notes.value = []
    isLoading.value = false
    isLoadingMore.value = false
    isSearching.value = false
    error.value = null
    searchQuery.value = ''
    searchRequestId = 0
    resetInfiniteScroll()
  }

  return {
    // State
    notes,
    isLoading,
    isLoadingMore,
    isSearching,
    error,
    searchQuery,
    infiniteScroll: computed(() => infiniteScroll.value),

    // Computed
    userNotes,

    // Actions
    fetchNotes,
    loadMoreNotes,
    searchNotes,
    setSearchQuery,
    clearSearch,
    createNote,
    getNoteById,
    updateNote,
    deleteNote,
    resetState,
  }
})
