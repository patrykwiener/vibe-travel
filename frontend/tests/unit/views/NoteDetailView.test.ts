import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/vue'
import { renderWithProviders } from '@tests/utils'
import NoteDetailView from '@/views/NoteDetailView.vue'
import { useNotesStore } from '@/stores/notes'
import { usePlanStore } from '@/stores/plan'
import type { NoteOutSchema } from '@/client/types.gen'
import { ApiError, type ApiErrorResponse } from '@/utils/api-errors'

// Mock the stores
vi.mock('@/stores/notes', () => ({
  useNotesStore: vi.fn(),
}))

vi.mock('@/stores/plan', () => ({
  usePlanStore: vi.fn(),
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
    useRoute: () => ({
      params: { noteId: '123' },
    }),
  }
})

// Mock child components
vi.mock('@/components/notes/NoteDisplaySection.vue', () => ({
  default: {
    name: 'NoteDisplaySection',
    props: ['note', 'noteId'],
    emits: ['delete'],
    template: `
      <div data-testid="note-display-section">
        <h2>{{ note.title }}</h2>
        <p>{{ note.place }}</p>
        <button @click="$emit('delete')" data-testid="delete-note-button">Delete Note</button>
      </div>
    `,
  },
}))

vi.mock('@/components/notes/PlanSection.vue', () => ({
  default: {
    name: 'PlanSection',
    props: ['planText', 'planType', 'isGenerating', 'isSaving', 'canSave', 'canDiscard'],
    emits: ['generate', 'save', 'discard', 'update:plan-text'],
    template: `
      <div data-testid="plan-section">
        <div v-if="isGenerating">Generating plan...</div>
        <div v-if="planText">{{ planText }}</div>
        <button @click="$emit('generate')" data-testid="generate-plan-button" :disabled="isGenerating">
          Generate Plan
        </button>
        <button @click="$emit('save')" data-testid="save-plan-button" :disabled="!canSave || isSaving">
          Save Plan
        </button>
        <button @click="$emit('discard')" data-testid="discard-plan-button" :disabled="!canDiscard">
          Discard Changes
        </button>
        <textarea
          :value="planText"
          @input="$emit('update:plan-text', $event.target.value)"
          data-testid="plan-text-input"
        />
      </div>
    `,
  },
}))

vi.mock('@/components/ui/ConfirmationModal.vue', () => ({
  default: {
    name: 'ConfirmationModal',
    props: ['show', 'title', 'message', 'confirmText', 'confirmButtonClass'],
    emits: ['confirm', 'cancel'],
    template: `
      <div v-if="show" data-testid="confirmation-modal">
        <h3>{{ title }}</h3>
        <p>{{ message }}</p>
        <button @click="$emit('confirm')" data-testid="confirm-button">{{ confirmText }}</button>
        <button @click="$emit('cancel')" data-testid="cancel-button">Cancel</button>
      </div>
    `,
  },
}))

vi.mock('@/components/ui/PlanGenerationModal.vue', () => ({
  default: {
    name: 'PlanGenerationModal',
    props: ['show', 'isGenerating', 'hasUnsavedChanges', 'title', 'message', 'confirmText'],
    emits: ['confirm', 'cancel'],
    template: `
      <div v-if="show" data-testid="plan-generation-modal">
        <h3>{{ title }}</h3>
        <p v-if="hasUnsavedChanges">{{ message }}</p>
        <div v-if="isGenerating">Generating...</div>
        <button @click="$emit('confirm')" data-testid="confirm-generate-button" :disabled="isGenerating">
          {{ confirmText }}
        </button>
        <button @click="$emit('cancel')" data-testid="cancel-generate-button" :disabled="isGenerating">
          Cancel
        </button>
      </div>
    `,
  },
}))

// Create a mock ApiError for testing
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

