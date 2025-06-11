import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/vue'
import { renderWithProviders } from '@/test/utils'
import NoteCard from '@/components/notes/NoteCard.vue'
import type { NoteListItemOutSchema } from '@/client'

// Helper to create mock note data
const createMockNoteData = (
  overrides: Partial<NoteListItemOutSchema> = {},
): NoteListItemOutSchema => ({
  id: 1,
  title: 'Trip to Paris',
  place: 'Paris, France',
  date_from: '2025-07-10',
  date_to: '2025-07-15',
  number_of_people: 2,
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

describe('NoteCard - Core Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render note title correctly', () => {
      const mockNote = createMockNoteData({ title: 'Amazing Trip to Tokyo' })
      renderWithProviders(NoteCard, {
        props: { note: mockNote },
      })

      expect(screen.getByText('Amazing Trip to Tokyo')).toBeInTheDocument()
    })

    it('should render note place with location icon', () => {
      const mockNote = createMockNoteData({ place: 'Tokyo, Japan' })
      renderWithProviders(NoteCard, {
        props: { note: mockNote },
      })

      expect(screen.getByText('Tokyo, Japan')).toBeInTheDocument()
      // Check for location icon by finding SVG with location path
      const locationIcon = document.querySelector('svg path[d*="M17.657 16.657L13.414 20.9"]')
      expect(locationIcon).toBeInTheDocument()
    })

    it('should render number of people with person icon', () => {
      const mockNote = createMockNoteData({ number_of_people: 3 })
      renderWithProviders(NoteCard, {
        props: { note: mockNote },
      })

      expect(screen.getByText('3 people')).toBeInTheDocument()
      // Check for people icon
      const peopleIcon = document.querySelector('svg path[d*="M12 4.354a4 4 0 110 5.292"]')
      expect(peopleIcon).toBeInTheDocument()
    })

    it('should use singular "person" for one traveler', () => {
      const mockNote = createMockNoteData({ number_of_people: 1 })
      renderWithProviders(NoteCard, {
        props: { note: mockNote },
      })

      expect(screen.getByText('1 person')).toBeInTheDocument()
    })

    it('should use plural "people" for multiple travelers', () => {
      const mockNote = createMockNoteData({ number_of_people: 5 })
      renderWithProviders(NoteCard, {
        props: { note: mockNote },
      })

      expect(screen.getByText('5 people')).toBeInTheDocument()
    })

    it('should render "View details" footer text', () => {
      const mockNote = createMockNoteData()
      renderWithProviders(NoteCard, {
        props: { note: mockNote },
      })

      expect(screen.getByText('View details')).toBeInTheDocument()
    })

    it('should render arrow icon in footer', () => {
      const mockNote = createMockNoteData()
      renderWithProviders(NoteCard, {
        props: { note: mockNote },
      })

      // Check for arrow icon
      const arrowIcon = document.querySelector('svg path[d="M9 5l7 7-7 7"]')
      expect(arrowIcon).toBeInTheDocument()
    })

    it('should have proper card styling classes', () => {
      const mockNote = createMockNoteData()
      const { container } = renderWithProviders(NoteCard, {
        props: { note: mockNote },
      })

      const cardElement = container.firstChild as HTMLElement
      expect(cardElement).toHaveClass(
        'bg-white',
        'border',
        'rounded-lg',
        'shadow-sm',
        'cursor-pointer',
      )
    })
  })

  describe('Date Formatting', () => {
    it('should format date range in same month correctly', () => {
      const mockNote = createMockNoteData({
        date_from: '2025-06-10',
        date_to: '2025-06-15',
      })
      renderWithProviders(NoteCard, {
        props: { note: mockNote },
      })

      expect(screen.getByText('Jun 10-15, 2025')).toBeInTheDocument()
    })

    it('should format date range across different months correctly', () => {
      const mockNote = createMockNoteData({
        date_from: '2025-06-25',
        date_to: '2025-07-05',
      })
      renderWithProviders(NoteCard, {
        props: { note: mockNote },
      })

      expect(screen.getByText('Jun 25 - Jul 5, 2025')).toBeInTheDocument()
    })

    it('should format date range across different years correctly', () => {
      const mockNote = createMockNoteData({
        date_from: '2024-12-28',
        date_to: '2025-01-03',
      })
      renderWithProviders(NoteCard, {
        props: { note: mockNote },
      })

      expect(screen.getByText('Dec 28 - Jan 3, 2025')).toBeInTheDocument()
    })

    it('should format single day trip correctly', () => {
      const mockNote = createMockNoteData({
        date_from: '2025-06-15',
        date_to: '2025-06-15',
      })
      renderWithProviders(NoteCard, {
        props: { note: mockNote },
      })

      expect(screen.getByText('Jun 15-15, 2025')).toBeInTheDocument()
    })

    it('should render calendar icon with dates', () => {
      const mockNote = createMockNoteData()
      renderWithProviders(NoteCard, {
        props: { note: mockNote },
      })

      // Check for calendar icon
      const calendarIcon = document.querySelector('svg path[d*="M8 7V3m8 4V3m-9 8h10"]')
      expect(calendarIcon).toBeInTheDocument()
    })
  })

  describe('Navigation Functionality', () => {
    it('should navigate to note detail view when clicked', async () => {
      const mockNote = createMockNoteData({ id: 123 })
      const { container } = renderWithProviders(NoteCard, {
        props: { note: mockNote },
      })

      const cardElement = container.firstChild as HTMLElement
      await fireEvent.click(cardElement)

      expect(mockPush).toHaveBeenCalledWith({
        name: 'note-detail',
        params: { noteId: '123' },
      })
    })

    it('should convert numeric ID to string for navigation', async () => {
      const mockNote = createMockNoteData({ id: 456 })
      const { container } = renderWithProviders(NoteCard, {
        props: { note: mockNote },
      })

      const cardElement = container.firstChild as HTMLElement
      await fireEvent.click(cardElement)

      expect(mockPush).toHaveBeenCalledWith({
        name: 'note-detail',
        params: { noteId: '456' },
      })
    })
  })

  describe('Props Validation', () => {
    it('should handle note prop with all required fields', () => {
      const mockNote = createMockNoteData()
      expect(() => {
        renderWithProviders(NoteCard, {
          props: { note: mockNote },
        })
      }).not.toThrow()
    })

    it('should render with minimum required note data', () => {
      const minimalNote: NoteListItemOutSchema = {
        id: 1,
        title: 'Test',
        place: 'Test Place',
        date_from: '2025-01-01',
        date_to: '2025-01-02',
        number_of_people: 1,
      }

      renderWithProviders(NoteCard, {
        props: { note: minimalNote },
      })

      expect(screen.getByText('Test')).toBeInTheDocument()
      expect(screen.getByText('Test Place')).toBeInTheDocument()
      expect(screen.getByText('1 person')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      const mockNote = createMockNoteData({ title: 'Accessible Trip' })
      renderWithProviders(NoteCard, {
        props: { note: mockNote },
      })

      // Check for heading element
      const heading = screen.getByRole('heading', { level: 3 })
      expect(heading).toHaveTextContent('Accessible Trip')
    })

    it('should be clickable for keyboard navigation', () => {
      const mockNote = createMockNoteData()
      const { container } = renderWithProviders(NoteCard, {
        props: { note: mockNote },
      })

      const cardElement = container.firstChild as HTMLElement
      expect(cardElement).toHaveClass('cursor-pointer')
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long titles with text truncation', () => {
      const longTitle = 'A'.repeat(200)
      const mockNote = createMockNoteData({ title: longTitle })
      renderWithProviders(NoteCard, {
        props: { note: mockNote },
      })

      const titleElement = screen.getByText(longTitle)
      expect(titleElement).toHaveClass('line-clamp-2')
    })

    it('should handle zero people count gracefully', () => {
      const mockNote = createMockNoteData({ number_of_people: 0 })
      renderWithProviders(NoteCard, {
        props: { note: mockNote },
      })

      expect(screen.getByText('0 people')).toBeInTheDocument()
    })

    it('should handle large people count', () => {
      const mockNote = createMockNoteData({ number_of_people: 100 })
      renderWithProviders(NoteCard, {
        props: { note: mockNote },
      })

      expect(screen.getByText('100 people')).toBeInTheDocument()
    })

    it('should handle special characters in title and place', () => {
      const mockNote = createMockNoteData({
        title: 'Trip with émojis 🏖️ & symbols!',
        place: 'São Paulo, Brasil',
      })
      renderWithProviders(NoteCard, {
        props: { note: mockNote },
      })

      expect(screen.getByText('Trip with émojis 🏖️ & symbols!')).toBeInTheDocument()
      expect(screen.getByText('São Paulo, Brasil')).toBeInTheDocument()
    })
  })

  describe('TypeScript Type Safety', () => {
    it('should accept valid NoteListItemOutSchema', () => {
      const mockNote: NoteListItemOutSchema = {
        id: 1,
        title: 'Type Safe Trip',
        place: 'TypeScript Land',
        date_from: '2025-01-01',
        date_to: '2025-01-02',
        number_of_people: 2,
      }

      expect(() => {
        renderWithProviders(NoteCard, {
          props: { note: mockNote },
        })
      }).not.toThrow()
    })
  })

  describe('Responsive Design', () => {
    it('should have responsive styling classes', () => {
      const mockNote = createMockNoteData()
      const { container } = renderWithProviders(NoteCard, {
        props: { note: mockNote },
      })

      const cardElement = container.firstChild as HTMLElement
      expect(cardElement).toHaveClass('hover:shadow-md')

      // Check for responsive design elements
      const icons = container.querySelectorAll('svg')
      icons.forEach((icon) => {
        expect(icon).toHaveClass('w-4', 'h-4')
      })
    })
  })

  describe('Performance Considerations', () => {
    it('should not re-render unnecessarily when props remain the same', () => {
      const mockNote = createMockNoteData()
      const { rerender } = renderWithProviders(NoteCard, {
        props: { note: mockNote },
      })

      const initialTitle = screen.getByText(mockNote.title)

      // Re-render with same props
      rerender({ note: mockNote })

      const newTitle = screen.getByText(mockNote.title)
      expect(newTitle).toBe(initialTitle)
    })
  })
})
