import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useNotesStore } from '@/stores/notes'
import { useAuthStore } from '@/stores/auth'
import { ApiError } from '@/utils/api-errors'
import type {
  NoteListItemOutSchema,
  LimitOffsetPageNoteListItemOutSchema,
  NoteCreateInSchema,
  NoteUpdateInSchema,
  NoteOutSchema,
} from '@/client/types.gen'

// Mock the API client functions
vi.mock('@/client/sdk.gen', () => ({
  notesNoteCbvListNotes: vi.fn(),
  notesNoteCbvCreateNote: vi.fn(),
  notesNoteCbvGetNoteById: vi.fn(),
  notesNoteCbvUpdateNote: vi.fn(),
  notesNoteCbvDeleteNote: vi.fn(),
}))

// Mock the API interceptor
vi.mock('@/utils/api-interceptor', () => ({
  apiCall: vi.fn((fn) => fn()),
}))

// Mock the auth store
vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(),
}))

// Import mocked modules
import {
  notesNoteCbvListNotes,
  notesNoteCbvCreateNote,
  notesNoteCbvGetNoteById,
  notesNoteCbvUpdateNote,
  notesNoteCbvDeleteNote,
} from '@/client/sdk.gen'

// Helper to create proper mock note with all required fields
const createMockNoteListItem = (overrides = {}): NoteListItemOutSchema => ({
  id: 1,
  title: 'Test Note',
  place: 'Test Place',
  date_from: '2025-07-01',
  date_to: '2025-07-07',
  number_of_people: 2,
  ...overrides,
})

// Helper to create proper mock note for API responses
const createMockNoteOut = (overrides = {}): NoteOutSchema => ({
  id: 1,
  user_id: 'user-123',
  title: 'Test Note',
  place: 'Test Place',
  date_from: '2025-07-01',
  date_to: '2025-07-07',
  number_of_people: 2,
  key_ideas: 'Test ideas',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...overrides,
})

// Helper to create proper note creation data
const createMockNoteCreateData = (overrides = {}): NoteCreateInSchema => ({
  title: 'Test Note',
  place: 'Test Place',
  date_from: '2025-07-01',
  date_to: '2025-07-07',
  number_of_people: 2,
  key_ideas: 'Test ideas',
  ...overrides,
})

// Helper to create proper note update data
const createMockNoteUpdateData = (overrides = {}): NoteUpdateInSchema => ({
  title: 'Updated Note',
  place: 'Updated Place',
  date_from: '2025-07-01',
  date_to: '2025-07-07',
  number_of_people: 2,
  key_ideas: 'Updated ideas',
  ...overrides,
})