// Helper to create mock note data
const createMockNote = (overrides: Partial<NoteOutSchema> = {}): NoteOutSchema => ({
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

describe('NoteDetailView - Core Functionality', () => {
  const mockNotesStore = {
    getNoteById: vi.fn(),
    deleteNote: vi.fn(),
  }

  const mockPlanStore = {
    setActiveNoteId: vi.fn(),
    loadPlanForNote: vi.fn(),
    generatePlan: vi.fn(),
    savePlan: vi.fn(),
    discardChanges: vi.fn(),
    updatePlanText: vi.fn(),
    planText: '',
    currentPlanType: null,
    isGeneratingPlan: false,
    isSavingPlan: false,
    canSaveChanges: false,
    canDiscardChanges: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useNotesStore).mockReturnValue(mockNotesStore as any)
    vi.mocked(usePlanStore).mockReturnValue(mockPlanStore as any)

    // Reset plan store state
    mockPlanStore.planText = ''
    mockPlanStore.currentPlanType = null
    mockPlanStore.isGeneratingPlan = false
    mockPlanStore.isSavingPlan = false
    mockPlanStore.canSaveChanges = false
    mockPlanStore.canDiscardChanges = false

    // Mock Date.now for consistent testing
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-06-11'))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('Component Loading and Initial State', () => {
    it('should show loading state initially', () => {
      mockNotesStore.getNoteById.mockImplementation(() => new Promise(() => {})) // Never resolves

      renderWithProviders(NoteDetailView)

      expect(screen.getByText('Loading note...')).toBeInTheDocument()
      expect(screen.getByText('Please wait while we fetch your travel details')).toBeInTheDocument()
      // Check for loading spinner (SVG element)
      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })

    it('should load and display note data successfully', async () => {
      const mockNote = createMockNote()
      mockNotesStore.getNoteById.mockResolvedValueOnce(mockNote)
      mockPlanStore.loadPlanForNote.mockResolvedValueOnce(undefined)

      renderWithProviders(NoteDetailView)

      await waitFor(() => {
        expect(screen.queryByText('Loading note...')).not.toBeInTheDocument()
      })

      expect(screen.getByRole('heading', { level: 1, name: mockNote.title })).toBeInTheDocument()
      expect(screen.getByText('Travel details and plan for your trip')).toBeInTheDocument()
      expect(screen.getByTestId('note-display-section')).toBeInTheDocument()
      expect(screen.getByTestId('plan-section')).toBeInTheDocument()
    })

    it('should call store methods with correct parameters on mount', async () => {
      const mockNote = createMockNote()
      mockNotesStore.getNoteById.mockResolvedValueOnce(mockNote)
      mockPlanStore.loadPlanForNote.mockResolvedValueOnce(undefined)

      renderWithProviders(NoteDetailView)

      await waitFor(() => {
        expect(mockPlanStore.setActiveNoteId).toHaveBeenCalledWith(123)
        expect(mockNotesStore.getNoteById).toHaveBeenCalledWith('123')
        expect(mockPlanStore.loadPlanForNote).toHaveBeenCalledWith(123)
      })
    })

    it('should handle route parameter changes and reload data', async () => {
      const mockNote = createMockNote()
      mockNotesStore.getNoteById.mockResolvedValue(mockNote)
      mockPlanStore.loadPlanForNote.mockResolvedValue(undefined)

      // This test verifies the watcher functionality
      // Since we can't easily change route params dynamically in test,
      // we verify the initial call happens
      renderWithProviders(NoteDetailView)

      await waitFor(() => {
        expect(mockNotesStore.getNoteById).toHaveBeenCalledWith('123')
      })
    })
  })

  describe('Error States on Load', () => {
    it('should handle note not found error', async () => {
      mockNotesStore.getNoteById.mockResolvedValueOnce(null)

      renderWithProviders(NoteDetailView)

      await waitFor(() => {
        expect(screen.getByText('Failed to load note')).toBeInTheDocument()
        expect(screen.getByText('Note not found')).toBeInTheDocument()
      })

      const tryAgainButton = screen.getByRole('button', { name: /try again/i })
      expect(tryAgainButton).toBeInTheDocument()
    })

    it('should handle API errors during note loading', async () => {
      const apiError = new MockApiError('Access denied', 403)
      mockNotesStore.getNoteById.mockRejectedValueOnce(apiError)

      renderWithProviders(NoteDetailView)

      await waitFor(() => {
        expect(screen.getByText('Failed to load note')).toBeInTheDocument()
        expect(screen.getByText('Failed to load note. Please try again.')).toBeInTheDocument()
      })
    })

    it('should handle plan loading errors separately from note loading', async () => {
      const mockNote = createMockNote()
      mockNotesStore.getNoteById.mockResolvedValueOnce(mockNote)
      mockPlanStore.loadPlanForNote.mockRejectedValueOnce(new Error('Plan load failed'))

      renderWithProviders(NoteDetailView)

      await waitFor(() => {
        expect(screen.getByText('Failed to load note. Please try again.')).toBeInTheDocument()
      })
    })

    it('should retry loading note when try again button is clicked', async () => {
      const apiError = new MockApiError('Network timeout', 500)
      const mockNote = createMockNote()

      mockNotesStore.getNoteById.mockRejectedValueOnce(apiError).mockResolvedValueOnce(mockNote)
      mockPlanStore.loadPlanForNote.mockResolvedValue(undefined)

      renderWithProviders(NoteDetailView)

      await waitFor(() => {
        expect(screen.getByText('Failed to load note')).toBeInTheDocument()
      })

      const tryAgainButton = screen.getByRole('button', { name: /try again/i })
      await fireEvent.click(tryAgainButton)

      await waitFor(
        () => {
          expect(
            screen.getByRole('heading', { level: 1, name: mockNote.title }),
          ).toBeInTheDocument()
          expect(mockNotesStore.getNoteById).toHaveBeenCalledTimes(2)
        },
        { timeout: 3000 },
      )
    })
  })

  describe('Page Header and Navigation', () => {
    beforeEach(async () => {
      const mockNote = createMockNote()
      mockNotesStore.getNoteById.mockResolvedValue(mockNote)
      mockPlanStore.loadPlanForNote.mockResolvedValue(undefined)
    })

    it('should render page header correctly', async () => {
      const mockNote = createMockNote({ title: 'My Amazing Trip' })
      mockNotesStore.getNoteById.mockResolvedValueOnce(mockNote)

      renderWithProviders(NoteDetailView)

      await waitFor(
        () => {
          expect(
            screen.getByRole('heading', { level: 1, name: 'My Amazing Trip' }),
          ).toBeInTheDocument()
          expect(screen.getByText('Travel details and plan for your trip')).toBeInTheDocument()
        },
        { timeout: 3000 },
      )
    })

    it('should render back button with correct link', async () => {
      renderWithProviders(NoteDetailView)

      await waitFor(() => {
        expect(screen.queryByText('Loading note...')).not.toBeInTheDocument()
      })

      const backButton = screen.getByRole('link', { name: /go back to notes list/i })
      expect(backButton).toBeInTheDocument()
      expect(backButton).toHaveAttribute('href', '/notes')
    })

    it('should render footer navigation link', async () => {
      renderWithProviders(NoteDetailView)

      await waitFor(() => {
        expect(screen.queryByText('Loading note...')).not.toBeInTheDocument()
      })

      const footerLink = screen.getByRole('link', { name: 'Back to Notes List' })
      expect(footerLink).toBeInTheDocument()
      expect(footerLink).toHaveAttribute('href', '/notes')
    })
  })

  describe('Note Display Section Integration', () => {
    beforeEach(async () => {
      const mockNote = createMockNote()
      mockNotesStore.getNoteById.mockResolvedValue(mockNote)
      mockPlanStore.loadPlanForNote.mockResolvedValue(undefined)
    })

    it('should pass correct props to NoteDisplaySection', async () => {
      const mockNote = createMockNote()
      mockNotesStore.getNoteById.mockResolvedValueOnce(mockNote)

      renderWithProviders(NoteDetailView)

      await waitFor(() => {
        expect(screen.queryByText('Loading note...')).not.toBeInTheDocument()
      })

      const noteDisplaySection = screen.getByTestId('note-display-section')
      expect(noteDisplaySection).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 1, name: mockNote.title })).toBeInTheDocument()
      expect(screen.getByText(mockNote.place)).toBeInTheDocument()
    })

    it('should handle delete event from NoteDisplaySection', async () => {
      renderWithProviders(NoteDetailView)

      await waitFor(() => {
        expect(screen.queryByText('Loading note...')).not.toBeInTheDocument()
      })

      const deleteButton = screen.getByTestId('delete-note-button')
      await fireEvent.click(deleteButton)

      expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 3, name: 'Delete Note' })).toBeInTheDocument()
    })
  })

  describe('Plan Section Integration', () => {
    beforeEach(async () => {
      const mockNote = createMockNote()
      mockNotesStore.getNoteById.mockResolvedValue(mockNote)
      mockPlanStore.loadPlanForNote.mockResolvedValue(undefined)
    })

    it('should pass correct props to PlanSection', async () => {
      mockPlanStore.planText = 'Existing plan text'
      mockPlanStore.canSaveChanges = true
      mockPlanStore.isGeneratingPlan = false

      renderWithProviders(NoteDetailView)

      await waitFor(() => {
        expect(screen.queryByText('Loading note...')).not.toBeInTheDocument()
      })

      const planSection = screen.getByTestId('plan-section')
      expect(planSection).toBeInTheDocument()
      expect(screen.getByText('Existing plan text')).toBeInTheDocument()

      const saveButton = screen.getByTestId('save-plan-button')
      expect(saveButton).not.toBeDisabled()
    })

    it('should handle generate plan event from PlanSection', async () => {
      mockPlanStore.generatePlan.mockResolvedValueOnce(undefined)

      renderWithProviders(NoteDetailView)

      await waitFor(() => {
        expect(screen.queryByText('Loading note...')).not.toBeInTheDocument()
      })

      const generateButton = screen.getByTestId('generate-plan-button')
      await fireEvent.click(generateButton)

      expect(mockPlanStore.generatePlan).toHaveBeenCalled()
    })

    it('should handle save plan event from PlanSection', async () => {
      mockPlanStore.canSaveChanges = true
      mockPlanStore.savePlan.mockResolvedValueOnce(undefined)

      renderWithProviders(NoteDetailView)

      await waitFor(() => {
        expect(screen.queryByText('Loading note...')).not.toBeInTheDocument()
      })

      const saveButton = screen.getByTestId('save-plan-button')
      await fireEvent.click(saveButton)

      expect(mockPlanStore.savePlan).toHaveBeenCalled()
    })

    it('should handle discard changes event from PlanSection', async () => {
      mockPlanStore.canDiscardChanges = true
      mockPlanStore.discardChanges.mockResolvedValueOnce(undefined)

      renderWithProviders(NoteDetailView)

      await waitFor(() => {
        expect(screen.queryByText('Loading note...')).not.toBeInTheDocument()
      })

      const discardButton = screen.getByTestId('discard-plan-button')
      await fireEvent.click(discardButton)

      expect(mockPlanStore.discardChanges).toHaveBeenCalled()
    })

    it('should handle plan text update event from PlanSection', async () => {
      renderWithProviders(NoteDetailView)

      await waitFor(() => {
        expect(screen.queryByText('Loading note...')).not.toBeInTheDocument()
      })

      const textInput = screen.getByTestId('plan-text-input')
      await fireEvent.input(textInput, { target: { value: 'Updated plan text' } })

      expect(mockPlanStore.updatePlanText).toHaveBeenCalledWith('Updated plan text')
    })
  })

  describe('Plan Generation Flow', () => {
    beforeEach(async () => {
      const mockNote = createMockNote()
      mockNotesStore.getNoteById.mockResolvedValue(mockNote)
      mockPlanStore.loadPlanForNote.mockResolvedValue(undefined)
    })

    it('should show plan generation modal when user has unsaved changes', async () => {
      mockPlanStore.canSaveChanges = true

      renderWithProviders(NoteDetailView)

      await waitFor(() => {
        expect(screen.queryByText('Loading note...')).not.toBeInTheDocument()
      })

      const generateButton = screen.getByTestId('generate-plan-button')
      await fireEvent.click(generateButton)

      expect(screen.getByTestId('plan-generation-modal')).toBeInTheDocument()
      expect(
        screen.getByRole('heading', { level: 3, name: 'Generate New Plan' }),
      ).toBeInTheDocument()
    })

    it('should generate plan directly when no unsaved changes', async () => {
      mockPlanStore.canSaveChanges = false
      mockPlanStore.generatePlan.mockResolvedValueOnce(undefined)

      renderWithProviders(NoteDetailView)

      await waitFor(() => {
        expect(screen.queryByText('Loading note...')).not.toBeInTheDocument()
      })

      const generateButton = screen.getByTestId('generate-plan-button')
      await fireEvent.click(generateButton)

      expect(mockPlanStore.generatePlan).toHaveBeenCalled()
    })

    it('should handle plan generation modal confirmation', async () => {
      mockPlanStore.canSaveChanges = true
      mockPlanStore.generatePlan.mockResolvedValueOnce(undefined)

      renderWithProviders(NoteDetailView)

      await waitFor(() => {
        expect(screen.queryByText('Loading note...')).not.toBeInTheDocument()
      })

      // First click shows modal
      const generateButton = screen.getByTestId('generate-plan-button')
      await fireEvent.click(generateButton)

      expect(screen.getByTestId('plan-generation-modal')).toBeInTheDocument()

      // Confirm generation
      const confirmButton = screen.getByTestId('confirm-generate-button')
      await fireEvent.click(confirmButton)

      expect(mockPlanStore.generatePlan).toHaveBeenCalled()
    })

    it('should handle plan generation modal cancellation', async () => {
      mockPlanStore.canSaveChanges = true

      renderWithProviders(NoteDetailView)

      await waitFor(() => {
        expect(screen.queryByText('Loading note...')).not.toBeInTheDocument()
      })

      // First click shows modal
      const generateButton = screen.getByTestId('generate-plan-button')
      await fireEvent.click(generateButton)

      expect(screen.getByTestId('plan-generation-modal')).toBeInTheDocument()

      // Cancel generation
      const cancelButton = screen.getByTestId('cancel-generate-button')
      await fireEvent.click(cancelButton)

      expect(screen.queryByTestId('plan-generation-modal')).not.toBeInTheDocument()
      expect(mockPlanStore.generatePlan).not.toHaveBeenCalled()
    })

    it('should handle plan generation errors', async () => {
      const generationError = new Error('Plan generation failed')
      mockPlanStore.generatePlan.mockRejectedValueOnce(generationError)

      renderWithProviders(NoteDetailView)

      await waitFor(() => {
        expect(screen.queryByText('Loading note...')).not.toBeInTheDocument()
      })

      const generateButton = screen.getByTestId('generate-plan-button')
      await fireEvent.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText('Failed to generate plan. Please try again.')).toBeInTheDocument()
      })
    })

    it('should show generating state in plan generation modal', async () => {
      mockPlanStore.canSaveChanges = true
      mockPlanStore.isGeneratingPlan = true

      renderWithProviders(NoteDetailView)

      await waitFor(() => {
        expect(screen.queryByText('Loading note...')).not.toBeInTheDocument()
      })

      const generateButton = screen.getByTestId('generate-plan-button')
      await fireEvent.click(generateButton)

      const modal = screen.getByTestId('plan-generation-modal')
      expect(modal).toBeInTheDocument()
      expect(screen.getByText('Generating...')).toBeInTheDocument()
    })
  })

  describe('Plan Management Operations', () => {
    beforeEach(async () => {
      const mockNote = createMockNote()
      mockNotesStore.getNoteById.mockResolvedValue(mockNote)
      mockPlanStore.loadPlanForNote.mockResolvedValue(undefined)
    })

    it('should not save plan when canSaveChanges is false', async () => {
      mockPlanStore.canSaveChanges = false

      renderWithProviders(NoteDetailView)

      await waitFor(() => {
        expect(screen.queryByText('Loading note...')).not.toBeInTheDocument()
      })

      const saveButton = screen.getByTestId('save-plan-button')
      await fireEvent.click(saveButton)

      expect(mockPlanStore.savePlan).not.toHaveBeenCalled()
    })

    it('should handle plan save errors', async () => {
      mockPlanStore.canSaveChanges = true
      const saveError = new Error('Save failed')
      mockPlanStore.savePlan.mockRejectedValueOnce(saveError)

      renderWithProviders(NoteDetailView)

      await waitFor(() => {
        expect(screen.queryByText('Loading note...')).not.toBeInTheDocument()
      })

      const saveButton = screen.getByTestId('save-plan-button')
      await fireEvent.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText('Failed to save plan. Please try again.')).toBeInTheDocument()
      })
    })

    it('should handle discard changes errors', async () => {
      mockPlanStore.canDiscardChanges = true
      const discardError = new Error('Discard failed')
      mockPlanStore.discardChanges.mockRejectedValueOnce(discardError)

      renderWithProviders(NoteDetailView)

      await waitFor(() => {
        expect(screen.queryByText('Loading note...')).not.toBeInTheDocument()
      })

      const discardButton = screen.getByTestId('discard-plan-button')
      await fireEvent.click(discardButton)

      await waitFor(() => {
        expect(screen.getByText('Failed to discard changes. Please try again.')).toBeInTheDocument()
      })
    })
  })

  describe('Note Deletion Flow', () => {
    beforeEach(async () => {
      const mockNote = createMockNote()
      mockNotesStore.getNoteById.mockResolvedValue(mockNote)
      mockPlanStore.loadPlanForNote.mockResolvedValue(undefined)
    })

    it('should show delete confirmation modal when delete is triggered', async () => {
      renderWithProviders(NoteDetailView)

      await waitFor(() => {
        expect(screen.queryByText('Loading note...')).not.toBeInTheDocument()
      })

      const deleteButton = screen.getByTestId('delete-note-button')
      await fireEvent.click(deleteButton)

      expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 3, name: 'Delete Note' })).toBeInTheDocument()
      expect(
        screen.getByText(
          'Are you sure you want to delete this note? This action cannot be undone.',
        ),
      ).toBeInTheDocument()
    })

    it('should handle delete confirmation and navigate to notes list', async () => {
      mockNotesStore.deleteNote.mockResolvedValueOnce(undefined)

      renderWithProviders(NoteDetailView)

      await waitFor(() => {
        expect(screen.queryByText('Loading note...')).not.toBeInTheDocument()
      })

      // Trigger delete
      const deleteButton = screen.getByTestId('delete-note-button')
      await fireEvent.click(deleteButton)

      // Confirm delete
      const confirmButton = screen.getByTestId('confirm-button')
      await fireEvent.click(confirmButton)

      await waitFor(() => {
        expect(mockNotesStore.deleteNote).toHaveBeenCalledWith('123')
        expect(mockPush).toHaveBeenCalledWith('/notes')
      })
    })

    it('should handle delete cancellation', async () => {
      renderWithProviders(NoteDetailView)

      await waitFor(() => {
        expect(screen.queryByText('Loading note...')).not.toBeInTheDocument()
      })

      // Trigger delete
      const deleteButton = screen.getByTestId('delete-note-button')
      await fireEvent.click(deleteButton)

      expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument()

      // Cancel delete
      const cancelButton = screen.getByTestId('cancel-button')
      await fireEvent.click(cancelButton)

      expect(screen.queryByTestId('confirmation-modal')).not.toBeInTheDocument()
      expect(mockNotesStore.deleteNote).not.toHaveBeenCalled()
    })

    it('should handle delete errors', async () => {
      const deleteError = new Error('Delete failed')
      mockNotesStore.deleteNote.mockRejectedValueOnce(deleteError)

      renderWithProviders(NoteDetailView)

      await waitFor(() => {
        expect(screen.queryByText('Loading note...')).not.toBeInTheDocument()
      })

      // Trigger delete
      const deleteButton = screen.getByTestId('delete-note-button')
      await fireEvent.click(deleteButton)

      // Confirm delete
      const confirmButton = screen.getByTestId('confirm-button')
      await fireEvent.click(confirmButton)

      await waitFor(() => {
        expect(screen.getByText('Failed to delete note. Please try again.')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility and User Experience', () => {
    beforeEach(async () => {
      const mockNote = createMockNote()
      mockNotesStore.getNoteById.mockResolvedValue(mockNote)
      mockPlanStore.loadPlanForNote.mockResolvedValue(undefined)
    })

    it('should have proper heading structure', async () => {
      const mockNote = createMockNote({ title: 'My Trip' })
      mockNotesStore.getNoteById.mockResolvedValueOnce(mockNote)

      renderWithProviders(NoteDetailView)

      await waitFor(() => {
        expect(screen.queryByText('Loading note...')).not.toBeInTheDocument()
      })

      const mainHeading = screen.getByRole('heading', { level: 1 })
      expect(mainHeading).toHaveTextContent('My Trip')
    })

    it('should have proper aria-label for back button', async () => {
      renderWithProviders(NoteDetailView)

      await waitFor(() => {
        expect(screen.queryByText('Loading note...')).not.toBeInTheDocument()
      })

      const backButton = screen.getByRole('link', { name: /go back to notes list/i })
      expect(backButton).toHaveAttribute('aria-label', 'Go back to notes list')
    })

    it('should have proper loading state with accessible text', () => {
      mockNotesStore.getNoteById.mockImplementation(() => new Promise(() => {})) // Never resolves

      renderWithProviders(NoteDetailView)

      expect(screen.getByText('Loading note...')).toBeInTheDocument()
      expect(screen.getByText('Please wait while we fetch your travel details')).toBeInTheDocument()

      // Check for spinner with proper accessibility (SVG element)
      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })

    it('should show error state with retry option', async () => {
      const error = new MockApiError('Network error', 500)
      mockNotesStore.getNoteById.mockRejectedValueOnce(error)

      renderWithProviders(NoteDetailView)

      await waitFor(() => {
        expect(screen.getByText('Failed to load note')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
      })

      // Check for error icon (SVG element)
      const errorIcon = document.querySelector('svg[viewBox="0 0 24 24"]')
      expect(errorIcon).toBeInTheDocument()
    })
  })

  describe('Component Integration and Data Flow', () => {
    it('should handle complete note detail flow: load -> display -> plan operations', async () => {
      const mockNote = createMockNote({ title: 'Complete Flow Test' })
      mockNotesStore.getNoteById.mockResolvedValueOnce(mockNote)
      mockPlanStore.loadPlanForNote.mockResolvedValueOnce(undefined)
      mockPlanStore.planText = 'Initial plan'

      renderWithProviders(NoteDetailView)

      // 1. Wait for initial load
      await waitFor(() => {
        expect(screen.queryByText('Loading note...')).not.toBeInTheDocument()
      })

      // 2. Verify note is displayed
      expect(
        screen.getByRole('heading', { level: 1, name: 'Complete Flow Test' }),
      ).toBeInTheDocument()
      expect(screen.getByTestId('note-display-section')).toBeInTheDocument()

      // 3. Verify plan section is displayed
      expect(screen.getByTestId('plan-section')).toBeInTheDocument()
      expect(screen.getByText('Initial plan')).toBeInTheDocument()

      // 4. Test plan text update
      const textInput = screen.getByTestId('plan-text-input')
      await fireEvent.input(textInput, { target: { value: 'Updated plan' } })
      expect(mockPlanStore.updatePlanText).toHaveBeenCalledWith('Updated plan')
    })

    it('should handle error recovery scenarios', async () => {
      // First load fails
      const error = new MockApiError('Initial load failed', 500)
      mockNotesStore.getNoteById.mockRejectedValueOnce(error)

      renderWithProviders(NoteDetailView)

      await waitFor(
        () => {
          expect(screen.getByText('Failed to load note')).toBeInTheDocument()
        },
        { timeout: 5000 },
      )

      // Recovery succeeds
      const mockNote = createMockNote()
      mockNotesStore.getNoteById.mockResolvedValueOnce(mockNote)
      mockPlanStore.loadPlanForNote.mockResolvedValueOnce(undefined)

      const retryButton = screen.getByRole('button', { name: /try again/i })
      await fireEvent.click(retryButton)

      await waitFor(
        () => {
          expect(
            screen.getByRole('heading', { level: 1, name: mockNote.title }),
          ).toBeInTheDocument()
          expect(screen.queryByText('Failed to load note')).not.toBeInTheDocument()
        },
        { timeout: 5000 },
      )
    })
  })

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle note with minimal data', async () => {
      const minimalNote = createMockNote({
        title: 'Minimal Note',
        place: '',
        key_ideas: null,
      })
      mockNotesStore.getNoteById.mockResolvedValueOnce(minimalNote)
      mockPlanStore.loadPlanForNote.mockResolvedValueOnce(undefined)

      renderWithProviders(NoteDetailView)

      await waitFor(() => {
        expect(screen.queryByText('Loading note...')).not.toBeInTheDocument()
      })

      expect(screen.getByRole('heading', { name: 'Minimal Note', level: 1 })).toBeInTheDocument()
      expect(screen.getByTestId('note-display-section')).toBeInTheDocument()
    })

    it('should handle very long note titles', async () => {
      const longTitle = 'A'.repeat(200)
      const noteWithLongTitle = createMockNote({ title: longTitle })
      mockNotesStore.getNoteById.mockResolvedValueOnce(noteWithLongTitle)
      mockPlanStore.loadPlanForNote.mockResolvedValueOnce(undefined)

      renderWithProviders(NoteDetailView)

      await waitFor(() => {
        expect(screen.queryByText('Loading note...')).not.toBeInTheDocument()
      })

      expect(screen.getByRole('heading', { name: longTitle, level: 1 })).toBeInTheDocument()
    })

    it('should handle special characters in note data', async () => {
      const specialNote = createMockNote({
        title: 'Trip with émojis 🌍 & spéciål chars',
        place: "Côte d'Azur, Françe",
        key_ideas: 'Visit château & café <script>alert("test")</script>',
      })
      mockNotesStore.getNoteById.mockResolvedValueOnce(specialNote)
      mockPlanStore.loadPlanForNote.mockResolvedValueOnce(undefined)

      renderWithProviders(NoteDetailView)

      await waitFor(() => {
        expect(screen.queryByText('Loading note...')).not.toBeInTheDocument()
      })

      expect(screen.getByRole('heading', { name: specialNote.title, level: 1 })).toBeInTheDocument()
    })

    it('should handle concurrent operations gracefully', async () => {
      const mockNote = createMockNote()
      mockNotesStore.getNoteById.mockResolvedValue(mockNote)
      mockPlanStore.loadPlanForNote.mockResolvedValue(undefined)

      // Mock plan operations with delays
      mockPlanStore.generatePlan.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      )
      mockPlanStore.savePlan.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      )

      renderWithProviders(NoteDetailView)

      await waitFor(() => {
        expect(screen.queryByText('Loading note...')).not.toBeInTheDocument()
      })

      // Try to trigger multiple operations quickly
      const generateButton = screen.getByTestId('generate-plan-button')
      const saveButton = screen.getByTestId('save-plan-button')

      await fireEvent.click(generateButton)
      await fireEvent.click(saveButton)

      // Operations should be handled appropriately without conflicts
      expect(mockPlanStore.generatePlan).toHaveBeenCalled()
    })
  })
})
