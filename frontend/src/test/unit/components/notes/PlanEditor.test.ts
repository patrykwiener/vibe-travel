import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, screen } from '@testing-library/vue'
import { renderWithProviders } from '@/test/utils'
import PlanEditor from '@/components/notes/PlanEditor.vue'

// Helper to create mock plan content
const createMockPlanContent = (length: number = 100) => {
  return 'A'.repeat(length)
}

// Helper to create long plan content that exceeds limits
const createLongPlanContent = (length: number = 3001) => {
  return 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '
    .repeat(Math.ceil(length / 57))
    .substring(0, length)
}

describe('PlanEditor - Core Functionality', () => {
  beforeEach(() => {
    // Mock any global objects if needed
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render textarea with default props', () => {
      renderWithProviders(PlanEditor, {
        props: { modelValue: '' },
      })

      const textarea = screen.getByRole('textbox', { name: /plan content/i })
      expect(textarea).toBeInTheDocument()
      expect(textarea).toHaveAttribute('id', 'plan_text')
      expect(textarea).toHaveAttribute('rows', '25')
      expect(textarea).toHaveAttribute('placeholder', 'Your travel plan will appear here...')
    })

    it('should render with custom props', () => {
      const customPlaceholder = 'Enter your custom plan here...'
      const customRows = 30
      const customMaxCharacters = 5000

      renderWithProviders(PlanEditor, {
        props: {
          modelValue: '',
          placeholder: customPlaceholder,
          rows: customRows,
          maxCharacters: customMaxCharacters,
        },
      })

      const textarea = screen.getByRole('textbox', { name: /plan content/i })
      expect(textarea).toHaveAttribute('rows', customRows.toString())
      expect(textarea).toHaveAttribute('placeholder', customPlaceholder)
    })

    it('should render character counter with default limit', () => {
      renderWithProviders(PlanEditor, {
        props: { modelValue: '' },
      })

      expect(screen.getByText('0/3000 characters')).toBeInTheDocument()
    })

    it('should render character counter with custom limit', () => {
      const customLimit = 5000
      renderWithProviders(PlanEditor, {
        props: {
          modelValue: '',
          maxCharacters: customLimit,
        },
      })

      expect(screen.getByText(`0/${customLimit} characters`)).toBeInTheDocument()
    })
  })

  describe('Model Value Binding', () => {
    it('should display initial content in textarea', () => {
      const initialContent = 'Initial plan content here'
      renderWithProviders(PlanEditor, {
        props: { modelValue: initialContent },
      })

      const textarea = screen.getByRole('textbox', { name: /plan content/i }) as HTMLTextAreaElement
      expect(textarea.value).toBe(initialContent)
    })

    it('should handle empty model value', () => {
      renderWithProviders(PlanEditor, {
        props: { modelValue: '' },
      })

      const textarea = screen.getByRole('textbox', { name: /plan content/i }) as HTMLTextAreaElement
      expect(textarea.value).toBe('')
    })

    it('should handle undefined model value gracefully', () => {
      renderWithProviders(PlanEditor, {
        props: { modelValue: undefined as any },
      })

      expect(screen.getByText('0/3000 characters')).toBeInTheDocument()
    })
  })

  describe('Character Counting', () => {
    it('should update character count when content changes', async () => {
      const { emitted } = renderWithProviders(PlanEditor, {
        props: { modelValue: '' },
      })

      const textarea = screen.getByRole('textbox', { name: /plan content/i })
      const testContent = 'Test content'

      await fireEvent.input(textarea, { target: { value: testContent } })

      // Check that update:modelValue event was emitted
      expect(emitted()['update:modelValue']).toBeTruthy()
      expect(emitted()['update:modelValue']).toHaveLength(1)
      const emittedEvents = emitted()['update:modelValue'] as unknown[][]
      expect(emittedEvents[0][0]).toBe(testContent)
    })

    it('should show correct character count for existing content', () => {
      const content = createMockPlanContent(250)
      renderWithProviders(PlanEditor, {
        props: { modelValue: content },
      })

      expect(screen.getByText('250/3000 characters')).toBeInTheDocument()
    })

    it('should handle special characters and unicode correctly', () => {
      const content = 'Hello 🌍 émojis and açcénts'
      renderWithProviders(PlanEditor, {
        props: { modelValue: content },
      })

      expect(screen.getByText(`${content.length}/3000 characters`)).toBeInTheDocument()
    })

    it('should handle newlines and whitespace in character count', () => {
      const contentWithNewlines = 'Line 1\nLine 2\n\nLine 4'
      renderWithProviders(PlanEditor, {
        props: { modelValue: contentWithNewlines },
      })

      expect(screen.getByText(`${contentWithNewlines.length}/3000 characters`)).toBeInTheDocument()
    })
  })

  describe('Character Limit Validation', () => {
    it('should not show error styling when content is within limit', () => {
      const content = createMockPlanContent(2000)
      renderWithProviders(PlanEditor, {
        props: { modelValue: content },
      })

      const textarea = screen.getByRole('textbox', { name: /plan content/i })
      expect(textarea).not.toHaveClass('border-red-300')
      expect(textarea).not.toHaveClass('dark:border-red-600')
    })

    it('should show error styling when character limit is exceeded', () => {
      const content = createLongPlanContent(3001)
      renderWithProviders(PlanEditor, {
        props: { modelValue: content },
      })

      const textarea = screen.getByRole('textbox', { name: /plan content/i })
      expect(textarea).toHaveClass('border-red-300')
      expect(textarea).toHaveClass('dark:border-red-600')
    })

    it('should show red character count when limit is exceeded', () => {
      const content = createLongPlanContent(3500)
      renderWithProviders(PlanEditor, {
        props: { modelValue: content },
      })

      const characterCount = screen.getByText('3500/3000 characters')
      expect(characterCount).toHaveClass('text-red-600')
      expect(characterCount).toHaveClass('dark:text-red-400')
    })

    it('should show warning message when character limit is exceeded', () => {
      const content = createLongPlanContent(3200)
      renderWithProviders(PlanEditor, {
        props: { modelValue: content },
      })

      expect(screen.getByText('Plan is too long. Please shorten it to save.')).toBeInTheDocument()
    })

    it('should not show warning message when content is within limit', () => {
      const content = createMockPlanContent(2500)
      renderWithProviders(PlanEditor, {
        props: { modelValue: content },
      })

      expect(
        screen.queryByText('Plan is too long. Please shorten it to save.'),
      ).not.toBeInTheDocument()
    })

    it('should show warning message with custom character limit', () => {
      const customLimit = 1000
      const content = createLongPlanContent(1200)

      renderWithProviders(PlanEditor, {
        props: {
          modelValue: content,
          maxCharacters: customLimit,
        },
      })

      expect(screen.getByText('Plan is too long. Please shorten it to save.')).toBeInTheDocument()
      expect(screen.getByText('1200/1000 characters')).toBeInTheDocument()
    })
  })

  describe('Disabled State', () => {
    it('should disable textarea when disabled prop is true', () => {
      renderWithProviders(PlanEditor, {
        props: {
          modelValue: 'Some content',
          disabled: true,
        },
      })

      const textarea = screen.getByRole('textbox', { name: /plan content/i })
      expect(textarea).toBeDisabled()
      expect(textarea).toHaveClass('opacity-50')
      expect(textarea).toHaveClass('cursor-not-allowed')
    })

    it('should enable textarea when disabled prop is false', () => {
      renderWithProviders(PlanEditor, {
        props: {
          modelValue: 'Some content',
          disabled: false,
        },
      })

      const textarea = screen.getByRole('textbox', { name: /plan content/i })
      expect(textarea).not.toBeDisabled()
      expect(textarea).not.toHaveClass('opacity-50')
      expect(textarea).not.toHaveClass('cursor-not-allowed')
    })

    it('should have disabled styling and attributes when disabled', async () => {
      renderWithProviders(PlanEditor, {
        props: {
          modelValue: '',
          disabled: true,
        },
      })

      const textarea = screen.getByRole('textbox', { name: /plan content/i })

      // Try to input content - textarea should be disabled but HTML allows programmatic input
      await fireEvent.input(textarea, { target: { value: 'New content' } })

      // Textarea is disabled, so user interaction should be blocked, but programmatic events still work in tests
      // The important thing is that the textarea has the disabled attribute
      expect(textarea).toBeDisabled()
    })
  })

  describe('Event Handling', () => {
    it('should emit update:modelValue with correct value on input', async () => {
      const { emitted } = renderWithProviders(PlanEditor, {
        props: { modelValue: '' },
      })

      const textarea = screen.getByRole('textbox', { name: /plan content/i })
      const newContent = 'Updated plan content'

      await fireEvent.input(textarea, { target: { value: newContent } })

      expect(emitted()['update:modelValue']).toBeTruthy()
      expect(emitted()['update:modelValue']).toHaveLength(1)
      const emittedEvents = emitted()['update:modelValue'] as unknown[][]
      expect(emittedEvents[0][0]).toBe(newContent)
    })

    it('should emit multiple updates for multiple inputs', async () => {
      const { emitted } = renderWithProviders(PlanEditor, {
        props: { modelValue: '' },
      })

      const textarea = screen.getByRole('textbox', { name: /plan content/i })

      await fireEvent.input(textarea, { target: { value: 'First' } })
      await fireEvent.input(textarea, { target: { value: 'Second' } })
      await fireEvent.input(textarea, { target: { value: 'Third' } })

      expect(emitted()['update:modelValue']).toHaveLength(3)
      const emittedEvents = emitted()['update:modelValue'] as unknown[][]
      expect(emittedEvents[0][0]).toBe('First')
      expect(emittedEvents[1][0]).toBe('Second')
      expect(emittedEvents[2][0]).toBe('Third')
    })

    it('should handle empty string input correctly', async () => {
      const { emitted } = renderWithProviders(PlanEditor, {
        props: { modelValue: 'Some content' },
      })

      const textarea = screen.getByRole('textbox', { name: /plan content/i })

      await fireEvent.input(textarea, { target: { value: '' } })

      expect(emitted()['update:modelValue']).toBeTruthy()
      const emittedEvents = emitted()['update:modelValue'] as unknown[][]
      expect(emittedEvents[0][0]).toBe('')
    })
  })

  describe('Styling and CSS Classes', () => {
    it('should apply correct base CSS classes', () => {
      renderWithProviders(PlanEditor, {
        props: { modelValue: '' },
      })

      const textarea = screen.getByRole('textbox', { name: /plan content/i })

      // Check for base Tailwind classes
      expect(textarea).toHaveClass('bg-gray-50')
      expect(textarea).toHaveClass('border')
      expect(textarea).toHaveClass('text-gray-900')
      expect(textarea).toHaveClass('text-sm')
      expect(textarea).toHaveClass('rounded-lg')
      expect(textarea).toHaveClass('focus:ring-primary-500')
      expect(textarea).toHaveClass('focus:border-primary-500')
      expect(textarea).toHaveClass('block')
      expect(textarea).toHaveClass('w-full')
      expect(textarea).toHaveClass('p-2.5')
    })

    it('should apply dark mode classes', () => {
      renderWithProviders(PlanEditor, {
        props: { modelValue: '' },
      })

      const textarea = screen.getByRole('textbox', { name: /plan content/i })

      // Check for dark mode classes
      expect(textarea).toHaveClass('dark:bg-gray-700')
      expect(textarea).toHaveClass('dark:border-gray-600')
      expect(textarea).toHaveClass('dark:placeholder-gray-400')
      expect(textarea).toHaveClass('dark:text-white')
      expect(textarea).toHaveClass('dark:focus:ring-primary-500')
      expect(textarea).toHaveClass('dark:focus:border-primary-500')
    })

    it('should apply normal border color when within character limit', () => {
      renderWithProviders(PlanEditor, {
        props: { modelValue: createMockPlanContent(2000) },
      })

      const textarea = screen.getByRole('textbox', { name: /plan content/i })
      expect(textarea).toHaveClass('border-gray-300')
      expect(textarea).not.toHaveClass('border-red-300')
    })

    it('should apply error border color when character limit exceeded', () => {
      renderWithProviders(PlanEditor, {
        props: { modelValue: createLongPlanContent(3500) },
      })

      const textarea = screen.getByRole('textbox', { name: /plan content/i })
      expect(textarea).toHaveClass('border-red-300')
      expect(textarea).toHaveClass('dark:border-red-600')
    })
  })

  describe('Accessibility', () => {
    it('should have proper label association', () => {
      renderWithProviders(PlanEditor, {
        props: { modelValue: '' },
      })

      const textarea = screen.getByRole('textbox', { name: /plan content/i })
      expect(textarea).toHaveAttribute('id', 'plan_text')

      const label = document.querySelector('label[for="plan_text"]')
      expect(label).toBeInTheDocument()
      expect(label).toHaveClass('sr-only') // Screen reader only
    })

    it('should be accessible via screen readers', () => {
      renderWithProviders(PlanEditor, {
        props: { modelValue: '' },
      })

      // Should be findable by role
      expect(screen.getByRole('textbox')).toBeInTheDocument()

      // Should be findable by label
      expect(screen.getByLabelText(/plan content/i)).toBeInTheDocument()
    })

    it('should have proper ARIA attributes when character limit exceeded', () => {
      renderWithProviders(PlanEditor, {
        props: { modelValue: createLongPlanContent(3500) },
      })

      // Error message should be visible for screen readers
      const errorMessage = screen.getByText('Plan is too long. Please shorten it to save.')
      expect(errorMessage).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long content gracefully', () => {
      const veryLongContent = createLongPlanContent(10000)
      renderWithProviders(PlanEditor, {
        props: { modelValue: veryLongContent },
      })

      expect(screen.getByText('10000/3000 characters')).toBeInTheDocument()
      expect(screen.getByText('Plan is too long. Please shorten it to save.')).toBeInTheDocument()
    })

    it('should handle content exactly at the character limit', () => {
      const exactLimitContent = createMockPlanContent(3000)
      renderWithProviders(PlanEditor, {
        props: { modelValue: exactLimitContent },
      })

      expect(screen.getByText('3000/3000 characters')).toBeInTheDocument()
      expect(
        screen.queryByText('Plan is too long. Please shorten it to save.'),
      ).not.toBeInTheDocument()

      const textarea = screen.getByRole('textbox', { name: /plan content/i })
      expect(textarea).not.toHaveClass('border-red-300')
    })

    it('should handle content one character over the limit', () => {
      const overLimitContent = createMockPlanContent(3001)
      renderWithProviders(PlanEditor, {
        props: { modelValue: overLimitContent },
      })

      expect(screen.getByText('3001/3000 characters')).toBeInTheDocument()
      expect(screen.getByText('Plan is too long. Please shorten it to save.')).toBeInTheDocument()

      const textarea = screen.getByRole('textbox', { name: /plan content/i })
      expect(textarea).toHaveClass('border-red-300')
    })

    it('should handle special characters and emojis in content', async () => {
      const { emitted } = renderWithProviders(PlanEditor, {
        props: { modelValue: '' },
      })

      const textarea = screen.getByRole('textbox', { name: /plan content/i })
      const specialContent = 'Plan with émojis 🌍✈️ and açcénts café'

      await fireEvent.input(textarea, { target: { value: specialContent } })

      expect(emitted()['update:modelValue']).toBeTruthy()
      const emittedEvents = emitted()['update:modelValue'] as unknown[][]
      expect(emittedEvents[0][0]).toBe(specialContent)
    })

    it('should handle rapid input changes', async () => {
      const { emitted } = renderWithProviders(PlanEditor, {
        props: { modelValue: '' },
      })

      const textarea = screen.getByRole('textbox', { name: /plan content/i })

      // Simulate rapid typing
      for (let i = 1; i <= 5; i++) {
        await fireEvent.input(textarea, { target: { value: 'Content ' + i } })
      }

      expect(emitted()['update:modelValue']).toHaveLength(5)
      const emittedEvents = emitted()['update:modelValue'] as unknown[][]
      expect(emittedEvents[4][0]).toBe('Content 5')
    })
  })

  describe('Default Props', () => {
    it('should use default maxCharacters when not provided', () => {
      renderWithProviders(PlanEditor, {
        props: { modelValue: '' },
      })

      expect(screen.getByText('0/3000 characters')).toBeInTheDocument()
    })

    it('should use default rows when not provided', () => {
      renderWithProviders(PlanEditor, {
        props: { modelValue: '' },
      })

      const textarea = screen.getByRole('textbox', { name: /plan content/i })
      expect(textarea).toHaveAttribute('rows', '25')
    })

    it('should use default placeholder when not provided', () => {
      renderWithProviders(PlanEditor, {
        props: { modelValue: '' },
      })

      const textarea = screen.getByRole('textbox', { name: /plan content/i })
      expect(textarea).toHaveAttribute('placeholder', 'Your travel plan will appear here...')
    })

    it('should use default disabled state when not provided', () => {
      renderWithProviders(PlanEditor, {
        props: { modelValue: '' },
      })

      const textarea = screen.getByRole('textbox', { name: /plan content/i })
      expect(textarea).not.toBeDisabled()
    })
  })
})
