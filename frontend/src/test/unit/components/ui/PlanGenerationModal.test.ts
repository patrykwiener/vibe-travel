import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, screen } from '@testing-library/vue'
import { renderWithProviders } from '@/test/utils'
import PlanGenerationModal from '@/components/ui/PlanGenerationModal.vue'

// Helper to create mock props
const createMockProps = (overrides: Partial<any> = {}) => ({
  show: true,
  isGenerating: false,
  hasUnsavedChanges: false,
  title: 'Generate Travel Plan',
  message: 'You have unsaved changes. Generating a new plan will discard them.',
  confirmText: 'Generate Plan',
  cancelText: 'Cancel',
  ...overrides,
})

describe('PlanGenerationModal - Core Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render modal when show is true', () => {
      renderWithProviders(PlanGenerationModal, {
        props: createMockProps(),
      })

      expect(screen.getByText('Generate Travel Plan')).toBeInTheDocument()
      // Look for the modal content div instead of role="dialog" since it's not implemented in the component
      expect(document.querySelector('.bg-white.rounded-lg')).toBeInTheDocument()
    })

    it('should not render modal when show is false', () => {
      renderWithProviders(PlanGenerationModal, {
        props: createMockProps({ show: false }),
      })

      expect(screen.queryByText('Generate Travel Plan')).not.toBeInTheDocument()
    })

    it('should render with custom title and message', () => {
      const customTitle = 'Custom Modal Title'
      const customMessage = 'This is a custom confirmation message.'

      renderWithProviders(PlanGenerationModal, {
        props: createMockProps({
          title: customTitle,
          message: customMessage,
          hasUnsavedChanges: true,
        }),
      })

      expect(screen.getByText(customTitle)).toBeInTheDocument()
      expect(screen.getByText(customMessage)).toBeInTheDocument()
    })

    it('should render with custom button texts', () => {
      renderWithProviders(PlanGenerationModal, {
        props: createMockProps({
          hasUnsavedChanges: true,
          confirmText: 'Proceed Anyway',
          cancelText: 'Go Back',
        }),
      })

      expect(screen.getByRole('button', { name: /proceed anyway/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument()
    })

    it('should render modal with proper backdrop and styling', () => {
      const { container } = renderWithProviders(PlanGenerationModal, {
        props: createMockProps(),
      })

      const backdrop = container.querySelector('.fixed.inset-0.z-50')
      expect(backdrop).toBeInTheDocument()
      expect(backdrop).toHaveClass('backdrop-blur-sm', 'bg-black/50')

      const modalContent = container.querySelector('.bg-white.rounded-lg.p-6')
      expect(modalContent).toBeInTheDocument()
      expect(modalContent).toHaveClass('max-w-md', 'w-full', 'mx-4', 'dark:bg-gray-800')
    })
  })

  describe('Loading States', () => {
    it('should show loading spinner when isGenerating is true', () => {
      renderWithProviders(PlanGenerationModal, {
        props: createMockProps({ isGenerating: true }),
      })

      expect(screen.getByText('Generating your travel plan...')).toBeInTheDocument()

      // Should show LoadingSpinner component
      const spinner = document.querySelector('svg')
      expect(spinner).toBeInTheDocument()
      expect(spinner).toHaveClass('animate-spin')
    })

    it('should not show buttons when isGenerating is true', () => {
      renderWithProviders(PlanGenerationModal, {
        props: createMockProps({ isGenerating: true, hasUnsavedChanges: true }),
      })

      expect(screen.queryByRole('button', { name: /generate plan/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument()
    })

    it('should show loading spinner when no unsaved changes and not generating', () => {
      renderWithProviders(PlanGenerationModal, {
        props: createMockProps({ isGenerating: false, hasUnsavedChanges: false }),
      })

      expect(screen.getByText('Generating your travel plan...')).toBeInTheDocument()

      // Should show LoadingSpinner component
      const spinner = document.querySelector('svg')
      expect(spinner).toBeInTheDocument()
    })

    it('should center loading content properly', () => {
      renderWithProviders(PlanGenerationModal, {
        props: createMockProps({ isGenerating: true }),
      })

      const loadingContainer = document.querySelector('.text-center.py-6')
      expect(loadingContainer).toBeInTheDocument()
    })
  })

  describe('Confirmation Flow', () => {
    it('should show confirmation content when hasUnsavedChanges is true and not generating', () => {
      renderWithProviders(PlanGenerationModal, {
        props: createMockProps({
          hasUnsavedChanges: true,
          isGenerating: false,
        }),
      })

      expect(
        screen.getByText('You have unsaved changes. Generating a new plan will discard them.'),
      ).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /generate plan/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('should not show confirmation when hasUnsavedChanges is false', () => {
      renderWithProviders(PlanGenerationModal, {
        props: createMockProps({
          hasUnsavedChanges: false,
          isGenerating: false,
        }),
      })

      expect(
        screen.queryByText('You have unsaved changes. Generating a new plan will discard them.'),
      ).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /generate plan/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument()
    })

    it('should show proper button styling', () => {
      renderWithProviders(PlanGenerationModal, {
        props: createMockProps({ hasUnsavedChanges: true }),
      })

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      expect(cancelButton).toHaveClass(
        'text-gray-900',
        'bg-white',
        'hover:bg-gray-100',
        'border',
        'border-gray-200',
      )

      const confirmButton = screen.getByRole('button', { name: /generate plan/i })
      expect(confirmButton).toHaveClass(
        'text-white',
        'bg-primary-700',
        'hover:bg-primary-800',
        'focus:ring-4',
        'focus:ring-primary-300',
      )
    })
  })

  describe('Event Handling', () => {
    it('should emit confirm event when confirm button is clicked', async () => {
      const { emitted } = renderWithProviders(PlanGenerationModal, {
        props: createMockProps({ hasUnsavedChanges: true }),
      })

      const confirmButton = screen.getByRole('button', { name: /generate plan/i })
      await fireEvent.click(confirmButton)

      expect(emitted().confirm).toBeTruthy()
      expect(emitted().confirm).toHaveLength(1)
      expect(emitted().confirm[0]).toEqual([])
    })

    it('should emit cancel event when cancel button is clicked', async () => {
      const { emitted } = renderWithProviders(PlanGenerationModal, {
        props: createMockProps({ hasUnsavedChanges: true }),
      })

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await fireEvent.click(cancelButton)

      expect(emitted().cancel).toBeTruthy()
      expect(emitted().cancel).toHaveLength(1)
      expect(emitted().cancel[0]).toEqual([])
    })

    it('should emit cancel event when backdrop is clicked', async () => {
      const { emitted, container } = renderWithProviders(PlanGenerationModal, {
        props: createMockProps({ hasUnsavedChanges: true }),
      })

      const backdrop = container.querySelector('.fixed.inset-0.z-50')
      await fireEvent.click(backdrop!)

      expect(emitted().cancel).toBeTruthy()
      expect(emitted().cancel).toHaveLength(1)
    })

    it('should not emit cancel when clicking on modal content', async () => {
      const { emitted, container } = renderWithProviders(PlanGenerationModal, {
        props: createMockProps({ hasUnsavedChanges: true }),
      })

      const modalContent = container.querySelector('.bg-white.rounded-lg.p-6')
      await fireEvent.click(modalContent!)

      expect(emitted().cancel).toBeFalsy()
    })

    it('should handle multiple rapid clicks correctly', async () => {
      const { emitted } = renderWithProviders(PlanGenerationModal, {
        props: createMockProps({ hasUnsavedChanges: true }),
      })

      const confirmButton = screen.getByRole('button', { name: /generate plan/i })

      await fireEvent.click(confirmButton)
      await fireEvent.click(confirmButton)
      await fireEvent.click(confirmButton)

      expect(emitted().confirm).toHaveLength(3)
    })
  })

  describe('Modal States', () => {
    it('should handle transition between different states', () => {
      // Test initial confirmation state
      const { unmount: unmount1 } = renderWithProviders(PlanGenerationModal, {
        props: createMockProps({ hasUnsavedChanges: true, isGenerating: false }),
      })

      expect(screen.getByRole('button', { name: /generate plan/i })).toBeInTheDocument()
      unmount1()

      // Test generating state
      renderWithProviders(PlanGenerationModal, {
        props: createMockProps({ hasUnsavedChanges: true, isGenerating: true }),
      })

      expect(screen.queryByRole('button', { name: /generate plan/i })).not.toBeInTheDocument()
      expect(screen.getByText('Generating your travel plan...')).toBeInTheDocument()
    })

    it('should handle all state combinations correctly', () => {
      const stateConfigs = [
        {
          hasUnsavedChanges: false,
          isGenerating: false,
          expectedSpinner: true,
          expectedButtons: false,
        },
        {
          hasUnsavedChanges: false,
          isGenerating: true,
          expectedSpinner: true,
          expectedButtons: false,
        },
        {
          hasUnsavedChanges: true,
          isGenerating: false,
          expectedSpinner: false,
          expectedButtons: true,
        },
        {
          hasUnsavedChanges: true,
          isGenerating: true,
          expectedSpinner: true,
          expectedButtons: false,
        },
      ]

      stateConfigs.forEach(
        ({ hasUnsavedChanges, isGenerating, expectedSpinner, expectedButtons }) => {
          const { unmount } = renderWithProviders(PlanGenerationModal, {
            props: createMockProps({ hasUnsavedChanges, isGenerating }),
          })

          if (expectedSpinner) {
            expect(screen.getByText('Generating your travel plan...')).toBeInTheDocument()
          }

          if (expectedButtons) {
            expect(screen.getByRole('button', { name: /generate plan/i })).toBeInTheDocument()
            expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
          } else {
            expect(screen.queryByRole('button', { name: /generate plan/i })).not.toBeInTheDocument()
            expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument()
          }

          unmount()
        },
      )
    })
  })

  describe('Accessibility', () => {
    it('should have proper modal semantics', () => {
      renderWithProviders(PlanGenerationModal, {
        props: createMockProps(),
      })

      const heading = screen.getByRole('heading', { level: 3 })
      expect(heading).toHaveTextContent('Generate Travel Plan')
      expect(heading).toHaveClass('text-lg', 'font-semibold')
    })

    it('should have properly typed buttons', () => {
      renderWithProviders(PlanGenerationModal, {
        props: createMockProps({ hasUnsavedChanges: true }),
      })

      const confirmButton = screen.getByRole('button', { name: /generate plan/i })
      const cancelButton = screen.getByRole('button', { name: /cancel/i })

      expect(confirmButton).toHaveAttribute('type', 'button')
      expect(cancelButton).toHaveAttribute('type', 'button')
    })

    it('should be keyboard accessible', async () => {
      renderWithProviders(PlanGenerationModal, {
        props: createMockProps({ hasUnsavedChanges: true }),
      })

      const confirmButton = screen.getByRole('button', { name: /generate plan/i })
      const cancelButton = screen.getByRole('button', { name: /cancel/i })

      // Buttons should be focusable
      confirmButton.focus()
      expect(document.activeElement).toBe(confirmButton)

      cancelButton.focus()
      expect(document.activeElement).toBe(cancelButton)
    })

    it('should have appropriate focus management', () => {
      renderWithProviders(PlanGenerationModal, {
        props: createMockProps({ hasUnsavedChanges: true }),
      })

      // Modal should contain focusable elements
      const focusableElements = document.querySelectorAll('button')
      expect(focusableElements.length).toBeGreaterThan(0)
    })

    it('should have proper color contrast for dark mode', () => {
      renderWithProviders(PlanGenerationModal, {
        props: createMockProps({ hasUnsavedChanges: true }),
      })

      const heading = screen.getByRole('heading')
      expect(heading).toHaveClass('text-gray-900', 'dark:text-white')

      const message = screen.getByText(/you have unsaved changes/i)
      expect(message).toHaveClass('text-gray-700', 'dark:text-gray-400')
    })
  })

  describe('Dark Mode Support', () => {
    it('should have dark mode classes for modal content', () => {
      const { container } = renderWithProviders(PlanGenerationModal, {
        props: createMockProps(),
      })

      const modalContent = container.querySelector('.bg-white.rounded-lg.p-6')
      expect(modalContent).toHaveClass('dark:bg-gray-800')
    })

    it('should have dark mode classes for buttons', () => {
      renderWithProviders(PlanGenerationModal, {
        props: createMockProps({ hasUnsavedChanges: true }),
      })

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      expect(cancelButton).toHaveClass(
        'dark:focus:ring-gray-600',
        'dark:bg-gray-800',
        'dark:border-gray-700',
        'dark:text-white',
        'dark:hover:bg-gray-700',
      )

      const confirmButton = screen.getByRole('button', { name: /generate plan/i })
      expect(confirmButton).toHaveClass(
        'dark:bg-primary-600',
        'dark:hover:bg-primary-700',
        'dark:focus:ring-primary-800',
      )
    })
  })

  describe('Props Validation', () => {
    it('should handle all required props correctly', () => {
      const requiredProps = {
        show: true,
        isGenerating: false,
        hasUnsavedChanges: true,
        title: 'Test Title',
        message: 'Test Message',
      }

      expect(() => {
        renderWithProviders(PlanGenerationModal, { props: requiredProps })
      }).not.toThrow()
    })

    it('should use default values for optional props', () => {
      renderWithProviders(PlanGenerationModal, {
        props: {
          show: true,
          isGenerating: false,
          hasUnsavedChanges: true,
          title: 'Test',
          message: 'Test message',
        },
      })

      // Should use default button texts
      expect(screen.getByRole('button', { name: /generate plan/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('should handle boolean props correctly', () => {
      const booleanConfigs = [
        { show: true, isGenerating: true, hasUnsavedChanges: true },
        { show: true, isGenerating: false, hasUnsavedChanges: false },
        { show: false, isGenerating: true, hasUnsavedChanges: true },
      ]

      booleanConfigs.forEach((config) => {
        expect(() => {
          const { unmount } = renderWithProviders(PlanGenerationModal, {
            props: createMockProps(config),
          })
          unmount()
        }).not.toThrow()
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long title text', () => {
      const longTitle = 'A'.repeat(100)
      renderWithProviders(PlanGenerationModal, {
        props: createMockProps({ title: longTitle }),
      })

      expect(screen.getByText(longTitle)).toBeInTheDocument()
    })

    it('should handle very long message text', () => {
      const longMessage = 'B'.repeat(500)
      renderWithProviders(PlanGenerationModal, {
        props: createMockProps({
          hasUnsavedChanges: true,
          message: longMessage,
        }),
      })

      expect(screen.getByText(longMessage)).toBeInTheDocument()
    })

    it('should handle special characters in text', () => {
      const specialTitle = 'Generate Plan 🌍 with émojis'
      const specialMessage = 'This message contains special chars: åçèñt & symbols!'

      renderWithProviders(PlanGenerationModal, {
        props: createMockProps({
          title: specialTitle,
          message: specialMessage,
          hasUnsavedChanges: true,
        }),
      })

      expect(screen.getByText(specialTitle)).toBeInTheDocument()
      expect(screen.getByText(specialMessage)).toBeInTheDocument()
    })

    it('should handle empty string props gracefully', () => {
      renderWithProviders(PlanGenerationModal, {
        props: createMockProps({
          title: '',
          message: '',
          confirmText: '',
          cancelText: '',
          hasUnsavedChanges: true,
        }),
      })

      // Should still render structure but with empty content
      expect(document.querySelector('h3')).toBeInTheDocument()
    })
  })

  describe('Component Integration', () => {
    it('should work with LoadingSpinner component', () => {
      renderWithProviders(PlanGenerationModal, {
        props: createMockProps({ isGenerating: true }),
      })

      // Should render LoadingSpinner with correct props
      const spinner = document.querySelector('svg')
      expect(spinner).toBeInTheDocument()
      expect(spinner).toHaveClass('w-6', 'h-6') // medium size
      expect(screen.getByText('Generating your travel plan...')).toBeInTheDocument()
    })

    it('should maintain consistent behavior across state changes', () => {
      // Test initial state: no unsaved changes, not generating - should show spinner
      const { unmount: unmount1 } = renderWithProviders(PlanGenerationModal, {
        props: createMockProps({ hasUnsavedChanges: false, isGenerating: false }),
      })

      expect(screen.getByText('Generating your travel plan...')).toBeInTheDocument()
      unmount1()

      // Test confirmation state: has unsaved changes, not generating - should show buttons
      const { unmount: unmount2 } = renderWithProviders(PlanGenerationModal, {
        props: createMockProps({ hasUnsavedChanges: true, isGenerating: false }),
      })

      expect(screen.getByRole('button', { name: /generate plan/i })).toBeInTheDocument()
      unmount2()

      // Test generating state: has unsaved changes, is generating - should show spinner only
      renderWithProviders(PlanGenerationModal, {
        props: createMockProps({ hasUnsavedChanges: true, isGenerating: true }),
      })

      expect(screen.getByText('Generating your travel plan...')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /generate plan/i })).not.toBeInTheDocument()
    })
  })

  describe('Performance Considerations', () => {
    it('should render efficiently without unnecessary DOM nodes', () => {
      const { container } = renderWithProviders(PlanGenerationModal, {
        props: createMockProps(),
      })

      // Should have minimal DOM structure
      const modalElements = container.querySelectorAll('*')
      expect(modalElements.length).toBeLessThan(20) // Reasonable limit for modal complexity
    })

    it('should handle rapid prop changes without issues', () => {
      const { rerender } = renderWithProviders(PlanGenerationModal, {
        props: createMockProps({ hasUnsavedChanges: false }),
      })

      // Rapidly change props
      for (let i = 0; i < 5; i++) {
        rerender({
          props: createMockProps({
            hasUnsavedChanges: i % 2 === 0,
            isGenerating: i % 3 === 0,
          }),
        })
      }

      // Should still render correctly
      expect(screen.getByText('Generate Travel Plan')).toBeInTheDocument()
    })
  })

  describe('TypeScript Type Safety', () => {
    it('should maintain correct prop types', () => {
      const typedProps = {
        show: true as boolean,
        isGenerating: false as boolean,
        hasUnsavedChanges: true as boolean,
        title: 'Type Safe Title' as string,
        message: 'Type safe message' as string,
        confirmText: 'Confirm' as string,
        cancelText: 'Cancel' as string,
      }

      expect(() => {
        renderWithProviders(PlanGenerationModal, { props: typedProps })
      }).not.toThrow()
    })

    it('should emit events with correct signatures', async () => {
      const { emitted } = renderWithProviders(PlanGenerationModal, {
        props: createMockProps({ hasUnsavedChanges: true }),
      })

      const confirmButton = screen.getByRole('button', { name: /generate plan/i })
      await fireEvent.click(confirmButton)

      expect(emitted().confirm).toBeTruthy()
      expect(emitted().confirm[0]).toEqual([]) // Should emit empty array
    })
  })
})
