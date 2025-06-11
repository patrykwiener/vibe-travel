import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/vue'
import { renderWithProviders } from '@/test/utils'
import NoteForm from '@/components/forms/NoteForm.vue'
import type { NoteCreateInSchema } from '@/client/types.gen'

// Helper to create mock note data
const createMockNoteData = (overrides: Partial<NoteCreateInSchema> = {}): NoteCreateInSchema => ({
  title: 'Test Trip',
  place: 'Paris, France',
  date_from: '2025-07-01',
  date_to: '2025-07-07',
  number_of_people: 2,
  key_ideas: 'Visit Eiffel Tower, Louvre Museum',
  ...overrides,
})

// Get today's date in YYYY-MM-DD format
const getTodayString = () => {
  return new Date().toISOString().split('T')[0]
}

// Get date string days from today
const getDateString = (daysFromToday: number) => {
  const date = new Date()
  date.setDate(date.getDate() + daysFromToday)
  return date.toISOString().split('T')[0]
}

describe('NoteForm - Core Functionality', () => {
  beforeEach(() => {
    // Mock Date.now for consistent testing
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-06-11'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Component Rendering', () => {
    it('should render all form fields with correct labels', () => {
      renderWithProviders(NoteForm)

      // Check required field labels with asterisks
      expect(screen.getByLabelText(/title.*\*/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/destination.*\*/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/start date.*\*/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/end date.*\*/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/number of travelers.*\*/i)).toBeInTheDocument()

      // Check optional field
      expect(screen.getByLabelText(/key ideas & activities/i)).toBeInTheDocument()
    })

    it('should render form action buttons correctly', () => {
      renderWithProviders(NoteForm, {
        props: { isEditing: false },
      })

      expect(screen.getByRole('button', { name: /create note/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('should show loading state when submitting', () => {
      renderWithProviders(NoteForm, {
        props: { isSubmitting: true, isEditing: false },
      })

      expect(screen.getByText(/creating\.\.\./i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /creating\.\.\./i })).toBeDisabled()
    })
  })

  describe('Props and Initial Data', () => {
    it('should populate form fields with initial data when provided', () => {
      const initialData = createMockNoteData()

      renderWithProviders(NoteForm, {
        props: { initialData },
      })

      expect(screen.getByDisplayValue(initialData.title)).toBeInTheDocument()
      expect(screen.getByDisplayValue(initialData.place)).toBeInTheDocument()
      expect(screen.getByDisplayValue(initialData.date_from)).toBeInTheDocument()
      expect(screen.getByDisplayValue(initialData.date_to)).toBeInTheDocument()
      expect(screen.getByDisplayValue(initialData.number_of_people.toString())).toBeInTheDocument()
      expect(screen.getByDisplayValue(initialData.key_ideas!)).toBeInTheDocument()
    })

    it('should handle empty initial data gracefully', () => {
      renderWithProviders(NoteForm, {
        props: { initialData: {} },
      })

      const titleInput = screen.getByLabelText(/title.*\*/i) as HTMLInputElement
      const placeInput = screen.getByLabelText(/destination.*\*/i) as HTMLInputElement
      const peopleInput = screen.getByLabelText(/number of travelers.*\*/i) as HTMLInputElement

      expect(titleInput.value).toBe('')
      expect(placeInput.value).toBe('')
      expect(peopleInput.value).toBe('1')
    })
  })

  describe('Basic Field Validation', () => {
    it('should show error for empty required fields on blur', async () => {
      renderWithProviders(NoteForm)

      const titleInput = screen.getByLabelText(/title.*\*/i)
      await fireEvent.focus(titleInput)
      await fireEvent.blur(titleInput)

      await waitFor(
        () => {
          expect(screen.getByText('Title is required')).toBeInTheDocument()
        },
        { timeout: 2000 },
      )
    })

    it('should accept valid input values', async () => {
      renderWithProviders(NoteForm)

      const titleInput = screen.getByLabelText(/title.*\*/i)
      await fireEvent.input(titleInput, { target: { value: 'Valid Trip Title' } })

      expect((titleInput as HTMLInputElement).value).toBe('Valid Trip Title')
    })

    it('should show error for number of people less than 1', async () => {
      renderWithProviders(NoteForm)

      const peopleInput = screen.getByLabelText(/number of travelers.*\*/i)
      await fireEvent.input(peopleInput, { target: { value: '0' } })
      await fireEvent.blur(peopleInput)

      await waitFor(
        () => {
          expect(screen.getByText('Number of people must be at least 1')).toBeInTheDocument()
        },
        { timeout: 2000 },
      )
    })

    it('should show error for number of people greater than 20', async () => {
      renderWithProviders(NoteForm)

      const peopleInput = screen.getByLabelText(/number of travelers.*\*/i)
      await fireEvent.input(peopleInput, { target: { value: '25' } })
      await fireEvent.blur(peopleInput)

      await waitFor(
        () => {
          expect(screen.getByText('Number of people cannot exceed 20')).toBeInTheDocument()
        },
        { timeout: 2000 },
      )
    })

    it('should show error for key ideas exceeding 2000 characters', async () => {
      renderWithProviders(NoteForm)

      const keyIdeasInput = screen.getByLabelText(/key ideas & activities/i)
      const longText = 'A'.repeat(2001)
      await fireEvent.input(keyIdeasInput, { target: { value: longText } })
      await fireEvent.blur(keyIdeasInput)

      await waitFor(
        () => {
          expect(screen.getByText('Key ideas must not exceed 2000 characters')).toBeInTheDocument()
        },
        { timeout: 2000 },
      )
    })

    it('should show title too short error for titles less than 3 characters', async () => {
      renderWithProviders(NoteForm)

      const titleInput = screen.getByLabelText(/title.*\*/i)

      await fireEvent.input(titleInput, { target: { value: 'Ab' } })
      await fireEvent.blur(titleInput)

      await waitFor(
        () => {
          expect(screen.getByText('Title must be at least 3 characters')).toBeInTheDocument()
        },
        { timeout: 2000 },
      )
    })

    it('should show title too long error for titles over 255 characters', async () => {
      renderWithProviders(NoteForm)

      const titleInput = screen.getByLabelText(/title.*\*/i)
      const longTitle = 'A'.repeat(256) // 256 characters

      await fireEvent.input(titleInput, { target: { value: longTitle } })
      await fireEvent.blur(titleInput)

      await waitFor(
        () => {
          expect(screen.getByText('Title must not exceed 255 characters')).toBeInTheDocument()
        },
        { timeout: 2000 },
      )
    })

    it('should show place too short error for destinations less than 3 characters', async () => {
      renderWithProviders(NoteForm)

      const placeInput = screen.getByLabelText(/destination.*\*/i)

      await fireEvent.input(placeInput, { target: { value: 'NY' } })
      await fireEvent.blur(placeInput)

      await waitFor(
        () => {
          expect(screen.getByText('Destination must be at least 3 characters')).toBeInTheDocument()
        },
        { timeout: 2000 },
      )
    })

    it('should show place too long error for destinations over 255 characters', async () => {
      renderWithProviders(NoteForm)

      const placeInput = screen.getByLabelText(/destination.*\*/i)
      const longPlace = 'B'.repeat(256) // 256 characters

      await fireEvent.input(placeInput, { target: { value: longPlace } })
      await fireEvent.blur(placeInput)

      await waitFor(
        () => {
          expect(screen.getByText('Destination must not exceed 255 characters')).toBeInTheDocument()
        },
        { timeout: 2000 },
      )
    })

    it('should show past date error when start date is in the past', async () => {
      renderWithProviders(NoteForm)

      const dateFromInput = screen.getByLabelText(/start date.*\*/i)
      const pastDate = '2020-01-01'

      await fireEvent.input(dateFromInput, { target: { value: pastDate } })
      await fireEvent.blur(dateFromInput)

      await waitFor(
        () => {
          expect(screen.getByText('Start date cannot be in the past')).toBeInTheDocument()
        },
        { timeout: 2000 },
      )
    })
  })

  describe('Date Constraints', () => {
    it('should set correct min and max dates for date inputs', () => {
      renderWithProviders(NoteForm)

      const startDateInput = screen.getByLabelText(/start date.*\*/i)
      const endDateInput = screen.getByLabelText(/end date.*\*/i)

      expect(startDateInput).toHaveAttribute('min', getTodayString())
      expect(endDateInput).toHaveAttribute('min', getTodayString())
    })

    it('should show error when trip duration exceeds 14 days', async () => {
      renderWithProviders(NoteForm)

      const startDateInput = screen.getByLabelText(/start date.*\*/i)
      const endDateInput = screen.getByLabelText(/end date.*\*/i)

      const startDate = getDateString(1)
      const endDate = getDateString(16) // 15 days later, which exceeds 14 days

      await fireEvent.input(startDateInput, { target: { value: startDate } })
      await fireEvent.input(endDateInput, { target: { value: endDate } })
      await fireEvent.blur(endDateInput)

      await waitFor(
        () => {
          expect(screen.getByText('Trip duration cannot exceed 14 days')).toBeInTheDocument()
        },
        { timeout: 2000 },
      )
    })
  })

  describe('Form Validation State', () => {
    it('should disable submit button initially when form is empty', () => {
      renderWithProviders(NoteForm)

      const submitButton = screen.getByRole('button', { name: /create note/i })
      expect(submitButton).toBeDisabled()
    })

    it('should disable submit button when isSubmitting is true', () => {
      renderWithProviders(NoteForm, {
        props: { isSubmitting: true },
      })

      const submitButton = screen.getByRole('button', { name: /creating\.\.\./i })
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Event Emissions', () => {
    it('should emit cancel event when cancel button is clicked', async () => {
      const { emitted } = renderWithProviders(NoteForm)

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await fireEvent.click(cancelButton)

      expect(emitted().cancel).toBeTruthy()
      expect(emitted().cancel).toHaveLength(1)
    })

    it('should emit change event on input', async () => {
      const { emitted } = renderWithProviders(NoteForm)

      const titleInput = screen.getByLabelText(/title.*\*/i)
      await fireEvent.input(titleInput, { target: { value: 'Test' } })

      await waitFor(
        () => {
          expect(emitted().change).toBeTruthy()
        },
        { timeout: 1000 },
      )
    })

    it('should emit submit event with valid form data', async () => {
      const { emitted } = renderWithProviders(NoteForm)

      const validData = createMockNoteData({
        date_from: getDateString(1),
        date_to: getDateString(7),
      })

      // Fill form with valid data using fireEvent.input (faster than user.type)
      await fireEvent.input(screen.getByLabelText(/title.*\*/i), {
        target: { value: validData.title },
      })
      await fireEvent.input(screen.getByLabelText(/destination.*\*/i), {
        target: { value: validData.place },
      })
      await fireEvent.input(screen.getByLabelText(/start date.*\*/i), {
        target: { value: validData.date_from },
      })
      await fireEvent.input(screen.getByLabelText(/end date.*\*/i), {
        target: { value: validData.date_to },
      })
      await fireEvent.input(screen.getByLabelText(/number of travelers.*\*/i), {
        target: { value: validData.number_of_people.toString() },
      })
      await fireEvent.input(screen.getByLabelText(/key ideas & activities/i), {
        target: { value: validData.key_ideas! },
      })

      const form = document.querySelector('form')!
      await fireEvent.submit(form)

      await waitFor(
        () => {
          expect(emitted().submit).toBeTruthy()
          expect(emitted().submit).toHaveLength(1)

          const emittedEvents = emitted().submit as unknown[][]
          const submittedData = emittedEvents[0][0] as NoteCreateInSchema
          expect(submittedData.title).toBe(validData.title)
          expect(submittedData.place).toBe(validData.place)
        },
        { timeout: 3000 },
      )
    })

    it('should not emit submit event when form validation fails', async () => {
      const { emitted } = renderWithProviders(NoteForm)

      // Submit form with invalid data (empty fields)
      const form = document.querySelector('form')!
      await fireEvent.submit(form)

      await waitFor(
        () => {
          // Should show validation errors instead of emitting submit
          expect(screen.getByText('Title is required')).toBeInTheDocument()
          expect(emitted().submit).toBeFalsy()
        },
        { timeout: 2000 },
      )
    })
  })

  describe('Accessibility', () => {
    it('should have proper form structure', () => {
      renderWithProviders(NoteForm)

      const form = document.querySelector('form')
      expect(form).toBeInTheDocument()
    })

    it('should have proper label associations', () => {
      renderWithProviders(NoteForm)

      expect(screen.getByLabelText(/title.*\*/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/destination.*\*/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/start date.*\*/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/end date.*\*/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/number of travelers.*\*/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/key ideas & activities/i)).toBeInTheDocument()
    })

    it('should have required attributes on required fields', () => {
      renderWithProviders(NoteForm)

      expect(screen.getByLabelText(/title.*\*/i)).toHaveAttribute('required')
      expect(screen.getByLabelText(/destination.*\*/i)).toHaveAttribute('required')
      expect(screen.getByLabelText(/start date.*\*/i)).toHaveAttribute('required')
      expect(screen.getByLabelText(/end date.*\*/i)).toHaveAttribute('required')
      expect(screen.getByLabelText(/number of travelers.*\*/i)).toHaveAttribute('required')
      expect(screen.getByLabelText(/key ideas & activities/i)).not.toHaveAttribute('required')
    })
  })

  describe('Data Types and Schema Compliance', () => {
    it('should emit data with correct types', async () => {
      const { emitted } = renderWithProviders(NoteForm, {
        props: { isEditing: false },
      })

      const validData = createMockNoteData({
        date_from: getDateString(1),
        date_to: getDateString(7),
      })

      // Fill form with valid data
      await fireEvent.input(screen.getByLabelText(/title.*\*/i), {
        target: { value: validData.title },
      })
      await fireEvent.input(screen.getByLabelText(/destination.*\*/i), {
        target: { value: validData.place },
      })
      await fireEvent.input(screen.getByLabelText(/start date.*\*/i), {
        target: { value: validData.date_from },
      })
      await fireEvent.input(screen.getByLabelText(/end date.*\*/i), {
        target: { value: validData.date_to },
      })
      await fireEvent.input(screen.getByLabelText(/number of travelers.*\*/i), {
        target: { value: validData.number_of_people.toString() },
      })

      const form = document.querySelector('form')!
      await fireEvent.submit(form)

      await waitFor(
        () => {
          expect(emitted().submit).toBeTruthy()
          const submitEvents = emitted().submit as unknown[][]
          const submittedData = submitEvents[0][0] as any

          expect(typeof submittedData.title).toBe('string')
          expect(typeof submittedData.place).toBe('string')
          expect(typeof submittedData.date_from).toBe('string')
          expect(typeof submittedData.date_to).toBe('string')
          expect(typeof submittedData.number_of_people).toBe('number')
        },
        { timeout: 3000 },
      )
    })
  })

  describe('Reactive Watchers', () => {
    it('should trigger date validation when start date changes and end date exists', async () => {
      renderWithProviders(NoteForm)

      const startDateInput = screen.getByLabelText(/start date.*\*/i)
      const endDateInput = screen.getByLabelText(/end date.*\*/i)

      // First set an end date
      const endDate = getDateString(5)
      await fireEvent.input(endDateInput, { target: { value: endDate } })

      // Then set a start date that would make the trip too long
      const startDate = getDateString(20) // 20 days from today, making end date in the past relative to start
      await fireEvent.input(startDateInput, { target: { value: startDate } })

      await waitFor(
        () => {
          expect(screen.getByText('End date must be after start date')).toBeInTheDocument()
        },
        { timeout: 2000 },
      )
    })

    it('should trigger date validation when end date changes and start date exists', async () => {
      renderWithProviders(NoteForm)

      const startDateInput = screen.getByLabelText(/start date.*\*/i)
      const endDateInput = screen.getByLabelText(/end date.*\*/i)

      // First set a start date
      const startDate = getDateString(1)
      await fireEvent.input(startDateInput, { target: { value: startDate } })

      // Then set an end date that would exceed 14 days
      const endDate = getDateString(16) // 15 days later
      await fireEvent.input(endDateInput, { target: { value: endDate } })

      await waitFor(
        () => {
          expect(screen.getByText('Trip duration cannot exceed 14 days')).toBeInTheDocument()
        },
        { timeout: 2000 },
      )
    })
  })

  describe('Editing Mode', () => {
    it('should show correct text for editing mode', () => {
      renderWithProviders(NoteForm, {
        props: { isEditing: true },
      })

      expect(screen.getByText('Save Changes')).toBeInTheDocument()
    })

    it('should show correct loading text for editing mode', () => {
      renderWithProviders(NoteForm, {
        props: { isEditing: true, isSubmitting: true },
      })

      expect(screen.getByText('Saving...')).toBeInTheDocument()
    })
  })
})
