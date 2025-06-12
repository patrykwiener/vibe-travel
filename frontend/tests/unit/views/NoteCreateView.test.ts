import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/vue'
import { renderWithProviders } from '@tests/utils'
import NoteCreateView from '@/views/NoteCreateView.vue'
import { useNotesStore } from '@/stores/notes'
import { ApiError, type ApiErrorResponse } from '@/utils/api-errors'
import type { NoteCreateInSchema, NoteOutSchema } from '@/client/types.gen'

// Mock the notes store
vi.mock('@/stores/notes', () => ({
  useNotesStore: vi.fn(),
}))

// Mock router
const mockPush = vi.fn()
vi.mock('vue-router', async (importOriginal: () => Promise<any>) => {
  const actual = (await importOriginal()) as any
  return {
    ...actual,
    useRouter: () => ({
      push: mockPush,
    }),
  }
})

// Create a mock ApiError for testing that properly extends the real ApiError class
class MockApiError extends ApiError {
  public readonly code = 'MOCK_ERROR'
  public readonly userMessage: string
  public readonly statusCode: number
  public readonly originalError: ApiErrorResponse

  constructor(message: string, statusCode: number = 400) {
    super(message)
    this.name = 'MockApiError'
    this.userMessage = message
    this.statusCode = statusCode
    this.originalError = {
      error: { detail: message },
      response: { status: statusCode } as Response,
      request: new Request('https://test.example.com/api'),
    }
  }
}

// Helper to create mock note data for form
const createMockNoteData = (overrides: Partial<NoteCreateInSchema> = {}): NoteCreateInSchema => ({
  title: 'Amazing Trip to Tokyo',
  place: 'Tokyo, Japan',
  date_from: '2025-07-10',
  date_to: '2025-07-15',
  number_of_people: 2,
  key_ideas: 'Visit Tokyo Tower, Explore Shibuya, Try authentic ramen',
  ...overrides,
})

// Helper to create mock created note response
const createMockCreatedNote = (overrides: Partial<NoteOutSchema> = {}): NoteOutSchema => ({
  id: 123,
  user_id: 'user-456',
  title: 'Amazing Trip to Tokyo',
  place: 'Tokyo, Japan',
  date_from: '2025-07-10',
  date_to: '2025-07-15',
  number_of_people: 2,
  key_ideas: 'Visit Tokyo Tower, Explore Shibuya, Try authentic ramen',
  created_at: '2025-06-11T10:00:00Z',
  updated_at: '2025-06-11T10:00:00Z',
  ...overrides,
})