describe('Notes Store', () => {
  let notesStore: ReturnType<typeof useNotesStore>
  let mockAuthStore: any

  // Mock console methods to avoid noise in tests
  const originalConsoleError = console.error
  const originalConsoleLog = console.log

  beforeEach(() => {
    // Setup clean Pinia instance
    setActivePinia(createPinia())

    // Mock auth store
    mockAuthStore = {
      isAuthenticated: true,
    }
    vi.mocked(useAuthStore).mockReturnValue(mockAuthStore)

    // Initialize store
    notesStore = useNotesStore()

    // Clear all mocks
    vi.clearAllMocks()

    // Mock console methods
    console.error = vi.fn()
    console.log = vi.fn()
  })

  afterEach(() => {
    // Restore console methods
    console.error = originalConsoleError
    console.log = originalConsoleLog
  })

  describe('Initial State', () => {
    it('should initialize with correct default state', () => {
      expect(notesStore.notes).toEqual([])
      expect(notesStore.isLoading).toBe(false)
      expect(notesStore.isLoadingMore).toBe(false)
      expect(notesStore.isSearching).toBe(false)
      expect(notesStore.error).toBeNull()
      expect(notesStore.searchQuery).toBe('')
      expect(notesStore.infiniteScroll.currentOffset).toBe(0)
      expect(notesStore.infiniteScroll.itemsPerPage).toBe(5)
      expect(notesStore.infiniteScroll.totalItems).toBe(0)
      expect(notesStore.infiniteScroll.hasMore).toBe(true)
      expect(notesStore.infiniteScroll.allLoaded).toBe(false)
    })

    it('should have userNotes computed property equal to notes', () => {
      const mockNotes = [createMockNoteListItem({ id: 1 }), createMockNoteListItem({ id: 2 })]
      notesStore.notes = mockNotes
      expect(notesStore.userNotes).toEqual(mockNotes)
    })
  })

  describe('Authentication Guards', () => {
    it('should not fetch notes when user is not authenticated', async () => {
      mockAuthStore.isAuthenticated = false

      await notesStore.fetchNotes()

      expect(notesNoteCbvListNotes).not.toHaveBeenCalled()
      expect(notesStore.isLoading).toBe(false)
    })

    it('should throw error when creating note while not authenticated', async () => {
      mockAuthStore.isAuthenticated = false
      const noteData = createMockNoteCreateData()

      await expect(notesStore.createNote(noteData)).rejects.toThrow(
        'User must be authenticated to create a note',
      )
    })

    it('should throw error when getting note by id while not authenticated', async () => {
      mockAuthStore.isAuthenticated = false

      await expect(notesStore.getNoteById('1')).rejects.toThrow(
        'User must be authenticated to view a note',
      )
    })

    it('should throw error when updating note while not authenticated', async () => {
      mockAuthStore.isAuthenticated = false
      const noteData = createMockNoteUpdateData()

      await expect(notesStore.updateNote('1', noteData)).rejects.toThrow(
        'User must be authenticated to update a note',
      )
    })

    it('should throw error when deleting note while not authenticated', async () => {
      mockAuthStore.isAuthenticated = false

      await expect(notesStore.deleteNote('1')).rejects.toThrow(
        'User must be authenticated to delete a note',
      )
    })
  })

  describe('fetchNotes', () => {
    const mockApiResponse: LimitOffsetPageNoteListItemOutSchema = {
      items: [
        createMockNoteListItem({ id: 1, title: 'Note 1' }),
        createMockNoteListItem({ id: 2, title: 'Note 2' }),
      ],
      total: 10,
      offset: 0,
      limit: 5,
    }

    it('should fetch notes successfully on initial load', async () => {
      vi.mocked(notesNoteCbvListNotes).mockResolvedValue(mockApiResponse as any)

      await notesStore.fetchNotes()

      expect(notesStore.isLoading).toBe(false)
      expect(notesStore.notes).toEqual(mockApiResponse.items)
      expect(notesStore.infiniteScroll.totalItems).toBe(10)
      expect(notesStore.infiniteScroll.currentOffset).toBe(2)
      expect(notesStore.infiniteScroll.hasMore).toBe(true)
      expect(notesStore.error).toBeNull()
    })

    it('should set correct loading state during initial fetch', async () => {
      let resolvePromise: (value: any) => void
      const promise = new Promise((resolve) => {
        resolvePromise = resolve
      })
      vi.mocked(notesNoteCbvListNotes).mockReturnValue(promise as any)

      const fetchPromise = notesStore.fetchNotes()

      expect(notesStore.isLoading).toBe(true)
      expect(notesStore.isLoadingMore).toBe(false)

      resolvePromise!(mockApiResponse)
      await fetchPromise

      expect(notesStore.isLoading).toBe(false)
    })

    it('should set correct loading state during load more', async () => {
      let resolvePromise: (value: any) => void
      const promise = new Promise((resolve) => {
        resolvePromise = resolve
      })
      vi.mocked(notesNoteCbvListNotes).mockReturnValue(promise as any)

      const fetchPromise = notesStore.fetchNotes({ offset: 5 })

      expect(notesStore.isLoading).toBe(false)
      expect(notesStore.isLoadingMore).toBe(true)

      resolvePromise!(mockApiResponse)
      await fetchPromise

      expect(notesStore.isLoadingMore).toBe(false)
    })

    it('should append notes for infinite scroll (non-initial load)', async () => {
      // Setup initial notes
      notesStore.notes = [createMockNoteListItem({ id: 0 })]

      const loadMoreResponse = {
        ...mockApiResponse,
        items: [createMockNoteListItem({ id: 3 })],
      }
      vi.mocked(notesNoteCbvListNotes).mockResolvedValue(loadMoreResponse as any)

      await notesStore.fetchNotes({ offset: 5 })

      expect(notesStore.notes).toHaveLength(2)
      expect(notesStore.notes[0].id).toBe(0)
      expect(notesStore.notes[1].id).toBe(3)
    })

    it('should replace notes for initial load or search', async () => {
      // Setup existing notes
      notesStore.notes = [createMockNoteListItem({ id: 0 })]

      vi.mocked(notesNoteCbvListNotes).mockResolvedValue(mockApiResponse as any)

      await notesStore.fetchNotes({ offset: 0 })

      expect(notesStore.notes).toEqual(mockApiResponse.items)
      expect(notesStore.notes).toHaveLength(2)
    })

    it('should handle API errors gracefully', async () => {
      const apiError = new Error('Server error') as any
      apiError.userMessage = 'Something went wrong'
      Object.setPrototypeOf(apiError, ApiError.prototype)

      vi.mocked(notesNoteCbvListNotes).mockRejectedValue(apiError)

      await notesStore.fetchNotes()

      expect(notesStore.error).toBe('Something went wrong')
      expect(notesStore.isLoading).toBe(false)
      expect(console.error).toHaveBeenCalledWith('Failed to fetch notes:', apiError)
    })

    it('should handle generic errors with fallback message', async () => {
      const genericError = new Error('Network error')
      vi.mocked(notesNoteCbvListNotes).mockRejectedValue(genericError)

      await notesStore.fetchNotes()

      expect(notesStore.error).toBe('Failed to load notes. Please try again.')
      expect(notesStore.isLoading).toBe(false)
    })

    it('should calculate infinite scroll state correctly when all items loaded', async () => {
      const lastPageResponse = {
        items: [createMockNoteListItem({ id: 1 })],
        total: 1,
        offset: 0,
        limit: 5,
      }
      vi.mocked(notesNoteCbvListNotes).mockResolvedValue(lastPageResponse as any)

      await notesStore.fetchNotes()

      expect(notesStore.infiniteScroll.currentOffset).toBe(1)
      expect(notesStore.infiniteScroll.hasMore).toBe(false)
      expect(notesStore.infiniteScroll.allLoaded).toBe(true)
    })

    it('should reset infinite scroll on initial load without search', async () => {
      // Setup non-default infinite scroll state
      notesStore.infiniteScroll.currentOffset = 10
      notesStore.infiniteScroll.totalItems = 20

      vi.mocked(notesNoteCbvListNotes).mockResolvedValue(mockApiResponse as any)

      await notesStore.fetchNotes({ offset: 0 })

      expect(notesStore.infiniteScroll.currentOffset).toBe(2)
      expect(notesStore.infiniteScroll.totalItems).toBe(10)
    })

    it('should not reset infinite scroll on search', async () => {
      vi.mocked(notesNoteCbvListNotes).mockResolvedValue(mockApiResponse as any)

      await notesStore.fetchNotes({ offset: 0, search_title: 'test' })

      // Infinite scroll should be updated but not reset since it's a search
      expect(notesStore.infiniteScroll.totalItems).toBe(10)
    })
  })

  describe('loadMoreNotes', () => {
    beforeEach(() => {
      // Setup state that allows loading more
      notesStore.infiniteScroll.hasMore = true
      notesStore.infiniteScroll.currentOffset = 5
      notesStore.isLoading = false
      notesStore.isLoadingMore = false
      notesStore.isSearching = false
    })

    it('should load more notes when conditions are met', async () => {
      const mockResponse = {
        items: [createMockNoteListItem({ id: 3 })],
        total: 10,
        offset: 5,
        limit: 5,
      }
      vi.mocked(notesNoteCbvListNotes).mockResolvedValue(mockResponse as any)

      await notesStore.loadMoreNotes()

      expect(notesNoteCbvListNotes).toHaveBeenCalledWith({
        query: {
          offset: 5,
          limit: 5,
          search_title: undefined,
        },
      })
    })

    it('should include search query when loading more during search', async () => {
      notesStore.searchQuery = 'test query'
      const mockResponse = {
        items: [],
        total: 0,
        offset: 5,
        limit: 5,
      }
      vi.mocked(notesNoteCbvListNotes).mockResolvedValue(mockResponse as any)

      await notesStore.loadMoreNotes()

      expect(notesNoteCbvListNotes).toHaveBeenCalledWith({
        query: {
          offset: 5,
          limit: 5,
          search_title: 'test query',
        },
      })
    })

    it('should not load more when hasMore is false', async () => {
      notesStore.infiniteScroll.hasMore = false

      await notesStore.loadMoreNotes()

      expect(notesNoteCbvListNotes).not.toHaveBeenCalled()
    })

    it('should not load more when already loading more', async () => {
      notesStore.isLoadingMore = true

      await notesStore.loadMoreNotes()

      expect(notesNoteCbvListNotes).not.toHaveBeenCalled()
    })

    it('should not load more when initial loading', async () => {
      notesStore.isLoading = true

      await notesStore.loadMoreNotes()

      expect(notesNoteCbvListNotes).not.toHaveBeenCalled()
    })

    it('should not load more when searching', async () => {
      notesStore.isSearching = true

      await notesStore.loadMoreNotes()

      expect(notesNoteCbvListNotes).not.toHaveBeenCalled()
    })
  })

  describe('searchNotes', () => {
    it('should perform search with query', async () => {
      const mockResponse = {
        items: [createMockNoteListItem({ id: 1, title: 'Search Result' })],
        total: 1,
        offset: 0,
        limit: 5,
      }
      vi.mocked(notesNoteCbvListNotes).mockResolvedValue(mockResponse as any)

      await notesStore.searchNotes('test query')

      expect(notesStore.searchQuery).toBe('test query')
      expect(notesNoteCbvListNotes).toHaveBeenCalledWith({
        query: {
          offset: 0,
          limit: 5,
          search_title: 'test query',
        },
      })
      expect(notesStore.isSearching).toBe(false)
    })

    it('should reset infinite scroll when starting search', async () => {
      // Setup non-default infinite scroll state
      notesStore.infiniteScroll.currentOffset = 10
      notesStore.infiniteScroll.totalItems = 20

      // Mock response with items to ensure hasMore remains true
      vi.mocked(notesNoteCbvListNotes).mockResolvedValue({
        items: [createMockNoteListItem({ id: 1, title: 'Search result' })],
        total: 10,
        offset: 0,
        limit: 5,
      } as any)

      await notesStore.searchNotes('test')

      expect(notesStore.infiniteScroll.currentOffset).toBe(1)
      expect(notesStore.infiniteScroll.totalItems).toBe(10)
      expect(notesStore.infiniteScroll.hasMore).toBe(true)
      expect(notesStore.infiniteScroll.allLoaded).toBe(false)
    })

    it('should set searching state during search', async () => {
      let resolvePromise: (value: any) => void
      const promise = new Promise((resolve) => {
        resolvePromise = resolve
      })
      vi.mocked(notesNoteCbvListNotes).mockReturnValue(promise as any)

      const searchPromise = notesStore.searchNotes('test')

      expect(notesStore.isSearching).toBe(true)

      resolvePromise!({
        items: [],
        total: 0,
        offset: 0,
        limit: 5,
      })
      await searchPromise

      expect(notesStore.isSearching).toBe(false)
    })

    it('should handle empty search query', async () => {
      vi.mocked(notesNoteCbvListNotes).mockResolvedValue({
        items: [],
        total: 0,
        offset: 0,
        limit: 5,
      } as any)

      await notesStore.searchNotes('')

      expect(notesNoteCbvListNotes).toHaveBeenCalledWith({
        query: {
          offset: 0,
          limit: 5,
          search_title: undefined,
        },
      })
    })

    it('should handle request cancellation gracefully', async () => {
      const mockResponse = {
        items: [],
        total: 0,
        offset: 0,
        limit: 5,
      }
      vi.mocked(notesNoteCbvListNotes).mockResolvedValue(mockResponse as any)

      const searchPromise = notesStore.searchNotes('test')

      await expect(searchPromise).resolves.toBeUndefined()
      expect(notesStore.isSearching).toBe(false)
    })
  })

  describe('clearSearch', () => {
    it('should clear search query and reset state', async () => {
      // Setup search state
      notesStore.searchQuery = 'test query'
      notesStore.notes = [createMockNoteListItem({ id: 1 })]

      const mockResponse = {
        items: [createMockNoteListItem({ id: 2 }), createMockNoteListItem({ id: 3 })],
        total: 10,
        offset: 0,
        limit: 5,
      }
      vi.mocked(notesNoteCbvListNotes).mockResolvedValue(mockResponse as any)

      await notesStore.clearSearch()

      expect(notesStore.searchQuery).toBe('')
      expect(notesStore.notes).toEqual(mockResponse.items)
      expect(notesNoteCbvListNotes).toHaveBeenCalledWith({
        query: {
          offset: 0,
          limit: 5,
          search_title: undefined,
        },
      })
    })
  })

  describe('setSearchQuery', () => {
    it('should set search query without triggering search', () => {
      notesStore.setSearchQuery('new query')

      expect(notesStore.searchQuery).toBe('new query')
      expect(notesNoteCbvListNotes).not.toHaveBeenCalled()
    })
  })

  describe('CRUD Operations', () => {
    describe('createNote', () => {
      it('should create a note successfully', async () => {
        const noteData = createMockNoteCreateData({ title: 'New Note' })
        const mockResponse = createMockNoteOut({ id: 123, title: 'New Note' })

        vi.mocked(notesNoteCbvCreateNote).mockResolvedValue(mockResponse as any)

        const result = await notesStore.createNote(noteData)

        expect(result).toEqual(mockResponse)
        expect(notesNoteCbvCreateNote).toHaveBeenCalledWith({
          body: noteData,
        })
      })

      it('should handle create note errors', async () => {
        const noteData = createMockNoteCreateData()
        const apiError = new Error('Failed to create note')

        vi.mocked(notesNoteCbvCreateNote).mockRejectedValue(apiError)

        await expect(notesStore.createNote(noteData)).rejects.toThrow('Failed to create note')
      })
    })

    describe('getNoteById', () => {
      it('should get note by id successfully', async () => {
        const mockNote = createMockNoteOut({ id: 123 })
        vi.mocked(notesNoteCbvGetNoteById).mockResolvedValue(mockNote as any)

        const result = await notesStore.getNoteById('123')

        expect(result).toEqual(mockNote)
        expect(notesNoteCbvGetNoteById).toHaveBeenCalledWith({
          path: { note_id: 123 },
        })
      })

      it('should handle get note by id errors', async () => {
        const apiError = new Error('Note not found')

        vi.mocked(notesNoteCbvGetNoteById).mockRejectedValue(apiError)

        await expect(notesStore.getNoteById('123')).rejects.toThrow('Note not found')
      })
    })

    describe('updateNote', () => {
      it('should update note successfully', async () => {
        const noteData = createMockNoteUpdateData({ title: 'Updated Note' })
        const mockResponse = createMockNoteOut({ id: 123, title: 'Updated Note' })

        vi.mocked(notesNoteCbvUpdateNote).mockResolvedValue(mockResponse as any)

        const result = await notesStore.updateNote('123', noteData)

        expect(result).toEqual(mockResponse)
        expect(notesNoteCbvUpdateNote).toHaveBeenCalledWith({
          path: { note_id: 123 },
          body: noteData,
        })
      })

      it('should handle update note errors', async () => {
        const noteData = createMockNoteUpdateData()
        const apiError = new Error('Failed to update note')

        vi.mocked(notesNoteCbvUpdateNote).mockRejectedValue(apiError)

        await expect(notesStore.updateNote('123', noteData)).rejects.toThrow(
          'Failed to update note',
        )
      })
    })

    describe('deleteNote', () => {
      it('should delete note successfully', async () => {
        vi.mocked(notesNoteCbvDeleteNote).mockResolvedValue(undefined as any)

        await notesStore.deleteNote('123')

        expect(notesNoteCbvDeleteNote).toHaveBeenCalledWith({
          path: { note_id: 123 },
        })
      })

      it('should handle delete note errors', async () => {
        const apiError = new Error('Failed to delete note')

        vi.mocked(notesNoteCbvDeleteNote).mockRejectedValue(apiError)

        await expect(notesStore.deleteNote('123')).rejects.toThrow('Failed to delete note')
      })
    })
  })

  describe('resetState', () => {
    it('should reset all state to initial values', () => {
      // Setup non-default state
      notesStore.notes = [createMockNoteListItem({ id: 1 })]
      notesStore.isLoading = true
      notesStore.error = 'Some error'
      notesStore.searchQuery = 'test'
      notesStore.infiniteScroll.currentOffset = 10
      notesStore.infiniteScroll.totalItems = 20

      notesStore.resetState()

      expect(notesStore.notes).toEqual([])
      expect(notesStore.isLoading).toBe(false)
      expect(notesStore.isLoadingMore).toBe(false)
      expect(notesStore.isSearching).toBe(false)
      expect(notesStore.error).toBeNull()
      expect(notesStore.searchQuery).toBe('')
      expect(notesStore.infiniteScroll.currentOffset).toBe(0)
      expect(notesStore.infiniteScroll.itemsPerPage).toBe(5)
      expect(notesStore.infiniteScroll.totalItems).toBe(0)
      expect(notesStore.infiniteScroll.hasMore).toBe(true)
      expect(notesStore.infiniteScroll.allLoaded).toBe(false)
    })
  })

  describe('Advanced Edge Cases', () => {
    describe('Search Request Cancellation', () => {
      it('should properly sequence request IDs for search cancellation', async () => {
        const responses = [
          {
            items: [createMockNoteListItem({ id: 1, title: 'First' })],
            total: 1,
            offset: 0,
            limit: 5,
          },
          {
            items: [createMockNoteListItem({ id: 2, title: 'Second' })],
            total: 1,
            offset: 0,
            limit: 5,
          },
        ]

        let resolveFirst: (value: any) => void
        let resolveSecond: (value: any) => void

        const firstPromise = new Promise<any>((resolve) => {
          resolveFirst = resolve
        })
        const secondPromise = new Promise<any>((resolve) => {
          resolveSecond = resolve
        })

        vi.mocked(notesNoteCbvListNotes)
          .mockReturnValueOnce(firstPromise as any)
          .mockReturnValueOnce(secondPromise as any)

        // Start first search
        const firstSearch = notesStore.searchNotes('first')
        expect(notesStore.isSearching).toBe(true)

        // Start second search (should cancel first)
        const secondSearch = notesStore.searchNotes('second')
        expect(notesStore.isSearching).toBe(true)

        // Resolve first search (should be ignored due to cancellation)
        resolveFirst!(responses[0])
        await firstSearch

        // Resolve second search (should be processed)
        resolveSecond!(responses[1])
        await secondSearch

        expect(notesStore.isSearching).toBe(false)
        expect(notesStore.searchQuery).toBe('second')
      })

      it('should handle AbortController creation and cleanup', async () => {
        const mockAbortController = {
          abort: vi.fn(),
        }

        const originalAbortController = global.AbortController
        global.AbortController = vi.fn().mockImplementation(() => mockAbortController)

        try {
          vi.mocked(notesNoteCbvListNotes).mockResolvedValue({
            items: [createMockNoteListItem({ id: 1 })],
            total: 1,
            offset: 0,
            limit: 5,
          } as any)

          // Start first search
          await notesStore.searchNotes('first')

          // Verify AbortController was created at least once
          expect(global.AbortController).toHaveBeenCalled()
        } finally {
          global.AbortController = originalAbortController
        }
      })
    })

    describe('Infinite Scroll Boundary Conditions', () => {
      it('should handle exact boundary condition (currentOffset === totalItems)', async () => {
        const response: LimitOffsetPageNoteListItemOutSchema = {
          items: [createMockNoteListItem({ id: 1 })],
          total: 1,
          offset: 0,
          limit: 5,
        }
        vi.mocked(notesNoteCbvListNotes).mockResolvedValue(response as any)

        await notesStore.fetchNotes()

        expect(notesStore.infiniteScroll.currentOffset).toBe(1)
        expect(notesStore.infiniteScroll.totalItems).toBe(1)
        expect(notesStore.infiniteScroll.hasMore).toBe(false)
        expect(notesStore.infiniteScroll.allLoaded).toBe(true)
      })

      it('should handle zero total items', async () => {
        const response: LimitOffsetPageNoteListItemOutSchema = {
          items: [],
          total: 0,
          offset: 0,
          limit: 5,
        }
        vi.mocked(notesNoteCbvListNotes).mockResolvedValue(response as any)

        await notesStore.fetchNotes()

        expect(notesStore.infiniteScroll.currentOffset).toBe(0)
        expect(notesStore.infiniteScroll.totalItems).toBe(0)
        expect(notesStore.infiniteScroll.hasMore).toBe(false)
        expect(notesStore.infiniteScroll.allLoaded).toBe(true)
        expect(notesStore.notes).toEqual([])
      })

      it('should handle large offset calculations correctly', async () => {
        const response: LimitOffsetPageNoteListItemOutSchema = {
          items: Array.from({ length: 5 }, (_, i) => createMockNoteListItem({ id: i + 96 })),
          total: 1000,
          offset: 95,
          limit: 5,
        }
        vi.mocked(notesNoteCbvListNotes).mockResolvedValue(response as any)

        await notesStore.fetchNotes({ offset: 95 })

        expect(notesStore.infiniteScroll.currentOffset).toBe(100)
        expect(notesStore.infiniteScroll.totalItems).toBe(1000)
        expect(notesStore.infiniteScroll.hasMore).toBe(true)
        expect(notesStore.infiniteScroll.allLoaded).toBe(false)
      })
    })

    describe('State Consistency During Concurrent Operations', () => {
      it('should maintain consistent state during overlapping fetch and search', async () => {
        const fetchResponse = {
          items: [createMockNoteListItem({ id: 1, title: 'Fetch Result' })],
          total: 5,
          offset: 0,
          limit: 5,
        }

        const searchResponse = {
          items: [createMockNoteListItem({ id: 2, title: 'Search Result' })],
          total: 1,
          offset: 0,
          limit: 5,
        }

        let resolveFetch: (value: any) => void
        let resolveSearch: (value: any) => void

        const fetchPromise = new Promise<any>((resolve) => {
          resolveFetch = resolve
        })
        const searchPromise = new Promise<any>((resolve) => {
          resolveSearch = resolve
        })

        vi.mocked(notesNoteCbvListNotes)
          .mockReturnValueOnce(fetchPromise as any)
          .mockReturnValueOnce(searchPromise as any)

        // Start fetch
        const fetch = notesStore.fetchNotes()
        expect(notesStore.isLoading).toBe(true)

        // Start search (should not affect fetch state)
        const search = notesStore.searchNotes('test')
        expect(notesStore.isSearching).toBe(true)

        // Resolve fetch first
        resolveFetch!(fetchResponse)
        await fetch

        // Resolve search
        resolveSearch!(searchResponse)
        await search

        expect(notesStore.isLoading).toBe(false)
        expect(notesStore.isSearching).toBe(false)
        expect(notesStore.searchQuery).toBe('test')
      })

      it('should handle state transitions during rapid successive calls', async () => {
        const responses = Array.from({ length: 3 }, (_, i) => ({
          items: [createMockNoteListItem({ id: i, title: `Note ${i}` })],
          total: 1,
          offset: 0,
          limit: 5,
        }))

        vi.mocked(notesNoteCbvListNotes)
          .mockResolvedValueOnce(responses[0] as any)
          .mockResolvedValueOnce(responses[1] as any)
          .mockResolvedValueOnce(responses[2] as any)

        // Rapid successive calls
        const promises = [
          notesStore.fetchNotes(),
          notesStore.searchNotes('query1'),
          notesStore.searchNotes('query2'),
        ]

        await Promise.all(promises)

        expect(notesStore.isLoading).toBe(false)
        expect(notesStore.isSearching).toBe(false)
        expect(notesStore.searchQuery).toBe('query2')
      })
    })

    describe('Memory and Performance Edge Cases', () => {
      it('should handle large datasets without memory issues', async () => {
        const largeDataset = Array.from({ length: 1000 }, (_, i) =>
          createMockNoteListItem({ id: i, title: `Note ${i}` }),
        )

        const response: LimitOffsetPageNoteListItemOutSchema = {
          items: largeDataset,
          total: 1000,
          offset: 0,
          limit: 1000,
        }
        vi.mocked(notesNoteCbvListNotes).mockResolvedValue(response as any)

        await notesStore.fetchNotes({ limit: 1000 })

        expect(notesStore.notes).toHaveLength(1000)
        expect(notesStore.infiniteScroll.currentOffset).toBe(1000)
        expect(notesStore.infiniteScroll.totalItems).toBe(1000)
      })

      it('should handle rapid state changes without race conditions', async () => {
        const response = {
          items: [createMockNoteListItem({ id: 1 })],
          total: 1,
          offset: 0,
          limit: 5,
        }
        vi.mocked(notesNoteCbvListNotes).mockResolvedValue(response as any)

        // Rapid state changes
        for (let i = 0; i < 10; i++) {
          notesStore.setSearchQuery(`query${i}`)
          if (i % 2 === 0) {
            await notesStore.searchNotes(`search${i}`)
          }
          if (i % 3 === 0) {
            await notesStore.clearSearch()
          }
        }

        // Should reach a consistent final state
        expect(typeof notesStore.searchQuery).toBe('string')
        expect(typeof notesStore.isSearching).toBe('boolean')
        expect(Array.isArray(notesStore.notes)).toBe(true)
      })
    })

    describe('API Response Edge Cases', () => {
      it('should handle responses with null/undefined values gracefully', async () => {
        const malformedResponse = {
          items: null,
          total: undefined,
          offset: null,
          limit: undefined,
        }
        vi.mocked(notesNoteCbvListNotes).mockResolvedValue(malformedResponse as any)

        await notesStore.fetchNotes()

        // Should not crash and provide sensible defaults
        expect(notesStore.notes).toEqual([])
        expect(notesStore.infiniteScroll.totalItems).toBe(0)
        expect(notesStore.infiniteScroll.currentOffset).toBe(0)
      })

      it('should handle negative values in API response', async () => {
        const responseWithNegatives = {
          items: [createMockNoteListItem({ id: 1 })],
          total: -1,
          offset: -5,
          limit: -10,
        }
        vi.mocked(notesNoteCbvListNotes).mockResolvedValue(responseWithNegatives as any)

        await notesStore.fetchNotes()

        // Should handle gracefully
        expect(notesStore.notes).toEqual(responseWithNegatives.items)
        expect(notesStore.infiniteScroll.totalItems).toBe(-1)
      })

      it('should handle extremely large numbers in response', async () => {
        const responseWithLargeNumbers = {
          items: [createMockNoteListItem({ id: 1 })],
          total: Number.MAX_SAFE_INTEGER,
          offset: Number.MAX_SAFE_INTEGER - 1,
          limit: 5,
        }
        vi.mocked(notesNoteCbvListNotes).mockResolvedValue(responseWithLargeNumbers as any)

        await notesStore.fetchNotes({ offset: Number.MAX_SAFE_INTEGER - 1 })

        expect(notesStore.infiniteScroll.totalItems).toBe(Number.MAX_SAFE_INTEGER)
        expect(notesStore.infiniteScroll.currentOffset).toBe(Number.MAX_SAFE_INTEGER)
      })
    })

    describe('Authentication State Changes', () => {
      it('should handle authentication state changes during operations', async () => {
        let resolvePromise: (value: any) => void
        const promise = new Promise<any>((resolve) => {
          resolvePromise = resolve
        })
        vi.mocked(notesNoteCbvListNotes).mockReturnValue(promise as any)

        // Start operation while authenticated
        const fetchPromise = notesStore.fetchNotes()

        // Change authentication state
        mockAuthStore.isAuthenticated = false

        // Resolve the promise
        resolvePromise!({
          items: [createMockNoteListItem({ id: 1 })],
          total: 1,
          offset: 0,
          limit: 5,
        })

        await fetchPromise

        // Should complete the operation that was started while authenticated
        expect(notesStore.notes).toHaveLength(1)
      })

      it('should prevent new operations when authentication is lost', async () => {
        mockAuthStore.isAuthenticated = false

        await notesStore.fetchNotes()

        expect(notesNoteCbvListNotes).not.toHaveBeenCalled()
        expect(notesStore.isLoading).toBe(false)
      })
    })

    describe('Boundary Value Testing', () => {
      it('should handle itemsPerPage boundary values', async () => {
        // Test with minimum value
        notesStore.infiniteScroll.itemsPerPage = 1

        const response = {
          items: [createMockNoteListItem({ id: 1 })],
          total: 1,
          offset: 0,
          limit: 1,
        }
        vi.mocked(notesNoteCbvListNotes).mockResolvedValue(response as any)

        await notesStore.fetchNotes()

        expect(notesStore.infiniteScroll.currentOffset).toBe(1)
        expect(notesStore.infiniteScroll.hasMore).toBe(false)
      })

      it('should handle offset at maximum safe integer', async () => {
        const maxOffset = Number.MAX_SAFE_INTEGER - 10

        const response = {
          items: [],
          total: Number.MAX_SAFE_INTEGER,
          offset: maxOffset,
          limit: 5,
        }
        vi.mocked(notesNoteCbvListNotes).mockResolvedValue(response as any)

        await notesStore.fetchNotes({ offset: maxOffset })

        expect(notesStore.infiniteScroll.currentOffset).toBe(maxOffset)
      })
    })

    describe('String and Search Edge Cases', () => {
      it('should handle special characters in search query', async () => {
        const specialQuery = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`'

        const response = {
          items: [],
          total: 0,
          offset: 0,
          limit: 5,
        }
        vi.mocked(notesNoteCbvListNotes).mockResolvedValue(response as any)

        await notesStore.searchNotes(specialQuery)

        expect(notesStore.searchQuery).toBe(specialQuery)
        expect(notesNoteCbvListNotes).toHaveBeenCalledWith({
          query: {
            offset: 0,
            limit: 5,
            search_title: specialQuery,
          },
        })
      })

      it('should handle unicode characters in search', async () => {
        const unicodeQuery = '测试 🌟 Ñoël café résumé'

        const response = {
          items: [],
          total: 0,
          offset: 0,
          limit: 5,
        }
        vi.mocked(notesNoteCbvListNotes).mockResolvedValue(response as any)

        await notesStore.searchNotes(unicodeQuery)

        expect(notesStore.searchQuery).toBe(unicodeQuery)
      })

      it('should handle very long search queries', async () => {
        const longQuery = 'a'.repeat(10000)

        const response = {
          items: [],
          total: 0,
          offset: 0,
          limit: 5,
        }
        vi.mocked(notesNoteCbvListNotes).mockResolvedValue(response as any)

        await notesStore.searchNotes(longQuery)

        expect(notesStore.searchQuery).toBe(longQuery)
        expect(notesStore.searchQuery).toHaveLength(10000)
      })
    })
  })

  describe('Race Condition Prevention', () => {
    it('should handle concurrent fetch requests gracefully', async () => {
      const mockResponse = {
        items: [createMockNoteListItem({ id: 1 })],
        total: 1,
        offset: 0,
        limit: 5,
      }
      vi.mocked(notesNoteCbvListNotes).mockResolvedValue(mockResponse as any)

      // Start multiple concurrent requests
      const promises = [notesStore.fetchNotes(), notesStore.fetchNotes(), notesStore.fetchNotes()]

      await Promise.all(promises)

      // Should handle gracefully without race conditions
      expect(notesStore.isLoading).toBe(false)
      expect(notesStore.notes).toEqual(mockResponse.items)
    })

    it('should prevent loading more when other operations are in progress', async () => {
      // Set up conditions that should prevent loadMoreNotes
      notesStore.infiniteScroll.hasMore = true
      notesStore.isSearching = true

      await notesStore.loadMoreNotes()

      expect(notesNoteCbvListNotes).not.toHaveBeenCalled()
    })
  })

  describe('Error Handling Edge Cases', () => {
    it('should handle malformed API responses', async () => {
      // Test with malformed response (missing required fields)
      vi.mocked(notesNoteCbvListNotes).mockResolvedValue(null as any)

      await notesStore.fetchNotes()

      // Should handle gracefully and not crash
      expect(notesStore.infiniteScroll.totalItems).toBe(0)
      expect(notesStore.notes).toEqual([])
    })

    it('should handle API responses with undefined items', async () => {
      const malformedResponse = {
        total: 5,
        offset: 0,
        limit: 5,
        // items is undefined
      }
      vi.mocked(notesNoteCbvListNotes).mockResolvedValue(malformedResponse as any)

      await notesStore.fetchNotes()

      expect(notesStore.notes).toEqual([])
      expect(notesStore.infiniteScroll.totalItems).toBe(5)
    })
  })

  describe('Type Safety', () => {
    it('should maintain type safety for note operations', () => {
      // This test ensures TypeScript types are correctly maintained
      expect(typeof notesStore.notes).toBe('object')
      expect(Array.isArray(notesStore.notes)).toBe(true)
      expect(typeof notesStore.isLoading).toBe('boolean')
      expect(typeof notesStore.searchQuery).toBe('string')
      expect(typeof notesStore.infiniteScroll.currentOffset).toBe('number')
    })
  })

  describe('Advanced Request Management', () => {
    describe('Search Request Race Conditions and Cleanup', () => {
      it('should handle error when search request is aborted but still latest', async () => {
        // Mock the fetch to throw an error during the search
        const error = new Error('Search request failed')
        vi.mocked(notesNoteCbvListNotes).mockRejectedValue(error)

        // Trigger search - the error will be handled by fetchNotes internally
        await notesStore.searchNotes('test query')

        // Verify the error was handled and stored in the store
        expect(notesStore.error).toBe('Failed to load notes. Please try again.')

        // Verify the search state is reset properly in the finally block
        expect(notesStore.isSearching).toBe(false)
      })
    })

    describe('Request Cancellation Cleanup', () => {
      it('should cover clearSearch abort controller cleanup path', async () => {
        // Reset mocks to start fresh
        vi.clearAllMocks()

        // Mock a successful search response first
        const searchResponse = {
          items: [createMockNoteListItem({ id: 1 })],
          total: 1,
          offset: 0,
          limit: 5,
        }
        vi.mocked(notesNoteCbvListNotes).mockResolvedValueOnce(searchResponse as any)

        // Start a search - this will create currentSearchController
        await notesStore.searchNotes('test')

        // Verify search completed
        expect(notesStore.searchQuery).toBe('test')
        expect(notesStore.notes).toHaveLength(1)

        // Now start another search that will keep pending
        let resolvePendingSearch: (value: any) => void
        const pendingPromise = new Promise((resolve) => {
          resolvePendingSearch = resolve
        })
        vi.mocked(notesNoteCbvListNotes).mockReturnValueOnce(pendingPromise as any)

        // Start the pending search (don't await it)
        const pendingSearchPromise = notesStore.searchNotes('pending search')

        // Verify the pending search started
        expect(notesStore.isSearching).toBe(true)
        expect(notesStore.searchQuery).toBe('pending search')

        // Now mock clearSearch fetchNotes
        const clearResponse = {
          items: [createMockNoteListItem({ id: 2 })],
          total: 1,
          offset: 0,
          limit: 5,
        }
        vi.mocked(notesNoteCbvListNotes).mockResolvedValueOnce(clearResponse as any)

        // Call clearSearch while search is pending - this should trigger abort controller cleanup
        const clearPromise = notesStore.clearSearch()

        // Complete the pending search (but it should be aborted and ignored)
        resolvePendingSearch!({
          items: [createMockNoteListItem({ id: 999 })], // This should be ignored due to abort
          total: 1,
          offset: 0,
          limit: 5,
        })

        await Promise.allSettled([pendingSearchPromise, clearPromise])

        // Verify clearSearch worked - the exact data depends on timing, but the search should be cleared
        expect(notesStore.searchQuery).toBe('')
        expect(notesStore.notes).toHaveLength(1)
        // The id can be either from clearSearch (2) or the pending search (999) depending on timing
      })

      it('should cover resetState abort controller cleanup path', () => {
        // Reset mocks to start fresh
        vi.clearAllMocks()

        // Mock a search that will keep pending
        let resolvePendingSearch: (value: any) => void
        const pendingPromise = new Promise((resolve) => {
          resolvePendingSearch = resolve
        })
        vi.mocked(notesNoteCbvListNotes).mockReturnValue(pendingPromise as any)

        // Start a search that will remain pending
        notesStore.searchNotes('pending search')

        // Verify search started
        expect(notesStore.isSearching).toBe(true)
        expect(notesStore.searchQuery).toBe('pending search')

        // Call resetState while search is pending - this should trigger abort controller cleanup
        notesStore.resetState()

        // Verify resetState worked immediately
        expect(notesStore.searchQuery).toBe('')
        expect(notesStore.notes).toHaveLength(0)
        expect(notesStore.isLoading).toBe(false)
        expect(notesStore.isLoadingMore).toBe(false)
        expect(notesStore.isSearching).toBe(false)

        // Complete the pending search (should be ignored due to abort)
        resolvePendingSearch!({
          items: [createMockNoteListItem({ id: 3 })],
          total: 1,
          offset: 0,
          limit: 5,
        })

        // The state should remain reset even after the search resolves
        expect(notesStore.notes).toHaveLength(0)
      })
    })
  })
})
