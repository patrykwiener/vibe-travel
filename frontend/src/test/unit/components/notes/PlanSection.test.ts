import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, screen } from '@testing-library/vue'
import { renderWithProviders } from '@/test/utils'
import PlanSection from '@/components/notes/PlanSection.vue'
import type { PlanSectionProps } from '@/components/notes/PlanSection.vue'

// Helper to create mock props
const createMockProps = (overrides: Partial<PlanSectionProps> = {}): PlanSectionProps => ({
  planText: '',
  planType: null,
  isGenerating: false,
  isSaving: false,
  canSave: false,
  canDiscard: false,
  ...overrides,
})

// Helper to create plan text of specific length
const createPlanText = (length: number = 100) => {
  return 'A'.repeat(length)
}

// Helper to create long plan text that exceeds limits
const createLongPlanText = (length: number = 3001) => {
  return 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '
    .repeat(Math.ceil(length / 57))
    .substring(0, length)
}

describe('PlanSection - Core Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render the travel plan heading', () => {
      renderWithProviders(PlanSection, {
        props: createMockProps(),
      })

      expect(screen.getByText('Travel Plan')).toBeInTheDocument()
    })

    it('should render the generate plan button', () => {
      renderWithProviders(PlanSection, {
        props: createMockProps(),
      })

      const generateButton = screen.getByRole('button', { name: /generate plan/i })
      expect(generateButton).toBeInTheDocument()
      expect(generateButton).toHaveClass('bg-primary-700')
    })

    it('should render the save changes button', () => {
      renderWithProviders(PlanSection, {
        props: createMockProps({ canSave: true }),
      })

      const saveButton = screen.getByRole('button', { name: /save changes/i })
      expect(saveButton).toBeInTheDocument()
      expect(saveButton).toHaveClass('bg-primary-700')
    })

    it('should render the discard changes button when canDiscard is true', () => {
      renderWithProviders(PlanSection, {
        props: createMockProps({ canDiscard: true }),
      })

      const discardButton = screen.getByRole('button', { name: /discard changes/i })
      expect(discardButton).toBeInTheDocument()
      expect(discardButton).toHaveClass('bg-white')
    })

    it('should not render discard button when canDiscard is false', () => {
      renderWithProviders(PlanSection, {
        props: createMockProps({ canDiscard: false }),
      })

      expect(screen.queryByRole('button', { name: /discard changes/i })).not.toBeInTheDocument()
    })
  })

  describe('Button States and Interactions', () => {
    it('should show "Generating..." text when isGenerating is true', () => {
      renderWithProviders(PlanSection, {
        props: createMockProps({ isGenerating: true }),
      })

      expect(screen.getByText('Generating...')).toBeInTheDocument()
      expect(screen.queryByText('Generate Plan')).not.toBeInTheDocument()
    })

    it('should disable generate button when isGenerating is true', () => {
      renderWithProviders(PlanSection, {
        props: createMockProps({ isGenerating: true }),
      })

      const generateButton = screen.getByRole('button', { name: /generating/i })
      expect(generateButton).toBeDisabled()
      expect(generateButton).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed')
    })

    it('should show "Saving..." text when isSaving is true', () => {
      renderWithProviders(PlanSection, {
        props: createMockProps({ isSaving: true, canSave: true }),
      })

      expect(screen.getByText('Saving...')).toBeInTheDocument()
      expect(screen.queryByText('Save Changes')).not.toBeInTheDocument()
    })

    it('should disable save button when isSaving is true', () => {
      renderWithProviders(PlanSection, {
        props: createMockProps({ isSaving: true, canSave: true }),
      })

      const saveButton = screen.getByRole('button', { name: /saving/i })
      expect(saveButton).toBeDisabled()
    })

    it('should disable save button when canSave is false', () => {
      renderWithProviders(PlanSection, {
        props: createMockProps({ canSave: false }),
      })

      const saveButton = screen.getByRole('button', { name: /save changes/i })
      expect(saveButton).toBeDisabled()
    })

    it('should disable discard button when isSaving is true', () => {
      renderWithProviders(PlanSection, {
        props: createMockProps({ isSaving: true, canDiscard: true }),
      })

      const discardButton = screen.getByRole('button', { name: /discard changes/i })
      expect(discardButton).toBeDisabled()
    })

    it('should emit generate event when generate button is clicked', async () => {
      const { emitted } = renderWithProviders(PlanSection, {
        props: createMockProps(),
      })

      const generateButton = screen.getByRole('button', { name: /generate plan/i })
      await fireEvent.click(generateButton)

      expect(emitted().generate).toBeTruthy()
      expect(emitted().generate).toHaveLength(1)
    })

    it('should emit save event when save button is clicked', async () => {
      const { emitted } = renderWithProviders(PlanSection, {
        props: createMockProps({ canSave: true }),
      })

      const saveButton = screen.getByRole('button', { name: /save changes/i })
      await fireEvent.click(saveButton)

      expect(emitted().save).toBeTruthy()
      expect(emitted().save).toHaveLength(1)
    })

    it('should emit discard event when discard button is clicked', async () => {
      const { emitted } = renderWithProviders(PlanSection, {
        props: createMockProps({ canDiscard: true }),
      })

      const discardButton = screen.getByRole('button', { name: /discard changes/i })
      await fireEvent.click(discardButton)

      expect(emitted().discard).toBeTruthy()
      expect(emitted().discard).toHaveLength(1)
    })
  })

  describe('Character Limit Validation', () => {
    it('should disable save button when character limit is exceeded', () => {
      const longText = createLongPlanText(3500)
      renderWithProviders(PlanSection, {
        props: createMockProps({
          planText: longText,
          canSave: true,
        }),
      })

      const saveButton = screen.getByRole('button', { name: /save changes/i })
      expect(saveButton).toBeDisabled()
    })

    it('should enable save button when character limit is not exceeded', () => {
      const normalText = createPlanText(2000)
      renderWithProviders(PlanSection, {
        props: createMockProps({
          planText: normalText,
          canSave: true,
        }),
      })

      const saveButton = screen.getByRole('button', { name: /save changes/i })
      expect(saveButton).not.toBeDisabled()
    })

    it('should handle exactly 3000 characters correctly', () => {
      const exactLimitText = createPlanText(3000)
      renderWithProviders(PlanSection, {
        props: createMockProps({
          planText: exactLimitText,
          canSave: true,
        }),
      })

      const saveButton = screen.getByRole('button', { name: /save changes/i })
      expect(saveButton).not.toBeDisabled()
    })

    it('should disable save button for 3001 characters', () => {
      const overLimitText = createPlanText(3001)
      renderWithProviders(PlanSection, {
        props: createMockProps({
          planText: overLimitText,
          canSave: true,
        }),
      })

      const saveButton = screen.getByRole('button', { name: /save changes/i })
      expect(saveButton).toBeDisabled()
    })
  })

  describe('Plan Text Updates', () => {
    it('should emit update:planText when PlanEditor text changes', async () => {
      const { emitted } = renderWithProviders(PlanSection, {
        props: createMockProps({ planText: '' }),
      })

      const textarea = screen.getByRole('textbox', { name: /plan content/i })
      const newText = 'Updated plan content'

      await fireEvent.input(textarea, { target: { value: newText } })

      expect(emitted()['update:planText']).toBeTruthy()
      expect(emitted()['update:planText']).toHaveLength(1)
      const emittedEvents = emitted()['update:planText'] as unknown[][]
      expect(emittedEvents[0][0]).toBe(newText)
    })

    it('should pass current planText to PlanEditor', () => {
      const initialText = 'Initial plan content'
      renderWithProviders(PlanSection, {
        props: createMockProps({ planText: initialText }),
      })

      const textarea = screen.getByRole('textbox', { name: /plan content/i }) as HTMLTextAreaElement
      expect(textarea.value).toBe(initialText)
    })

    it('should handle empty planText gracefully', () => {
      renderWithProviders(PlanSection, {
        props: createMockProps({ planText: '' }),
      })

      const textarea = screen.getByRole('textbox', { name: /plan content/i }) as HTMLTextAreaElement
      expect(textarea.value).toBe('')
    })

    it('should handle null or undefined planText gracefully', () => {
      renderWithProviders(PlanSection, {
        props: createMockProps({ planText: null as any }),
      })

      const textarea = screen.getByRole('textbox', { name: /plan content/i }) as HTMLTextAreaElement
      expect(textarea.value).toBe('')
    })
  })

  describe('Plan Type Integration', () => {
    it('should pass planType to PlanTypeLabel component', () => {
      renderWithProviders(PlanSection, {
        props: createMockProps({ planType: 'AI' }),
      })

      // The PlanTypeLabel should be rendered - we can check for its output
      expect(screen.getByText('AI Generated')).toBeInTheDocument()
    })

    it('should pass isDraft correctly to PlanTypeLabel when canSave is true', () => {
      renderWithProviders(PlanSection, {
        props: createMockProps({ planType: 'AI', canSave: true }),
      })

      expect(screen.getByText('Draft')).toBeInTheDocument()
    })

    it('should not show draft label when canSave is false', () => {
      renderWithProviders(PlanSection, {
        props: createMockProps({ planType: 'AI', canSave: false }),
      })

      expect(screen.queryByText('Draft')).not.toBeInTheDocument()
    })

    it('should handle different plan types correctly', () => {
      // Test MANUAL plan type
      const { unmount: unmountManual } = renderWithProviders(PlanSection, {
        props: createMockProps({ planType: 'MANUAL' }),
      })
      expect(screen.getByText('Manual')).toBeInTheDocument()
      unmountManual()

      // Test HYBRID plan type
      const { unmount: unmountHybrid } = renderWithProviders(PlanSection, {
        props: createMockProps({ planType: 'HYBRID' }),
      })
      expect(screen.getByText('Hybrid')).toBeInTheDocument()
      unmountHybrid()

      // Test null plan type
      renderWithProviders(PlanSection, {
        props: createMockProps({ planType: null }),
      })
      expect(screen.queryByText('AI Generated')).not.toBeInTheDocument()
      expect(screen.queryByText('Manual')).not.toBeInTheDocument()
      expect(screen.queryByText('Hybrid')).not.toBeInTheDocument()
    })
  })

  describe('PlanEditor Integration', () => {
    it('should pass disabled state to PlanEditor when isGenerating is true', () => {
      renderWithProviders(PlanSection, {
        props: createMockProps({ isGenerating: true }),
      })

      const textarea = screen.getByRole('textbox', { name: /plan content/i })
      expect(textarea).toBeDisabled()
    })

    it('should not disable PlanEditor when isGenerating is false', () => {
      renderWithProviders(PlanSection, {
        props: createMockProps({ isGenerating: false }),
      })

      const textarea = screen.getByRole('textbox', { name: /plan content/i })
      expect(textarea).not.toBeDisabled()
    })

    it('should pass maxCharacters to PlanEditor', () => {
      renderWithProviders(PlanSection, {
        props: createMockProps(),
      })

      // PlanEditor should show character counter with max 3000
      expect(screen.getByText('0/3000 characters')).toBeInTheDocument()
    })
  })

  describe('Responsive Layout', () => {
    it('should have responsive flex classes for different screen sizes', () => {
      renderWithProviders(PlanSection, {
        props: createMockProps(),
      })

      const headerContainer = document.querySelector('.flex.flex-col.md\\:flex-row')
      expect(headerContainer).toBeInTheDocument()
      expect(headerContainer).toHaveClass('md:items-center', 'md:justify-between')
    })

    it('should have proper spacing classes', () => {
      renderWithProviders(PlanSection, {
        props: createMockProps(),
      })

      const mainContainer = document.querySelector('.mb-10')
      expect(mainContainer).toBeInTheDocument()

      const headerContainer = document.querySelector('.mb-4')
      expect(headerContainer).toBeInTheDocument()
    })
  })

  describe('Loading States Interaction', () => {
    it('should not allow interactions when both isGenerating and isSaving are true', () => {
      renderWithProviders(PlanSection, {
        props: createMockProps({
          isGenerating: true,
          isSaving: true,
          canSave: true,
          canDiscard: true,
        }),
      })

      const generateButton = screen.getByRole('button', { name: /generating/i })
      const saveButton = screen.getByRole('button', { name: /saving/i })
      const discardButton = screen.getByRole('button', { name: /discard changes/i })
      const textarea = screen.getByRole('textbox', { name: /plan content/i })

      expect(generateButton).toBeDisabled()
      expect(saveButton).toBeDisabled()
      expect(discardButton).toBeDisabled()
      expect(textarea).toBeDisabled()
    })

    it('should allow all interactions when no loading states are active', () => {
      renderWithProviders(PlanSection, {
        props: createMockProps({
          isGenerating: false,
          isSaving: false,
          canSave: true,
          canDiscard: true,
        }),
      })

      const generateButton = screen.getByRole('button', { name: /generate plan/i })
      const saveButton = screen.getByRole('button', { name: /save changes/i })
      const discardButton = screen.getByRole('button', { name: /discard changes/i })
      const textarea = screen.getByRole('textbox', { name: /plan content/i })

      expect(generateButton).not.toBeDisabled()
      expect(saveButton).not.toBeDisabled()
      expect(discardButton).not.toBeDisabled()
      expect(textarea).not.toBeDisabled()
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle rapid button clicks gracefully', async () => {
      const { emitted } = renderWithProviders(PlanSection, {
        props: createMockProps({ canSave: true }),
      })

      const saveButton = screen.getByRole('button', { name: /save changes/i })

      // Simulate rapid clicks
      await fireEvent.click(saveButton)
      await fireEvent.click(saveButton)
      await fireEvent.click(saveButton)

      expect(emitted().save).toHaveLength(3)
    })

    it('should handle simultaneous prop changes correctly', () => {
      // Test with initial state
      const { unmount: unmountInitial } = renderWithProviders(PlanSection, {
        props: createMockProps({
          isGenerating: false,
          isSaving: false,
          canSave: false,
        }),
      })

      const generateButton = screen.getByRole('button', { name: /generate plan/i })
      expect(generateButton).not.toBeDisabled()
      unmountInitial()

      // Test with multiple loading states active
      renderWithProviders(PlanSection, {
        props: createMockProps({
          isGenerating: true,
          isSaving: true,
          canSave: true,
          canDiscard: true,
        }),
      })

      const generatingButton = screen.getByRole('button', { name: /generating/i })
      const savingButton = screen.getByRole('button', { name: /saving/i })
      const discardButton = screen.getByRole('button', { name: /discard changes/i })

      expect(generatingButton).toBeDisabled()
      expect(savingButton).toBeDisabled()
      expect(discardButton).toBeDisabled()
    })

    it('should handle special characters in planText', async () => {
      const specialText = 'Plan with émojis 🌍 and açcénts'
      const { emitted } = renderWithProviders(PlanSection, {
        props: createMockProps({ planText: specialText }),
      })

      const textarea = screen.getByRole('textbox', { name: /plan content/i })
      const newSpecialText = 'Updated plan with special chars: ñ ü €'

      await fireEvent.input(textarea, { target: { value: newSpecialText } })

      expect(emitted()['update:planText']).toBeTruthy()
      const emittedEvents = emitted()['update:planText'] as unknown[][]
      expect(emittedEvents[0][0]).toBe(newSpecialText)
    })

    it('should handle newlines and whitespace in planText', async () => {
      const textWithNewlines = 'Line 1\nLine 2\n\nLine 4'
      renderWithProviders(PlanSection, {
        props: createMockProps({ planText: textWithNewlines }),
      })

      const textarea = screen.getByRole('textbox', { name: /plan content/i }) as HTMLTextAreaElement
      expect(textarea.value).toBe(textWithNewlines)
    })
  })

  describe('Accessibility', () => {
    it('should have proper button accessibility attributes', () => {
      renderWithProviders(PlanSection, {
        props: createMockProps({ canSave: true, canDiscard: true }),
      })

      const generateButton = screen.getByRole('button', { name: /generate plan/i })
      const saveButton = screen.getByRole('button', { name: /save changes/i })
      const discardButton = screen.getByRole('button', { name: /discard changes/i })

      expect(generateButton).toHaveAttribute('type', 'button')
      expect(saveButton).toHaveAttribute('type', 'button')
      expect(discardButton).toHaveAttribute('type', 'button')
    })

    it('should properly communicate loading states to screen readers', () => {
      renderWithProviders(PlanSection, {
        props: createMockProps({
          isGenerating: true,
          isSaving: true,
          canSave: true,
        }),
      })

      // Screen readers should get clear loading information
      expect(screen.getByText('Generating...')).toBeInTheDocument()
      expect(screen.getByText('Saving...')).toBeInTheDocument()
    })

    it('should have proper heading hierarchy', () => {
      renderWithProviders(PlanSection, {
        props: createMockProps(),
      })

      const heading = screen.getByRole('heading', { name: /travel plan/i })
      expect(heading).toBeInTheDocument()
      expect(heading.tagName).toBe('H3')
    })
  })

  describe('Component Integration', () => {
    it('should integrate correctly with PlanEditor component', () => {
      renderWithProviders(PlanSection, {
        props: createMockProps({ planText: 'Test content' }),
      })

      // Should render PlanEditor with correct props
      const textarea = screen.getByRole('textbox', { name: /plan content/i })
      expect(textarea).toBeInTheDocument()
      expect(textarea).toHaveAttribute('id', 'plan_text')
    })

    it('should integrate correctly with PlanTypeLabel component', () => {
      renderWithProviders(PlanSection, {
        props: createMockProps({ planType: 'AI', canSave: true }),
      })

      // Should render PlanTypeLabel with correct content
      expect(screen.getByText('AI Generated')).toBeInTheDocument()
      expect(screen.getByText('Draft')).toBeInTheDocument()
    })
  })

  describe('TypeScript Type Safety', () => {
    it('should maintain correct TypeScript types for props', () => {
      // This test ensures TypeScript types are correctly maintained
      const props = createMockProps()

      expect(typeof props.planText).toBe('string')
      expect(typeof props.isGenerating).toBe('boolean')
      expect(typeof props.isSaving).toBe('boolean')
      expect(typeof props.canSave).toBe('boolean')
      expect(typeof props.canDiscard).toBe('boolean')
      // planType can be string or null
      expect(['string', 'object']).toContain(typeof props.planType)
    })

    it('should handle all valid planType values', () => {
      const validPlanTypes: Array<'AI' | 'MANUAL' | 'HYBRID' | null> = [
        'AI',
        'MANUAL',
        'HYBRID',
        null,
      ]

      validPlanTypes.forEach((planType) => {
        const { unmount } = renderWithProviders(PlanSection, {
          props: createMockProps({ planType }),
        })

        // Should render without errors for each valid planType
        expect(screen.getByText('Travel Plan')).toBeInTheDocument()
        unmount()
      })
    })
  })
})
