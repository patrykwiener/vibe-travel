import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, screen } from '@testing-library/vue'
import { renderWithProviders } from '@/test/utils'
import SearchInput from '@/components/ui/SearchInput.vue'

// Helper to create mock props
const createMockProps = (
  overrides: Partial<{
    modelValue: string
    placeholder?: string
    isLoading?: boolean
    maxLength?: number
    minLength?: number
  }> = {},
) => ({
  modelValue: '',
  placeholder: 'Search notes...',
  isLoading: false,
  maxLength: 255,
  minLength: 2,
  ...overrides,
})

describe('SearchInput - Core Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render search input with default props', () => {
      renderWithProviders(SearchInput, {
        props: createMockProps(),
      })

      const searchInput = screen.getByRole('textbox')
      expect(searchInput).toBeInTheDocument()
      expect(searchInput).toHaveAttribute('type', 'text')
      expect(searchInput).toHaveAttribute('placeholder', 'Search notes...')
      expect(searchInput).toHaveAttribute('maxlength', '255')
    })

    it('should render with custom placeholder', () => {
      renderWithProviders(SearchInput, {
        props: createMockProps({ placeholder: 'Find your trip...' }),
      })

      const searchInput = screen.getByRole('textbox')
      expect(searchInput).toHaveAttribute('placeholder', 'Find your trip...')
    })

    it('should render search icon', () => {
      renderWithProviders(SearchInput, {
        props: createMockProps(),
      })

      // Check for search icon SVG
      const searchIcon = document.querySelector(
        'svg path[d*="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"]',
      )
      expect(searchIcon).toBeInTheDocument()
    })

    it('should display current value', () => {
      renderWithProviders(SearchInput, {
        props: createMockProps({ modelValue: 'test query' }),
      })

      const searchInput = screen.getByRole('textbox') as HTMLInputElement
      expect(searchInput.value).toBe('test query')
    })
  })

  describe('Loading State', () => {
    it('should show loading spinner when isLoading is true', () => {
      renderWithProviders(SearchInput, {
        props: createMockProps({ isLoading: true }),
      })

      // Check for loading spinner
      const loadingSpinner = document.querySelector('.animate-spin')
      expect(loadingSpinner).toBeInTheDocument()
    })

    it('should hide clear button when loading', () => {
      renderWithProviders(SearchInput, {
        props: createMockProps({
          modelValue: 'test',
          isLoading: true,
        }),
      })

      // Clear button should not be visible when loading
      const clearButton = screen.queryByRole('button', { name: /clear search/i })
      expect(clearButton).not.toBeInTheDocument()
    })

    it('should not show loading spinner when isLoading is false', () => {
      renderWithProviders(SearchInput, {
        props: createMockProps({ isLoading: false }),
      })

      const loadingSpinner = document.querySelector('.animate-spin')
      expect(loadingSpinner).not.toBeInTheDocument()
    })
  })

  describe('Clear Button', () => {
    it('should show clear button when has value and not loading', () => {
      renderWithProviders(SearchInput, {
        props: createMockProps({
          modelValue: 'test query',
          isLoading: false,
        }),
      })

      const clearButton = screen.getByRole('button', { name: /clear search/i })
      expect(clearButton).toBeInTheDocument()
    })

    it('should not show clear button when input is empty', () => {
      renderWithProviders(SearchInput, {
        props: createMockProps({ modelValue: '' }),
      })

      const clearButton = screen.queryByRole('button', { name: /clear search/i })
      expect(clearButton).not.toBeInTheDocument()
    })

    it('should emit clear event when clear button is clicked', async () => {
      const { emitted } = renderWithProviders(SearchInput, {
        props: createMockProps({ modelValue: 'test query' }),
      })

      const clearButton = screen.getByRole('button', { name: /clear search/i })
      await fireEvent.click(clearButton)

      expect(emitted().clear).toBeTruthy()
      expect(emitted().clear).toHaveLength(1)
      expect(emitted()['update:modelValue']).toBeTruthy()
      const updateEvents = emitted()['update:modelValue'] as unknown[][]
      expect(updateEvents[0][0]).toBe('')
    })
  })

  describe('Input Validation', () => {
    it('should show validation error when input is too short', () => {
      renderWithProviders(SearchInput, {
        props: createMockProps({
          modelValue: 'a',
          minLength: 2,
        }),
      })

      expect(
        screen.getByText('Search query must be at least 2 characters long.'),
      ).toBeInTheDocument()
    })

    it('should not show validation error when input is empty', () => {
      renderWithProviders(SearchInput, {
        props: createMockProps({ modelValue: '' }),
      })

      const validationMessage = screen.queryByText(/search query must be at least/i)
      expect(validationMessage).not.toBeInTheDocument()
    })

    it('should not show validation error when input meets minimum length', () => {
      renderWithProviders(SearchInput, {
        props: createMockProps({
          modelValue: 'test',
          minLength: 2,
        }),
      })

      const validationMessage = screen.queryByText(/search query must be at least/i)
      expect(validationMessage).not.toBeInTheDocument()
    })

    it('should apply error styling when validation fails', () => {
      renderWithProviders(SearchInput, {
        props: createMockProps({
          modelValue: 'a',
          minLength: 2,
        }),
      })

      const searchInput = screen.getByRole('textbox')
      expect(searchInput).toHaveClass('border-red-500')
    })
  })

  describe('Event Handling', () => {
    it('should emit update:modelValue on input change', async () => {
      const { emitted } = renderWithProviders(SearchInput, {
        props: createMockProps(),
      })

      const searchInput = screen.getByRole('textbox')
      await fireEvent.input(searchInput, { target: { value: 'new search' } })

      expect(emitted()['update:modelValue']).toBeTruthy()
      const updateEvents = emitted()['update:modelValue'] as unknown[][]
      expect(updateEvents[0][0]).toBe('new search')
    })

    it('should trim input value automatically', async () => {
      const { emitted } = renderWithProviders(SearchInput, {
        props: createMockProps(),
      })

      const searchInput = screen.getByRole('textbox')
      await fireEvent.input(searchInput, { target: { value: '  padded search  ' } })

      expect(emitted()['update:modelValue']).toBeTruthy()
      const updateEvents = emitted()['update:modelValue'] as unknown[][]
      expect(updateEvents[0][0]).toBe('padded search')
    })

    it('should enforce maxLength constraint', async () => {
      const { emitted } = renderWithProviders(SearchInput, {
        props: createMockProps({ maxLength: 10 }),
      })

      const searchInput = screen.getByRole('textbox')
      await fireEvent.input(searchInput, { target: { value: 'this is a very long search query' } })

      // Should not emit if exceeds maxLength
      expect(emitted()['update:modelValue']).toBeFalsy()
    })

    it('should emit search event on Enter key when valid', async () => {
      const { emitted } = renderWithProviders(SearchInput, {
        props: createMockProps({
          modelValue: 'valid search',
          minLength: 2,
        }),
      })

      const searchInput = screen.getByRole('textbox')
      await fireEvent.keyDown(searchInput, { key: 'Enter' })

      expect(emitted().search).toBeTruthy()
      const searchEvents = emitted().search as unknown[][]
      expect(searchEvents[0][0]).toBe('valid search')
    })

    it('should not emit search event on Enter when input is too short', async () => {
      const { emitted } = renderWithProviders(SearchInput, {
        props: createMockProps({
          modelValue: 'a',
          minLength: 2,
        }),
      })

      const searchInput = screen.getByRole('textbox')
      await fireEvent.keyDown(searchInput, { key: 'Enter' })

      expect(emitted().search).toBeFalsy()
    })

    it('should clear search on Escape key', async () => {
      const { emitted } = renderWithProviders(SearchInput, {
        props: createMockProps({ modelValue: 'test search' }),
      })

      const searchInput = screen.getByRole('textbox')
      await fireEvent.keyDown(searchInput, { key: 'Escape' })

      expect(emitted()['update:modelValue']).toBeTruthy()
      expect(emitted().clear).toBeTruthy()
      const updateEvents = emitted()['update:modelValue'] as unknown[][]
      expect(updateEvents[0][0]).toBe('')
    })
  })

  describe('Styling and CSS Classes', () => {
    it('should apply correct base CSS classes', () => {
      renderWithProviders(SearchInput, {
        props: createMockProps(),
      })

      const searchInput = screen.getByRole('textbox')
      expect(searchInput).toHaveClass('block')
      expect(searchInput).toHaveClass('w-full')
      expect(searchInput).toHaveClass('p-4')
      expect(searchInput).toHaveClass('pl-10')
      expect(searchInput).toHaveClass('pr-12')
      expect(searchInput).toHaveClass('text-sm')
      expect(searchInput).toHaveClass('rounded-lg')
    })

    it('should apply dark mode classes', () => {
      renderWithProviders(SearchInput, {
        props: createMockProps(),
      })

      const searchInput = screen.getByRole('textbox')
      expect(searchInput).toHaveClass('dark:bg-gray-700')
      expect(searchInput).toHaveClass('dark:border-gray-600')
      expect(searchInput).toHaveClass('dark:text-white')
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle special characters correctly', async () => {
      const { emitted } = renderWithProviders(SearchInput, {
        props: createMockProps(),
      })

      const searchInput = screen.getByRole('textbox')
      const specialText = 'search with émojis 🔍 and symbols @#$'
      await fireEvent.input(searchInput, { target: { value: specialText } })

      expect(emitted()['update:modelValue']).toBeTruthy()
      const updateEvents = emitted()['update:modelValue'] as unknown[][]
      expect(updateEvents[0][0]).toBe(specialText)
    })

    it('should handle rapid input changes', async () => {
      const { emitted } = renderWithProviders(SearchInput, {
        props: createMockProps(),
      })

      const searchInput = screen.getByRole('textbox')

      // Simulate rapid typing
      for (let i = 1; i <= 5; i++) {
        await fireEvent.input(searchInput, { target: { value: `search ${i}` } })
      }

      expect(emitted()['update:modelValue']).toHaveLength(5)
      const updateEvents = emitted()['update:modelValue'] as unknown[][]
      expect(updateEvents[4][0]).toBe('search 5')
    })

    it('should handle empty string input correctly', async () => {
      const { emitted } = renderWithProviders(SearchInput, {
        props: createMockProps({ modelValue: 'existing search' }),
      })

      const searchInput = screen.getByRole('textbox')
      await fireEvent.input(searchInput, { target: { value: '' } })

      expect(emitted()['update:modelValue']).toBeTruthy()
      const updateEvents = emitted()['update:modelValue'] as unknown[][]
      expect(updateEvents[0][0]).toBe('')
    })
  })

  describe('Custom Props', () => {
    it('should respect custom minLength', () => {
      renderWithProviders(SearchInput, {
        props: createMockProps({
          modelValue: 'ab',
          minLength: 5,
        }),
      })

      expect(
        screen.getByText('Search query must be at least 5 characters long.'),
      ).toBeInTheDocument()
    })

    it('should respect custom maxLength', () => {
      renderWithProviders(SearchInput, {
        props: createMockProps({ maxLength: 50 }),
      })

      const searchInput = screen.getByRole('textbox')
      expect(searchInput).toHaveAttribute('maxlength', '50')
    })

    it('should use default values when props not provided', () => {
      renderWithProviders(SearchInput, {
        props: { modelValue: '' },
      })

      const searchInput = screen.getByRole('textbox')
      expect(searchInput).toHaveAttribute('placeholder', 'Search notes...')
      expect(searchInput).toHaveAttribute('maxlength', '255')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderWithProviders(SearchInput, {
        props: createMockProps({ modelValue: 'test' }),
      })

      const clearButton = screen.getByRole('button', { name: /clear search/i })
      expect(clearButton).toHaveAttribute('aria-label', 'Clear search')
    })

    it('should be keyboard accessible', async () => {
      renderWithProviders(SearchInput, {
        props: createMockProps({ modelValue: 'test search' }),
      })

      const searchInput = screen.getByRole('textbox')

      // Test focus
      searchInput.focus()
      expect(document.activeElement).toBe(searchInput)

      // Test keyboard navigation to clear button
      const clearButton = screen.getByRole('button', { name: /clear search/i })
      expect(clearButton).toHaveAttribute('type', 'button')
    })

    it('should have semantic HTML structure', () => {
      const { container } = renderWithProviders(SearchInput, {
        props: createMockProps(),
      })

      // Should use proper HTML structure
      const inputContainer = container.querySelector('.relative')
      expect(inputContainer).toBeInTheDocument()

      const input = container.querySelector('input[type="text"]')
      expect(input).toBeInTheDocument()
    })
  })

  describe('TypeScript Type Safety', () => {
    it('should maintain correct TypeScript types for props', () => {
      const props = createMockProps()

      expect(typeof props.modelValue).toBe('string')
      expect(typeof props.placeholder).toBe('string')
      expect(typeof props.isLoading).toBe('boolean')
      expect(typeof props.maxLength).toBe('number')
      expect(typeof props.minLength).toBe('number')
    })
  })
})