describe('NoteCreateView - Core Functionality', () => {
  const mockNotesStore = {
    createNote: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useNotesStore).mockReturnValue(mockNotesStore as any)

    // Mock Date.now for consistent testing
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-06-11'))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render page header correctly', () => {
      renderWithProviders(NoteCreateView)

      expect(screen.getByText('Create New Note')).toBeInTheDocument()
      expect(
        screen.getByText('Add details about your upcoming trip to get started'),
      ).toBeInTheDocument()
    })

    it('should render back button with correct functionality', async () => {
      renderWithProviders(NoteCreateView)

      const backButton = screen.getByRole('button', { name: /go back to notes list/i })
      expect(backButton).toBeInTheDocument()

      await fireEvent.click(backButton)
      expect(mockPush).toHaveBeenCalledWith({ name: 'notes' })
    })

    it('should render NoteForm component', () => {
      renderWithProviders(NoteCreateView)

      // Check for form fields that should be rendered by NoteForm
      expect(screen.getByLabelText(/title.*\*/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/destination.*\*/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/start date.*\*/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/end date.*\*/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/number of travelers.*\*/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/key ideas & activities/i)).toBeInTheDocument()
    })

    it('should not render error alert initially', () => {
      renderWithProviders(NoteCreateView)

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })

  describe('Form Submission', () => {
    it('should handle successful note creation', async () => {
      const mockFormData = createMockNoteData()
      const mockCreatedNote = createMockCreatedNote()

      mockNotesStore.createNote.mockResolvedValueOnce(mockCreatedNote)

      renderWithProviders(NoteCreateView)

      // Fill form with valid data
      await fireEvent.input(screen.getByLabelText(/title.*\*/i), {
        target: { value: mockFormData.title },
      })
      await fireEvent.input(screen.getByLabelText(/destination.*\*/i), {
        target: { value: mockFormData.place },
      })
      await fireEvent.input(screen.getByLabelText(/start date.*\*/i), {
        target: { value: mockFormData.date_from },
      })
      await fireEvent.input(screen.getByLabelText(/end date.*\*/i), {
        target: { value: mockFormData.date_to },
      })

      const form = document.querySelector('form')!
      await fireEvent.submit(form)

      await waitFor(
        () => {
          expect(mockNotesStore.createNote).toHaveBeenCalled()
          expect(mockPush).toHaveBeenCalledWith({
            name: 'note-detail',
            params: { noteId: '123' },
          })
        },
        { timeout: 2000 },
      )
    })

    it('should handle API errors with specific error message', async () => {
      const apiError = new MockApiError('Title must be at least 3 characters long', 400)
      mockNotesStore.createNote.mockRejectedValueOnce(apiError)

      renderWithProviders(NoteCreateView)

      // Fill form with minimal data
      await fireEvent.input(screen.getByLabelText(/title.*\*/i), {
        target: { value: 'Test Title' },
      })
      await fireEvent.input(screen.getByLabelText(/destination.*\*/i), {
        target: { value: 'Test Place' },
      })
      await fireEvent.input(screen.getByLabelText(/start date.*\*/i), {
        target: { value: '2025-07-10' },
      })
      await fireEvent.input(screen.getByLabelText(/end date.*\*/i), {
        target: { value: '2025-07-15' },
      })

      const form = document.querySelector('form')!
      await fireEvent.submit(form)

      await waitFor(
        () => {
          expect(screen.getByRole('alert')).toBeInTheDocument()
          expect(screen.getByText('Title must be at least 3 characters long')).toBeInTheDocument()
        },
        { timeout: 2000 },
      )
    })

    it('should handle unexpected errors with generic message', async () => {
      const unexpectedError = new Error('Network error')
      mockNotesStore.createNote.mockRejectedValueOnce(unexpectedError)

      renderWithProviders(NoteCreateView)

      // Fill form with minimal data
      await fireEvent.input(screen.getByLabelText(/title.*\*/i), {
        target: { value: 'Test Title' },
      })
      await fireEvent.input(screen.getByLabelText(/destination.*\*/i), {
        target: { value: 'Test Place' },
      })
      await fireEvent.input(screen.getByLabelText(/start date.*\*/i), {
        target: { value: '2025-07-10' },
      })
      await fireEvent.input(screen.getByLabelText(/end date.*\*/i), {
        target: { value: '2025-07-15' },
      })

      const form = document.querySelector('form')!
      await fireEvent.submit(form)

      await waitFor(
        () => {
          expect(screen.getByRole('alert')).toBeInTheDocument()
          expect(
            screen.getByText('An unexpected error occurred. Please try again.'),
          ).toBeInTheDocument()
        },
        { timeout: 2000 },
      )
    })
  })

  describe('Form Cancellation', () => {
    it('should handle cancel button click', async () => {
      renderWithProviders(NoteCreateView)

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await fireEvent.click(cancelButton)

      expect(mockPush).toHaveBeenCalledWith({ name: 'notes' })
    })
  })

  describe('Error State Management', () => {
    it('should clear error when user starts typing', async () => {
      // First, cause an error
      const error = new MockApiError('Test error', 400)
      mockNotesStore.createNote.mockRejectedValueOnce(error)

      renderWithProviders(NoteCreateView)

      // Fill and submit form to trigger error
      await fireEvent.input(screen.getByLabelText(/title.*\*/i), {
        target: { value: 'Test Title' },
      })
      await fireEvent.input(screen.getByLabelText(/destination.*\*/i), {
        target: { value: 'Test Place' },
      })
      await fireEvent.input(screen.getByLabelText(/start date.*\*/i), {
        target: { value: '2025-07-10' },
      })
      await fireEvent.input(screen.getByLabelText(/end date.*\*/i), {
        target: { value: '2025-07-15' },
      })

      const form = document.querySelector('form')!
      await fireEvent.submit(form)

      await waitFor(
        () => {
          expect(screen.getByRole('alert')).toBeInTheDocument()
        },
        { timeout: 2000 },
      )

      // Now change a field to trigger error clearing
      await fireEvent.input(screen.getByLabelText(/title.*\*/i), {
        target: { value: 'Updated Title' },
      })

      // Error should be cleared
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      renderWithProviders(NoteCreateView)

      const mainHeading = screen.getByRole('heading', { level: 1 })
      expect(mainHeading).toHaveTextContent('Create New Note')

      const subHeading = screen.getByRole('heading', { level: 2 })
      expect(subHeading).toHaveTextContent('Trip Details')
    })

    it('should have proper aria-label for back button', () => {
      renderWithProviders(NoteCreateView)

      const backButton = screen.getByRole('button', { name: /go back to notes list/i })
      expect(backButton).toHaveAttribute('aria-label', 'Go back to notes list')
    })
  })

  describe('Navigation', () => {
    it('should convert numeric ID to string for navigation', async () => {
      const mockCreatedNote = createMockCreatedNote({ id: 456 })
      mockNotesStore.createNote.mockResolvedValueOnce(mockCreatedNote)

      renderWithProviders(NoteCreateView)

      // Fill and submit form with minimal data
      await fireEvent.input(screen.getByLabelText(/title.*\*/i), {
        target: { value: 'Test Trip' },
      })
      await fireEvent.input(screen.getByLabelText(/destination.*\*/i), {
        target: { value: 'Test Place' },
      })
      await fireEvent.input(screen.getByLabelText(/start date.*\*/i), {
        target: { value: '2025-07-10' },
      })
      await fireEvent.input(screen.getByLabelText(/end date.*\*/i), {
        target: { value: '2025-07-15' },
      })

      const form = document.querySelector('form')!
      await fireEvent.submit(form)

      await waitFor(
        () => {
          expect(mockPush).toHaveBeenCalledWith({
            name: 'note-detail',
            params: { noteId: '456' },
          })
        },
        { timeout: 2000 },
      )
    })
  })

  describe('Data Types and Schema Compliance', () => {
    it('should pass correctly formatted data to store', async () => {
      const mockCreatedNote = createMockCreatedNote()
      mockNotesStore.createNote.mockResolvedValueOnce(mockCreatedNote)

      renderWithProviders(NoteCreateView)

      // Fill form with specific data types
      await fireEvent.input(screen.getByLabelText(/title.*\*/i), {
        target: { value: 'Test Trip' },
      })
      await fireEvent.input(screen.getByLabelText(/destination.*\*/i), {
        target: { value: 'Paris, France' },
      })
      await fireEvent.input(screen.getByLabelText(/start date.*\*/i), {
        target: { value: '2025-07-10' },
      })
      await fireEvent.input(screen.getByLabelText(/end date.*\*/i), {
        target: { value: '2025-07-15' },
      })
      await fireEvent.input(screen.getByLabelText(/number of travelers.*\*/i), {
        target: { value: '3' },
      })
      await fireEvent.input(screen.getByLabelText(/key ideas & activities/i), {
        target: { value: 'Visit Eiffel Tower' },
      })

      const form = document.querySelector('form')!
      await fireEvent.submit(form)

      await waitFor(
        () => {
          expect(mockNotesStore.createNote).toHaveBeenCalledWith({
            title: 'Test Trip',
            place: 'Paris, France',
            date_from: '2025-07-10',
            date_to: '2025-07-15',
            number_of_people: 3,
            key_ideas: 'Visit Eiffel Tower',
          })
        },
        { timeout: 2000 },
      )
    })
  })
})
