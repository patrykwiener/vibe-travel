import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, screen } from '@testing-library/vue'
import { renderWithProviders } from '@tests/utils'
import EmptyStateMessage from '@/components/layout/EmptyStateMessage.vue'

// Helper to create mock props
const createMockProps = (
  overrides: Partial<{
    type: 'no-notes' | 'no-search-results'
    searchQuery?: string
  }> = {},
) => ({
  type: 'no-notes' as const,
  ...overrides,
})

describe('EmptyStateMessage - Core Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render main container with correct styling', () => {
      const { container } = renderWithProviders(EmptyStateMessage, {
        props: createMockProps(),
      })

      const mainContainer = container.querySelector(
        '.flex.flex-col.items-center.justify-center.p-8.text-center',
      )
      expect(mainContainer).toBeInTheDocument()
    })

    it('should render with no-notes type by default', () => {
      renderWithProviders(EmptyStateMessage, {
        props: createMockProps({ type: 'no-notes' }),
      })

      expect(screen.getByText('No travel notes yet')).toBeInTheDocument()
      expect(
        screen.getByText(
          'Create your first travel note to start planning amazing trips with AI assistance.',
        ),
      ).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create your first note/i })).toBeInTheDocument()
    })

    it('should render with no-search-results type', () => {
      renderWithProviders(EmptyStateMessage, {
        props: createMockProps({ type: 'no-search-results' }),
      })

      expect(screen.getByText('No notes found')).toBeInTheDocument()
      expect(screen.getByText('No notes match your search criteria.')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /clear search/i })).toBeInTheDocument()
    })

    it('should render search query in message when provided', () => {
      const searchQuery = 'Tokyo trip'
      renderWithProviders(EmptyStateMessage, {
        props: createMockProps({
          type: 'no-search-results',
          searchQuery,
        }),
      })

      expect(
        screen.getByText(`No notes match "${searchQuery}". Try adjusting your search terms.`),
      ).toBeInTheDocument()
    })

    it('should render default message when search query is empty', () => {
      renderWithProviders(EmptyStateMessage, {
        props: createMockProps({
          type: 'no-search-results',
          searchQuery: '',
        }),
      })

      expect(screen.getByText('No notes match your search criteria.')).toBeInTheDocument()
    })
  })

  describe('Icon Rendering', () => {
    it('should render no-notes icon when type is no-notes', () => {
      renderWithProviders(EmptyStateMessage, {
        props: createMockProps({ type: 'no-notes' }),
      })

      // Check for document/note icon SVG path
      const noteIcon = document.querySelector(
        'svg path[d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"]',
      )
      expect(noteIcon).toBeInTheDocument()
    })

    it('should render search icon when type is no-search-results', () => {
      renderWithProviders(EmptyStateMessage, {
        props: createMockProps({ type: 'no-search-results' }),
      })

      // Check for search icon SVG path
      const searchIcon = document.querySelector(
        'svg path[d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"]',
      )
      expect(searchIcon).toBeInTheDocument()
    })

    it('should apply correct icon styling classes', () => {
      const { container } = renderWithProviders(EmptyStateMessage, {
        props: createMockProps({ type: 'no-notes' }),
      })

      const iconContainer = container.querySelector(
        '.w-16.h-16.mb-4.text-gray-400.dark\\:text-gray-600',
      )
      expect(iconContainer).toBeInTheDocument()

      const svgElement = iconContainer?.querySelector('svg')
      expect(svgElement).toHaveClass('w-full', 'h-full')
    })
  })

  describe('Content Based on Type', () => {
    it('should show create note content for no-notes type', () => {
      renderWithProviders(EmptyStateMessage, {
        props: createMockProps({ type: 'no-notes' }),
      })

      expect(screen.getByText('No travel notes yet')).toBeInTheDocument()
      expect(
        screen.getByText(
          'Create your first travel note to start planning amazing trips with AI assistance.',
        ),
      ).toBeInTheDocument()
      expect(screen.getByText('Create your first note')).toBeInTheDocument()
    })

    it('should show search content for no-search-results type without search query', () => {
      renderWithProviders(EmptyStateMessage, {
        props: createMockProps({ type: 'no-search-results' }),
      })

      expect(screen.getByText('No notes found')).toBeInTheDocument()
      expect(screen.getByText('No notes match your search criteria.')).toBeInTheDocument()
      expect(screen.getByText('Clear search')).toBeInTheDocument()
    })

    it('should show search content with specific search query', () => {
      const searchQuery = 'Paris vacation'
      renderWithProviders(EmptyStateMessage, {
        props: createMockProps({
          type: 'no-search-results',
          searchQuery,
        }),
      })

      expect(screen.getByText('No notes found')).toBeInTheDocument()
      expect(
        screen.getByText(`No notes match "${searchQuery}". Try adjusting your search terms.`),
      ).toBeInTheDocument()
      expect(screen.getByText('Clear search')).toBeInTheDocument()
    })

    it('should handle special characters in search query', () => {
      const searchQuery = 'Tokyo 東京 & café trip!'
      renderWithProviders(EmptyStateMessage, {
        props: createMockProps({
          type: 'no-search-results',
          searchQuery,
        }),
      })

      expect(
        screen.getByText(`No notes match "${searchQuery}". Try adjusting your search terms.`),
      ).toBeInTheDocument()
    })
  })

  describe('Button Rendering and Styling', () => {
    it('should render action button with correct styling classes', () => {
      renderWithProviders(EmptyStateMessage, {
        props: createMockProps({ type: 'no-notes' }),
      })

      const button = screen.getByRole('button')
      expect(button).toHaveClass(
        'inline-flex',
        'items-center',
        'px-4',
        'py-2',
        'text-sm',
        'font-medium',
        'text-white',
        'bg-primary-600',
        'border',
        'border-transparent',
        'rounded-lg',
        'hover:bg-primary-700',
        'focus:ring-4',
        'focus:outline-none',
        'focus:ring-primary-300',
        'dark:bg-primary-600',
        'dark:hover:bg-primary-700',
        'dark:focus:ring-primary-800',
        'transition-colors',
      )
    })

    it('should render plus icon for no-notes type button', () => {
      renderWithProviders(EmptyStateMessage, {
        props: createMockProps({ type: 'no-notes' }),
      })

      // Check for plus icon SVG path
      const plusIcon = document.querySelector('svg path[d="M12 4v16m8-8H4"]')
      expect(plusIcon).toBeInTheDocument()
    })

    it('should render clear icon for no-search-results type button', () => {
      renderWithProviders(EmptyStateMessage, {
        props: createMockProps({ type: 'no-search-results' }),
      })

      // Check for X/clear icon SVG path
      const clearIcon = document.querySelector('svg path[d="M6 18L18 6M6 6l12 12"]')
      expect(clearIcon).toBeInTheDocument()
    })

    it('should render button with proper icon styling', () => {
      renderWithProviders(EmptyStateMessage, {
        props: createMockProps({ type: 'no-notes' }),
      })

      const button = screen.getByRole('button')
      const svg = button.querySelector('svg')
      expect(svg).toHaveClass('w-4', 'h-4', 'mr-2')
    })
  })

  describe('Event Emissions', () => {
    it('should emit create-note event when action button is clicked for no-notes type', async () => {
      const { emitted } = renderWithProviders(EmptyStateMessage, {
        props: createMockProps({ type: 'no-notes' }),
      })

      const actionButton = screen.getByRole('button', { name: /create your first note/i })
      await fireEvent.click(actionButton)

      expect(emitted()['create-note']).toBeTruthy()
      expect(emitted()['create-note']).toHaveLength(1)
    })

    it('should emit clear-search event when action button is clicked for no-search-results type', async () => {
      const { emitted } = renderWithProviders(EmptyStateMessage, {
        props: createMockProps({ type: 'no-search-results' }),
      })

      const actionButton = screen.getByRole('button', { name: /clear search/i })
      await fireEvent.click(actionButton)

      expect(emitted()['clear-search']).toBeTruthy()
      expect(emitted()['clear-search']).toHaveLength(1)
    })

    it('should emit create-note event for no-notes type regardless of search query', async () => {
      const { emitted } = renderWithProviders(EmptyStateMessage, {
        props: createMockProps({
          type: 'no-notes',
          searchQuery: 'some query',
        }),
      })

      const actionButton = screen.getByRole('button')
      await fireEvent.click(actionButton)

      expect(emitted()['create-note']).toBeTruthy()
      expect(emitted()['clear-search']).toBeFalsy()
    })

    it('should emit clear-search event for no-search-results type with search query', async () => {
      const { emitted } = renderWithProviders(EmptyStateMessage, {
        props: createMockProps({
          type: 'no-search-results',
          searchQuery: 'Tokyo',
        }),
      })

      const actionButton = screen.getByRole('button')
      await fireEvent.click(actionButton)

      expect(emitted()['clear-search']).toBeTruthy()
      expect(emitted()['create-note']).toBeFalsy()
    })

    it('should handle rapid button clicks gracefully', async () => {
      const { emitted } = renderWithProviders(EmptyStateMessage, {
        props: createMockProps({ type: 'no-notes' }),
      })

      const actionButton = screen.getByRole('button')

      // Simulate rapid clicks
      await fireEvent.click(actionButton)
      await fireEvent.click(actionButton)
      await fireEvent.click(actionButton)

      expect(emitted()['create-note']).toHaveLength(3)
    })
  })

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      renderWithProviders(EmptyStateMessage, {
        props: createMockProps({ type: 'no-notes' }),
      })

      const heading = screen.getByRole('heading', { level: 3 })
      expect(heading).toBeInTheDocument()
      expect(heading).toHaveTextContent('No travel notes yet')
    })

    it('should have accessible heading for different types', () => {
      const { unmount } = renderWithProviders(EmptyStateMessage, {
        props: createMockProps({ type: 'no-notes' }),
      })

      expect(
        screen.getByRole('heading', { level: 3, name: /no travel notes yet/i }),
      ).toBeInTheDocument()
      unmount()

      renderWithProviders(EmptyStateMessage, {
        props: createMockProps({ type: 'no-search-results' }),
      })

      expect(screen.getByRole('heading', { level: 3, name: /no notes found/i })).toBeInTheDocument()
    })

    it('should have accessible button with proper text', () => {
      renderWithProviders(EmptyStateMessage, {
        props: createMockProps({ type: 'no-notes' }),
      })

      const button = screen.getByRole('button', { name: /create your first note/i })
      expect(button).toBeInTheDocument()
      expect(button).toHaveAttribute('type', 'button')
    })

    it('should have proper text hierarchy', () => {
      const { container } = renderWithProviders(EmptyStateMessage, {
        props: createMockProps({ type: 'no-notes' }),
      })

      const heading = container.querySelector('h3')
      const paragraph = container.querySelector('p')
      const button = container.querySelector('button')

      expect(heading).toBeInTheDocument()
      expect(paragraph).toBeInTheDocument()
      expect(button).toBeInTheDocument()

      // Check proper styling for text hierarchy
      expect(heading).toHaveClass(
        'text-lg',
        'font-medium',
        'text-gray-900',
        'dark:text-white',
        'mb-2',
      )
      expect(paragraph).toHaveClass('text-gray-500', 'dark:text-gray-400', 'mb-6', 'max-w-md')
    })
  })

  describe('Dark Mode Support', () => {
    it('should have dark mode classes for icon', () => {
      const { container } = renderWithProviders(EmptyStateMessage, {
        props: createMockProps({ type: 'no-notes' }),
      })

      const iconContainer = container.querySelector('.text-gray-400.dark\\:text-gray-600')
      expect(iconContainer).toBeInTheDocument()
    })

    it('should have dark mode classes for title', () => {
      renderWithProviders(EmptyStateMessage, {
        props: createMockProps({ type: 'no-notes' }),
      })

      const title = screen.getByRole('heading', { level: 3 })
      expect(title).toHaveClass('text-gray-900', 'dark:text-white')
    })

    it('should have dark mode classes for message', () => {
      const { container } = renderWithProviders(EmptyStateMessage, {
        props: createMockProps({ type: 'no-notes' }),
      })

      const message = container.querySelector('p')
      expect(message).toHaveClass('text-gray-500', 'dark:text-gray-400')
    })

    it('should have dark mode classes for button', () => {
      renderWithProviders(EmptyStateMessage, {
        props: createMockProps({ type: 'no-notes' }),
      })

      const button = screen.getByRole('button')
      expect(button).toHaveClass(
        'dark:bg-primary-600',
        'dark:hover:bg-primary-700',
        'dark:focus:ring-primary-800',
      )
    })
  })

  describe('Responsive Design', () => {
    it('should have proper responsive layout classes', () => {
      const { container } = renderWithProviders(EmptyStateMessage, {
        props: createMockProps({ type: 'no-notes' }),
      })

      const mainContainer = container.querySelector(
        '.flex.flex-col.items-center.justify-center.p-8.text-center',
      )
      expect(mainContainer).toBeInTheDocument()
    })

    it('should constrain message width for readability', () => {
      const { container } = renderWithProviders(EmptyStateMessage, {
        props: createMockProps({ type: 'no-notes' }),
      })

      const message = container.querySelector('p')
      expect(message).toHaveClass('max-w-md')
    })

    it('should have proper spacing between elements', () => {
      const { container } = renderWithProviders(EmptyStateMessage, {
        props: createMockProps({ type: 'no-notes' }),
      })

      const iconContainer = container.querySelector('.w-16.h-16.mb-4')
      const title = container.querySelector('h3.mb-2')
      const message = container.querySelector('p.mb-6')

      expect(iconContainer).toBeInTheDocument()
      expect(title).toBeInTheDocument()
      expect(message).toBeInTheDocument()
    })
  })

  describe('TypeScript Type Safety', () => {
    it('should accept valid type values', () => {
      const validTypes: Array<'no-notes' | 'no-search-results'> = ['no-notes', 'no-search-results']

      validTypes.forEach((type) => {
        const { unmount } = renderWithProviders(EmptyStateMessage, {
          props: createMockProps({ type }),
        })

        expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument()
        unmount()
      })
    })

    it('should handle optional searchQuery prop correctly', () => {
      // Test with undefined searchQuery
      const { unmount: unmount1 } = renderWithProviders(EmptyStateMessage, {
        props: createMockProps({
          type: 'no-search-results',
        }),
      })

      expect(screen.getByText('No notes match your search criteria.')).toBeInTheDocument()
      unmount1()

      // Test with defined searchQuery
      renderWithProviders(EmptyStateMessage, {
        props: createMockProps({
          type: 'no-search-results',
          searchQuery: 'test query',
        }),
      })

      expect(
        screen.getByText('No notes match "test query". Try adjusting your search terms.'),
      ).toBeInTheDocument()
    })

    it('should maintain correct TypeScript types for props', () => {
      const props = createMockProps()

      expect(['no-notes', 'no-search-results']).toContain(props.type)
      expect(typeof props.type).toBe('string')
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty search query string', () => {
      renderWithProviders(EmptyStateMessage, {
        props: createMockProps({
          type: 'no-search-results',
          searchQuery: '',
        }),
      })

      expect(screen.getByText('No notes match your search criteria.')).toBeInTheDocument()
      expect(
        screen.queryByText('No notes match "". Try adjusting your search terms.'),
      ).not.toBeInTheDocument()
    })

    it('should handle whitespace-only search query', () => {
      renderWithProviders(EmptyStateMessage, {
        props: createMockProps({
          type: 'no-search-results',
          searchQuery: '   ',
        }),
      })

      // Text content is normalized by the DOM, so whitespace gets collapsed
      expect(
        screen.getByText('No notes match " ". Try adjusting your search terms.'),
      ).toBeInTheDocument()
    })

    it('should handle very long search queries', () => {
      const longQuery = 'A'.repeat(500)
      renderWithProviders(EmptyStateMessage, {
        props: createMockProps({
          type: 'no-search-results',
          searchQuery: longQuery,
        }),
      })

      expect(
        screen.getByText(`No notes match "${longQuery}". Try adjusting your search terms.`),
      ).toBeInTheDocument()
    })

    it('should handle HTML/script injection in search query', () => {
      const maliciousQuery = '<script>alert("test")</script>'
      renderWithProviders(EmptyStateMessage, {
        props: createMockProps({
          type: 'no-search-results',
          searchQuery: maliciousQuery,
        }),
      })

      // Should render as text, not execute as HTML
      expect(
        screen.getByText(`No notes match "${maliciousQuery}". Try adjusting your search terms.`),
      ).toBeInTheDocument()
      expect(document.querySelector('script')).not.toBeInTheDocument()
    })

    it('should handle emoji and unicode characters in search query', () => {
      const emojiQuery = '🗾 Japan trip 日本 🍜'
      renderWithProviders(EmptyStateMessage, {
        props: createMockProps({
          type: 'no-search-results',
          searchQuery: emojiQuery,
        }),
      })

      expect(
        screen.getByText(`No notes match "${emojiQuery}". Try adjusting your search terms.`),
      ).toBeInTheDocument()
    })
  })

  describe('Performance Considerations', () => {
    it('should efficiently handle multiple prop changes', () => {
      const { rerender } = renderWithProviders(EmptyStateMessage, {
        props: createMockProps({ type: 'no-notes' }),
      })

      // Multiple rapid prop changes
      rerender({ type: 'no-search-results' })
      rerender({ type: 'no-search-results', searchQuery: 'test' })
      rerender({ type: 'no-notes' })
      rerender({ type: 'no-search-results', searchQuery: 'another test' })

      // Should still render correctly after multiple changes
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument()
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should not cause memory leaks with event handlers', async () => {
      const { unmount } = renderWithProviders(EmptyStateMessage, {
        props: createMockProps({ type: 'no-notes' }),
      })

      const button = screen.getByRole('button')

      // Simulate multiple interactions before unmount
      await fireEvent.click(button)
      await fireEvent.click(button)

      // Unmount component - should not cause errors
      unmount()

      // This test mainly ensures no errors are thrown during cleanup
    })

    it('should handle frequent type switching efficiently', () => {
      const { rerender } = renderWithProviders(EmptyStateMessage, {
        props: createMockProps({ type: 'no-notes' }),
      })

      // Rapidly switch between types
      for (let i = 0; i < 10; i++) {
        const type = i % 2 === 0 ? 'no-notes' : 'no-search-results'
        rerender({ type, searchQuery: i % 2 === 1 ? `query ${i}` : undefined })
      }

      // Should still be functional after many switches
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument()
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })

  describe('Component Integration', () => {
    it('should work correctly within a larger layout', () => {
      const { container } = renderWithProviders(EmptyStateMessage, {
        props: createMockProps({ type: 'no-notes' }),
      })

      // Should be self-contained and not interfere with parent styling
      const component = container.firstChild as HTMLElement
      expect(component).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center')
    })

    it('should maintain consistent behavior across different viewport sizes', () => {
      // This test ensures the component works well in different container sizes
      const { container } = renderWithProviders(EmptyStateMessage, {
        props: createMockProps({ type: 'no-notes' }),
      })

      const mainContainer = container.querySelector('.p-8.text-center')
      expect(mainContainer).toBeInTheDocument()

      // Should have responsive design classes
      expect(mainContainer).toHaveClass('text-center')
    })
  })
})
