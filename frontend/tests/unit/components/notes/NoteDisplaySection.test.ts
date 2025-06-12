import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/vue'
import { renderWithProviders } from '@tests/utils'
import NoteDisplaySection from '@/components/notes/NoteDisplaySection.vue'
import type { NoteOutSchema } from '@/client/types.gen'

// Helper to create mock note data
const createMockNoteData = (overrides: Partial<NoteOutSchema> = {}): NoteOutSchema => ({
  id: 1,
  user_id: 'user-123',
  title: 'Amazing Trip to Tokyo',
  place: 'Tokyo, Japan',
  date_from: '2025-07-10',
  date_to: '2025-07-15',
  number_of_people: 2,
  key_ideas: 'Visit Tokyo Tower, Explore Shibuya, Try authentic ramen',
  created_at: '2025-06-01T10:00:00Z',
  updated_at: '2025-06-01T10:00:00Z',
  ...overrides,
})

// Mock Vue Router
const mockPush = vi.fn()
vi.mock('vue-router', async (importOriginal) => {
  const actual = (await importOriginal()) as any
  return {
    ...actual,
    useRouter: () => ({
      push: mockPush,
    }),
  }
})

describe('NoteDisplaySection - Core Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render trip details header', () => {
      const mockNote = createMockNoteData()
      renderWithProviders(NoteDisplaySection, {
        props: { note: mockNote, noteId: '123' },
      })

      expect(screen.getByText('Trip Details')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /trip details/i })).toBeInTheDocument()
    })

    it('should render action buttons', () => {
      const mockNote = createMockNoteData()
      renderWithProviders(NoteDisplaySection, {
        props: { note: mockNote, noteId: '123' },
      })

      expect(screen.getByRole('link', { name: /edit note/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /delete note/i })).toBeInTheDocument()
    })

    it('should render all trip information cards', () => {
      const mockNote = createMockNoteData()
      renderWithProviders(NoteDisplaySection, {
        props: { note: mockNote, noteId: '123' },
      })

      // Check card labels
      expect(screen.getByText('Destination')).toBeInTheDocument()
      expect(screen.getByText('Dates')).toBeInTheDocument()
      expect(screen.getByText('Duration')).toBeInTheDocument()
      expect(screen.getByText('Travelers')).toBeInTheDocument()
    })

    it('should render key ideas section', () => {
      const mockNote = createMockNoteData()
      renderWithProviders(NoteDisplaySection, {
        props: { note: mockNote, noteId: '123' },
      })

      expect(screen.getByText('Key Ideas')).toBeInTheDocument()
    })
  })

  describe('Trip Information Display', () => {
    it('should display destination correctly', () => {
      const mockNote = createMockNoteData({ place: 'Paris, France' })
      renderWithProviders(NoteDisplaySection, {
        props: { note: mockNote, noteId: '123' },
      })

      expect(screen.getByText('Paris, France')).toBeInTheDocument()
    })

    it('should display number of travelers correctly', () => {
      const mockNote = createMockNoteData({ number_of_people: 4 })
      renderWithProviders(NoteDisplaySection, {
        props: { note: mockNote, noteId: '123' },
      })

      expect(screen.getByText('4')).toBeInTheDocument()
    })

    it('should handle single traveler correctly', () => {
      const mockNote = createMockNoteData({ number_of_people: 1 })
      renderWithProviders(NoteDisplaySection, {
        props: { note: mockNote, noteId: '123' },
      })

      expect(screen.getByText('1')).toBeInTheDocument()
    })

    it('should handle zero travelers gracefully', () => {
      const mockNote = createMockNoteData({ number_of_people: 0 })
      renderWithProviders(NoteDisplaySection, {
        props: { note: mockNote, noteId: '123' },
      })

      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('should handle large number of travelers', () => {
      const mockNote = createMockNoteData({ number_of_people: 20 })
      renderWithProviders(NoteDisplaySection, {
        props: { note: mockNote, noteId: '123' },
      })

      expect(screen.getByText('20')).toBeInTheDocument()
    })
  })

  describe('Date Formatting', () => {
    it('should format date range in same month correctly', () => {
      const mockNote = createMockNoteData({
        date_from: '2025-07-10',
        date_to: '2025-07-15',
      })
      renderWithProviders(NoteDisplaySection, {
        props: { note: mockNote, noteId: '123' },
      })

      expect(screen.getByText('Jul 10, 2025 - Jul 15, 2025')).toBeInTheDocument()
    })

    it('should format date range across different months correctly', () => {
      const mockNote = createMockNoteData({
        date_from: '2025-06-25',
        date_to: '2025-07-05',
      })
      renderWithProviders(NoteDisplaySection, {
        props: { note: mockNote, noteId: '123' },
      })

      expect(screen.getByText('Jun 25, 2025 - Jul 5, 2025')).toBeInTheDocument()
    })

    it('should format date range across different years correctly', () => {
      const mockNote = createMockNoteData({
        date_from: '2024-12-28',
        date_to: '2025-01-03',
      })
      renderWithProviders(NoteDisplaySection, {
        props: { note: mockNote, noteId: '123' },
      })

      expect(screen.getByText('Dec 28, 2024 - Jan 3, 2025')).toBeInTheDocument()
    })

    it('should format single day trip correctly', () => {
      const mockNote = createMockNoteData({
        date_from: '2025-07-15',
        date_to: '2025-07-15',
      })
      renderWithProviders(NoteDisplaySection, {
        props: { note: mockNote, noteId: '123' },
      })

      expect(screen.getByText('Jul 15, 2025')).toBeInTheDocument()
    })

    it('should handle ISO date strings correctly', () => {
      const mockNote = createMockNoteData({
        date_from: '2025-07-01T10:00:00Z',
        date_to: '2025-07-07T18:00:00Z',
      })
      renderWithProviders(NoteDisplaySection, {
        props: { note: mockNote, noteId: '123' },
      })

      // Should ignore time component and format as dates
      expect(screen.getByText('Jul 1, 2025 - Jul 7, 2025')).toBeInTheDocument()
    })
  })

  describe('Duration Calculation', () => {
    it('should calculate single day duration correctly', () => {
      const mockNote = createMockNoteData({
        date_from: '2025-07-15',
        date_to: '2025-07-15',
      })
      renderWithProviders(NoteDisplaySection, {
        props: { note: mockNote, noteId: '123' },
      })

      // For same date, Math.ceil(0) = 0, but component shows 0 days
      expect(screen.getByText('0 days')).toBeInTheDocument()
    })

    it('should calculate multi-day duration correctly', () => {
      const mockNote = createMockNoteData({
        date_from: '2025-07-10',
        date_to: '2025-07-15',
      })
      renderWithProviders(NoteDisplaySection, {
        props: { note: mockNote, noteId: '123' },
      })

      expect(screen.getByText('5 days')).toBeInTheDocument()
    })

    it('should calculate week-long trip duration correctly', () => {
      const mockNote = createMockNoteData({
        date_from: '2025-07-01',
        date_to: '2025-07-07',
      })
      renderWithProviders(NoteDisplaySection, {
        props: { note: mockNote, noteId: '123' },
      })

      expect(screen.getByText('6 days')).toBeInTheDocument()
    })

    it('should calculate month-spanning duration correctly', () => {
      const mockNote = createMockNoteData({
        date_from: '2025-06-25',
        date_to: '2025-07-05',
      })
      renderWithProviders(NoteDisplaySection, {
        props: { note: mockNote, noteId: '123' },
      })

      expect(screen.getByText('10 days')).toBeInTheDocument()
    })

    it('should handle date order correctly when end date is before start date', () => {
      const mockNote = createMockNoteData({
        date_from: '2025-07-15',
        date_to: '2025-07-10',
      })
      renderWithProviders(NoteDisplaySection, {
        props: { note: mockNote, noteId: '123' },
      })

      // Should use Math.abs to handle reversed dates
      expect(screen.getByText('5 days')).toBeInTheDocument()
    })
  })

  describe('Key Ideas Section', () => {
    it('should display key ideas when provided', () => {
      const mockNote = createMockNoteData({
        key_ideas: 'Visit museums, try local food, take photos',
      })
      renderWithProviders(NoteDisplaySection, {
        props: { note: mockNote, noteId: '123' },
      })

      expect(screen.getByText('Visit museums, try local food, take photos')).toBeInTheDocument()
    })

    it('should show empty state when key ideas is null', () => {
      const mockNote = createMockNoteData({ key_ideas: null })
      renderWithProviders(NoteDisplaySection, {
        props: { note: mockNote, noteId: '123' },
      })

      expect(screen.getByText('No key ideas provided for this trip.')).toBeInTheDocument()
      expect(screen.getByText('Add some ideas by editing this note')).toBeInTheDocument()
    })

    it('should show empty state when key ideas is undefined', () => {
      const mockNote = createMockNoteData({ key_ideas: undefined })
      renderWithProviders(NoteDisplaySection, {
        props: { note: mockNote, noteId: '123' },
      })

      expect(screen.getByText('No key ideas provided for this trip.')).toBeInTheDocument()
    })

    it('should show empty state when key ideas is empty string', () => {
      const mockNote = createMockNoteData({ key_ideas: '' })
      renderWithProviders(NoteDisplaySection, {
        props: { note: mockNote, noteId: '123' },
      })

      expect(screen.getByText('No key ideas provided for this trip.')).toBeInTheDocument()
    })

    it('should show empty state when key ideas is only whitespace', () => {
      const mockNote = createMockNoteData({ key_ideas: '   \n  \t  ' })
      renderWithProviders(NoteDisplaySection, {
        props: { note: mockNote, noteId: '123' },
      })

      expect(screen.getByText('No key ideas provided for this trip.')).toBeInTheDocument()
    })

    it('should preserve whitespace and line breaks in key ideas', () => {
      const keyIdeas = 'Day 1: Explore downtown\nDay 2: Visit museums\n\nDay 3: Shopping'
      const mockNote = createMockNoteData({ key_ideas: keyIdeas })
      renderWithProviders(NoteDisplaySection, {
        props: { note: mockNote, noteId: '123' },
      })

      // Use getAllByText and target the specific paragraph element
      const keyIdeasElements = screen.getAllByText((_, element) => {
        return element?.textContent === keyIdeas && element?.tagName === 'P'
      })
      expect(keyIdeasElements).toHaveLength(1)
      expect(keyIdeasElements[0]).toHaveClass('whitespace-pre-wrap')
    })

    it('should handle long key ideas text', () => {
      const longKeyIdeas = 'A'.repeat(2000)
      const mockNote = createMockNoteData({ key_ideas: longKeyIdeas })
      renderWithProviders(NoteDisplaySection, {
        props: { note: mockNote, noteId: '123' },
      })

      expect(screen.getByText(longKeyIdeas)).toBeInTheDocument()
    })

    it('should handle special characters in key ideas', () => {
      const specialKeyIdeas = 'Visit café ☕, go to 東京 (Tokyo), cost ~$500 & have fun! 🎌'
      const mockNote = createMockNoteData({ key_ideas: specialKeyIdeas })
      renderWithProviders(NoteDisplaySection, {
        props: { note: mockNote, noteId: '123' },
      })

      expect(screen.getByText(specialKeyIdeas)).toBeInTheDocument()
    })
  })

  describe('Navigation and Actions', () => {
    it('should have edit link with correct href', () => {
      const mockNote = createMockNoteData()
      renderWithProviders(NoteDisplaySection, {
        props: { note: mockNote, noteId: '456' },
      })

      const editLink = screen.getByRole('link', { name: /edit note/i })
      expect(editLink).toHaveAttribute('href', '/notes/456/edit')
    })

    it('should emit delete event when delete button is clicked', async () => {
      const mockNote = createMockNoteData()
      const { emitted } = renderWithProviders(NoteDisplaySection, {
        props: { note: mockNote, noteId: '123' },
      })

      const deleteButton = screen.getByRole('button', { name: /delete note/i })
      await fireEvent.click(deleteButton)

      expect(emitted()).toHaveProperty('delete')
      expect(emitted().delete).toHaveLength(1)
      expect(emitted().delete[0]).toEqual([])
    })

    it('should have proper button styling for edit action', () => {
      const mockNote = createMockNoteData()
      renderWithProviders(NoteDisplaySection, {
        props: { note: mockNote, noteId: '123' },
      })

      const editButton = screen.getByRole('link', { name: /edit note/i })
      expect(editButton).toHaveClass('bg-primary-700', 'hover:bg-primary-800')
    })

    it('should have proper button styling for delete action', () => {
      const mockNote = createMockNoteData()
      renderWithProviders(NoteDisplaySection, {
        props: { note: mockNote, noteId: '123' },
      })

      const deleteButton = screen.getByRole('button', { name: /delete note/i })
      expect(deleteButton).toHaveClass('text-red-700', 'bg-red-50', 'hover:bg-red-100')
    })
  })

  describe('Props Validation', () => {
    it('should handle note prop with all required fields', () => {
      const mockNote = createMockNoteData()
      expect(() => {
        renderWithProviders(NoteDisplaySection, {
          props: { note: mockNote, noteId: '123' },
        })
      }).not.toThrow()
    })

    it('should handle noteId prop correctly', () => {
      const mockNote = createMockNoteData()
      renderWithProviders(NoteDisplaySection, {
        props: { note: mockNote, noteId: 'abc-123' },
      })

      const editLink = screen.getByRole('link', { name: /edit note/i })
      expect(editLink).toHaveAttribute('href', '/notes/abc-123/edit')
    })

    it('should render with minimum required note data', () => {
      const minimalNote: NoteOutSchema = {
        id: 1,
        user_id: 'user-1',
        title: 'Test',
        place: 'Test Place',
        date_from: '2025-01-01',
        date_to: '2025-01-02',
        number_of_people: 1,
        key_ideas: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      }

      renderWithProviders(NoteDisplaySection, {
        props: { note: minimalNote, noteId: '123' },
      })

      // The component doesn't display the note title directly, check for other content
      expect(screen.getByText('Test Place')).toBeInTheDocument()
      expect(screen.getByText('Trip Details')).toBeInTheDocument()
    })
  })

  describe('Styling and Layout', () => {
    it('should have proper responsive grid for information cards', () => {
      const mockNote = createMockNoteData()
      const { container } = renderWithProviders(NoteDisplaySection, {
        props: { note: mockNote, noteId: '123' },
      })

      const gridContainer = container.querySelector(
        '.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4.xl\\:grid-cols-4',
      )
      expect(gridContainer).toBeInTheDocument()
    })

    it('should have proper card styling', () => {
      const mockNote = createMockNoteData()
      const { container } = renderWithProviders(NoteDisplaySection, {
        props: { note: mockNote, noteId: '123' },
      })

      const cards = container.querySelectorAll(
        '.bg-white.dark\\:bg-gray-800.border.border-gray-200.dark\\:border-gray-600.rounded-xl',
      )
      expect(cards).toHaveLength(4) // Destination, Dates, Duration, Travelers
    })

    it('should have proper responsive button layout', () => {
      const mockNote = createMockNoteData()
      const { container } = renderWithProviders(NoteDisplaySection, {
        props: { note: mockNote, noteId: '123' },
      })

      const buttonContainer = container.querySelector('.flex.flex-row.gap-3')
      expect(buttonContainer).toBeInTheDocument()
    })

    it('should have proper dark mode support', () => {
      const mockNote = createMockNoteData()
      const { container } = renderWithProviders(NoteDisplaySection, {
        props: { note: mockNote, noteId: '123' },
      })

      const headerElement = screen.getByRole('heading', { name: /trip details/i })
      expect(headerElement).toHaveClass('text-gray-900', 'dark:text-white')

      // Check key ideas section has dark mode styling
      const keyIdeasSection = container.querySelector('.bg-gray-50.dark\\:bg-gray-700')
      expect(keyIdeasSection).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      const mockNote = createMockNoteData()
      renderWithProviders(NoteDisplaySection, {
        props: { note: mockNote, noteId: '123' },
      })

      const mainHeading = screen.getByRole('heading', { level: 2, name: /trip details/i })
      expect(mainHeading).toBeInTheDocument()

      const keyIdeasHeading = screen.getByRole('heading', { level: 3, name: /key ideas/i })
      expect(keyIdeasHeading).toBeInTheDocument()
    })

    it('should have accessible button labels', () => {
      const mockNote = createMockNoteData()
      renderWithProviders(NoteDisplaySection, {
        props: { note: mockNote, noteId: '123' },
      })

      expect(screen.getByRole('link', { name: /edit note/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /delete note/i })).toBeInTheDocument()
    })

    it('should have proper semantic structure', () => {
      const mockNote = createMockNoteData()
      const { container } = renderWithProviders(NoteDisplaySection, {
        props: { note: mockNote, noteId: '123' },
      })

      // Should use semantic HTML structure
      expect(container.querySelector('h2')).toBeInTheDocument()
      expect(container.querySelector('h3')).toBeInTheDocument()
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing or invalid date strings gracefully', () => {
      const mockNote = createMockNoteData({
        date_from: 'invalid-date',
        date_to: '2025-07-15',
      })

      expect(() => {
        renderWithProviders(NoteDisplaySection, {
          props: { note: mockNote, noteId: '123' },
        })
      }).not.toThrow()
    })

    it('should handle very long destination names', () => {
      const longDestination = 'Very Long Destination Name That Might Overflow The Container Layout'
      const mockNote = createMockNoteData({ place: longDestination })
      renderWithProviders(NoteDisplaySection, {
        props: { note: mockNote, noteId: '123' },
      })

      const destinationElement = screen.getByText(longDestination)
      expect(destinationElement).toBeInTheDocument()
      expect(destinationElement).toHaveClass('truncate')
    })

    it('should handle very long trip titles', () => {
      const longTitle = 'A'.repeat(500)
      const mockNote = createMockNoteData({ title: longTitle })
      renderWithProviders(NoteDisplaySection, {
        props: { note: mockNote, noteId: '123' },
      })

      // Should still render without breaking
      expect(screen.getByText('Trip Details')).toBeInTheDocument()
    })

    it('should handle extreme date ranges correctly', () => {
      const mockNote = createMockNoteData({
        date_from: '2025-01-01',
        date_to: '2025-12-31',
      })
      renderWithProviders(NoteDisplaySection, {
        props: { note: mockNote, noteId: '123' },
      })

      expect(screen.getByText('364 days')).toBeInTheDocument()
    })
  })

  describe('TypeScript Type Safety', () => {
    it('should accept valid NoteOutSchema', () => {
      const mockNote: NoteOutSchema = createMockNoteData()
      expect(() => {
        renderWithProviders(NoteDisplaySection, {
          props: { note: mockNote, noteId: '123' },
        })
      }).not.toThrow()
    })

    it('should handle noteId as string', () => {
      const mockNote = createMockNoteData()
      expect(() => {
        renderWithProviders(NoteDisplaySection, {
          props: { note: mockNote, noteId: 'string-id-123' },
        })
      }).not.toThrow()
    })
  })

  describe('Performance Considerations', () => {
    it('should not re-render unnecessarily when props remain the same', () => {
      const mockNote = createMockNoteData()
      const { rerender } = renderWithProviders(NoteDisplaySection, {
        props: { note: mockNote, noteId: '123' },
      })

      const initialTitle = screen.getByText('Trip Details')

      // Re-render with same props
      rerender({ note: mockNote, noteId: '123' })

      const newTitle = screen.getByText('Trip Details')
      expect(newTitle).toBe(initialTitle)
    })

    it('should handle date calculations efficiently', () => {
      const mockNote = createMockNoteData()

      // Should not throw or timeout on date calculations
      expect(() => {
        renderWithProviders(NoteDisplaySection, {
          props: { note: mockNote, noteId: '123' },
        })
      }).not.toThrow()

      // Duration should be calculated correctly (Jul 10 to Jul 15 = 5 days)
      expect(screen.getByText('5 days')).toBeInTheDocument()
    })
  })
})
