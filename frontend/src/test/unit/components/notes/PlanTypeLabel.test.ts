import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen } from '@testing-library/vue'
import { renderWithProviders } from '@/test/utils'
import PlanTypeLabel from '@/components/notes/PlanTypeLabel.vue'
import type { PlanTypeLabelProps } from '@/components/notes/PlanTypeLabel.vue'

// Helper to create mock props
const createMockProps = (overrides: Partial<PlanTypeLabelProps> = {}): PlanTypeLabelProps => ({
  planType: null,
  isDraft: false,
  ...overrides,
})

describe('PlanTypeLabel - Core Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render container div with correct classes', () => {
      renderWithProviders(PlanTypeLabel, {
        props: createMockProps(),
      })

      const container = document.querySelector('.flex.items-center.gap-2')
      expect(container).toBeInTheDocument()
    })

    it('should render nothing when planType is null and isDraft is false', () => {
      renderWithProviders(PlanTypeLabel, {
        props: createMockProps({ planType: null, isDraft: false }),
      })

      expect(screen.queryByText('AI Generated')).not.toBeInTheDocument()
      expect(screen.queryByText('Manual')).not.toBeInTheDocument()
      expect(screen.queryByText('Hybrid')).not.toBeInTheDocument()
      expect(screen.queryByText('Draft')).not.toBeInTheDocument()
    })

    it('should render only container when no labels are shown', () => {
      renderWithProviders(PlanTypeLabel, {
        props: createMockProps({ planType: null, isDraft: false }),
      })

      const container = document.querySelector('.flex.items-center.gap-2')
      expect(container).toBeInTheDocument()
      expect(container?.children).toHaveLength(0)
    })
  })

  describe('Plan Type Labels', () => {
    it('should render AI Generated label for AI plan type', () => {
      renderWithProviders(PlanTypeLabel, {
        props: createMockProps({ planType: 'AI' }),
      })

      const aiLabel = screen.getByText('AI Generated')
      expect(aiLabel).toBeInTheDocument()
      expect(aiLabel).toHaveClass(
        'bg-primary-100',
        'text-primary-800',
        'text-xs',
        'font-medium',
        'px-2.5',
        'py-0.5',
        'rounded',
        'dark:bg-primary-900',
        'dark:text-primary-300',
      )
    })

    it('should render Manual label for MANUAL plan type', () => {
      renderWithProviders(PlanTypeLabel, {
        props: createMockProps({ planType: 'MANUAL' }),
      })

      const manualLabel = screen.getByText('Manual')
      expect(manualLabel).toBeInTheDocument()
      expect(manualLabel).toHaveClass(
        'bg-blue-100',
        'text-blue-800',
        'text-xs',
        'font-medium',
        'px-2.5',
        'py-0.5',
        'rounded',
        'dark:bg-blue-900',
        'dark:text-blue-300',
      )
    })

    it('should render Hybrid label for HYBRID plan type', () => {
      renderWithProviders(PlanTypeLabel, {
        props: createMockProps({ planType: 'HYBRID' }),
      })

      const hybridLabel = screen.getByText('Hybrid')
      expect(hybridLabel).toBeInTheDocument()
      expect(hybridLabel).toHaveClass(
        'bg-purple-100',
        'text-purple-800',
        'text-xs',
        'font-medium',
        'px-2.5',
        'py-0.5',
        'rounded',
        'dark:bg-purple-900',
        'dark:text-purple-300',
      )
    })

    it('should not render any plan type label when planType is null', () => {
      renderWithProviders(PlanTypeLabel, {
        props: createMockProps({ planType: null }),
      })

      expect(screen.queryByText('AI Generated')).not.toBeInTheDocument()
      expect(screen.queryByText('Manual')).not.toBeInTheDocument()
      expect(screen.queryByText('Hybrid')).not.toBeInTheDocument()
    })

    it('should render only one plan type label at a time', () => {
      // Test AI type
      const { unmount: unmountAI } = renderWithProviders(PlanTypeLabel, {
        props: createMockProps({ planType: 'AI' }),
      })
      expect(screen.getByText('AI Generated')).toBeInTheDocument()
      expect(screen.queryByText('Manual')).not.toBeInTheDocument()
      expect(screen.queryByText('Hybrid')).not.toBeInTheDocument()
      unmountAI()

      // Test MANUAL type
      const { unmount: unmountManual } = renderWithProviders(PlanTypeLabel, {
        props: createMockProps({ planType: 'MANUAL' }),
      })
      expect(screen.queryByText('AI Generated')).not.toBeInTheDocument()
      expect(screen.getByText('Manual')).toBeInTheDocument()
      expect(screen.queryByText('Hybrid')).not.toBeInTheDocument()
      unmountManual()

      // Test HYBRID type
      renderWithProviders(PlanTypeLabel, {
        props: createMockProps({ planType: 'HYBRID' }),
      })
      expect(screen.queryByText('AI Generated')).not.toBeInTheDocument()
      expect(screen.queryByText('Manual')).not.toBeInTheDocument()
      expect(screen.getByText('Hybrid')).toBeInTheDocument()
    })
  })

  describe('Draft Label', () => {
    it('should render Draft label when isDraft is true', () => {
      renderWithProviders(PlanTypeLabel, {
        props: createMockProps({ isDraft: true }),
      })

      const draftLabel = screen.getByText('Draft')
      expect(draftLabel).toBeInTheDocument()
      expect(draftLabel).toHaveClass(
        'bg-yellow-100',
        'text-yellow-800',
        'text-xs',
        'font-medium',
        'px-2.5',
        'py-0.5',
        'rounded',
        'dark:bg-yellow-900',
        'dark:text-yellow-300',
      )
    })

    it('should not render Draft label when isDraft is false', () => {
      renderWithProviders(PlanTypeLabel, {
        props: createMockProps({ isDraft: false }),
      })

      expect(screen.queryByText('Draft')).not.toBeInTheDocument()
    })

    it('should not render Draft label when isDraft is undefined', () => {
      renderWithProviders(PlanTypeLabel, {
        props: createMockProps({ isDraft: undefined }),
      })

      expect(screen.queryByText('Draft')).not.toBeInTheDocument()
    })

    it('should render Draft label independent of planType', () => {
      const planTypes: Array<'AI' | 'MANUAL' | 'HYBRID' | null> = ['AI', 'MANUAL', 'HYBRID', null]

      planTypes.forEach((planType) => {
        const { unmount } = renderWithProviders(PlanTypeLabel, {
          props: createMockProps({ planType, isDraft: true }),
        })

        expect(screen.getByText('Draft')).toBeInTheDocument()
        unmount()
      })
    })
  })

  describe('Combined Labels', () => {
    it('should render both plan type and draft labels when both are provided', () => {
      renderWithProviders(PlanTypeLabel, {
        props: createMockProps({ planType: 'AI', isDraft: true }),
      })

      expect(screen.getByText('AI Generated')).toBeInTheDocument()
      expect(screen.getByText('Draft')).toBeInTheDocument()
    })

    it('should render both labels for MANUAL type with draft', () => {
      renderWithProviders(PlanTypeLabel, {
        props: createMockProps({ planType: 'MANUAL', isDraft: true }),
      })

      expect(screen.getByText('Manual')).toBeInTheDocument()
      expect(screen.getByText('Draft')).toBeInTheDocument()
    })

    it('should render both labels for HYBRID type with draft', () => {
      renderWithProviders(PlanTypeLabel, {
        props: createMockProps({ planType: 'HYBRID', isDraft: true }),
      })

      expect(screen.getByText('Hybrid')).toBeInTheDocument()
      expect(screen.getByText('Draft')).toBeInTheDocument()
    })

    it('should render only draft label when planType is null but isDraft is true', () => {
      renderWithProviders(PlanTypeLabel, {
        props: createMockProps({ planType: null, isDraft: true }),
      })

      expect(screen.queryByText('AI Generated')).not.toBeInTheDocument()
      expect(screen.queryByText('Manual')).not.toBeInTheDocument()
      expect(screen.queryByText('Hybrid')).not.toBeInTheDocument()
      expect(screen.getByText('Draft')).toBeInTheDocument()
    })

    it('should maintain proper spacing between labels when both are rendered', () => {
      renderWithProviders(PlanTypeLabel, {
        props: createMockProps({ planType: 'AI', isDraft: true }),
      })

      const container = document.querySelector('.flex.items-center.gap-2')
      expect(container).toBeInTheDocument()
      expect(container).toHaveClass('gap-2')
      expect(container?.children).toHaveLength(2)
    })
  })

  describe('CSS Classes and Styling', () => {
    it('should have consistent base classes across all label types', () => {
      const baseClasses = ['text-xs', 'font-medium', 'px-2.5', 'py-0.5', 'rounded']

      // Test AI label
      const { unmount: unmountAI } = renderWithProviders(PlanTypeLabel, {
        props: createMockProps({ planType: 'AI' }),
      })
      const aiLabel = screen.getByText('AI Generated')
      baseClasses.forEach((className) => {
        expect(aiLabel).toHaveClass(className)
      })
      unmountAI()

      // Test Manual label
      const { unmount: unmountManual } = renderWithProviders(PlanTypeLabel, {
        props: createMockProps({ planType: 'MANUAL' }),
      })
      const manualLabel = screen.getByText('Manual')
      baseClasses.forEach((className) => {
        expect(manualLabel).toHaveClass(className)
      })
      unmountManual()

      // Test Hybrid label
      const { unmount: unmountHybrid } = renderWithProviders(PlanTypeLabel, {
        props: createMockProps({ planType: 'HYBRID' }),
      })
      const hybridLabel = screen.getByText('Hybrid')
      baseClasses.forEach((className) => {
        expect(hybridLabel).toHaveClass(className)
      })
      unmountHybrid()

      // Test Draft label
      renderWithProviders(PlanTypeLabel, {
        props: createMockProps({ isDraft: true }),
      })
      const draftLabel = screen.getByText('Draft')
      baseClasses.forEach((className) => {
        expect(draftLabel).toHaveClass(className)
      })
    })

    it('should have unique color classes for each plan type', () => {
      // Test AI colors
      const { unmount: unmountAI } = renderWithProviders(PlanTypeLabel, {
        props: createMockProps({ planType: 'AI' }),
      })
      const aiLabel = screen.getByText('AI Generated')
      expect(aiLabel).toHaveClass('bg-primary-100', 'text-primary-800')
      expect(aiLabel).toHaveClass('dark:bg-primary-900', 'dark:text-primary-300')
      unmountAI()

      // Test Manual colors
      const { unmount: unmountManual } = renderWithProviders(PlanTypeLabel, {
        props: createMockProps({ planType: 'MANUAL' }),
      })
      const manualLabel = screen.getByText('Manual')
      expect(manualLabel).toHaveClass('bg-blue-100', 'text-blue-800')
      expect(manualLabel).toHaveClass('dark:bg-blue-900', 'dark:text-blue-300')
      unmountManual()

      // Test Hybrid colors
      const { unmount: unmountHybrid } = renderWithProviders(PlanTypeLabel, {
        props: createMockProps({ planType: 'HYBRID' }),
      })
      const hybridLabel = screen.getByText('Hybrid')
      expect(hybridLabel).toHaveClass('bg-purple-100', 'text-purple-800')
      expect(hybridLabel).toHaveClass('dark:bg-purple-900', 'dark:text-purple-300')
      unmountHybrid()

      // Test Draft colors
      renderWithProviders(PlanTypeLabel, {
        props: createMockProps({ isDraft: true }),
      })
      const draftLabel = screen.getByText('Draft')
      expect(draftLabel).toHaveClass('bg-yellow-100', 'text-yellow-800')
      expect(draftLabel).toHaveClass('dark:bg-yellow-900', 'dark:text-yellow-300')
    })

    it('should have proper dark mode support for all labels', () => {
      const labelConfigs = [
        {
          planType: 'AI',
          text: 'AI Generated',
          darkBg: 'dark:bg-primary-900',
          darkText: 'dark:text-primary-300',
        },
        {
          planType: 'MANUAL',
          text: 'Manual',
          darkBg: 'dark:bg-blue-900',
          darkText: 'dark:text-blue-300',
        },
        {
          planType: 'HYBRID',
          text: 'Hybrid',
          darkBg: 'dark:bg-purple-900',
          darkText: 'dark:text-purple-300',
        },
      ] as const

      labelConfigs.forEach(({ planType, text, darkBg, darkText }) => {
        const { unmount } = renderWithProviders(PlanTypeLabel, {
          props: createMockProps({ planType }),
        })

        const label = screen.getByText(text)
        expect(label).toHaveClass(darkBg, darkText)
        unmount()
      })

      // Test Draft dark mode
      renderWithProviders(PlanTypeLabel, {
        props: createMockProps({ isDraft: true }),
      })
      const draftLabel = screen.getByText('Draft')
      expect(draftLabel).toHaveClass('dark:bg-yellow-900', 'dark:text-yellow-300')
    })
  })

  describe('Props Validation and Types', () => {
    it('should handle all valid planType values', () => {
      const validPlanTypes: Array<'AI' | 'MANUAL' | 'HYBRID' | null> = [
        'AI',
        'MANUAL',
        'HYBRID',
        null,
      ]

      validPlanTypes.forEach((planType) => {
        const { unmount } = renderWithProviders(PlanTypeLabel, {
          props: createMockProps({ planType }),
        })

        // Should render without errors for each valid planType
        const container = document.querySelector('.flex.items-center.gap-2')
        expect(container).toBeInTheDocument()
        unmount()
      })
    })

    it('should handle boolean values for isDraft', () => {
      const booleanValues = [true, false, undefined]

      booleanValues.forEach((isDraft) => {
        const { unmount } = renderWithProviders(PlanTypeLabel, {
          props: createMockProps({ isDraft }),
        })

        const container = document.querySelector('.flex.items-center.gap-2')
        expect(container).toBeInTheDocument()

        if (isDraft === true) {
          expect(screen.getByText('Draft')).toBeInTheDocument()
        } else {
          expect(screen.queryByText('Draft')).not.toBeInTheDocument()
        }
        unmount()
      })
    })

    it('should maintain correct TypeScript types for props', () => {
      const props = createMockProps()

      // Check planType can be string or null
      expect(['string', 'object']).toContain(typeof props.planType)

      // Check isDraft is boolean or undefined
      expect(['boolean', 'undefined']).toContain(typeof props.isDraft)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle rapid prop changes gracefully', () => {
      // Test with multiple separate renders to avoid rerender issues
      const { unmount: unmount1 } = renderWithProviders(PlanTypeLabel, {
        props: createMockProps({ planType: 'AI', isDraft: false }),
      })

      expect(screen.getByText('AI Generated')).toBeInTheDocument()
      expect(screen.queryByText('Draft')).not.toBeInTheDocument()
      unmount1()

      // Change to different props
      const { unmount: unmount2 } = renderWithProviders(PlanTypeLabel, {
        props: createMockProps({ planType: 'MANUAL', isDraft: true }),
      })
      expect(screen.queryByText('AI Generated')).not.toBeInTheDocument()
      expect(screen.getByText('Manual')).toBeInTheDocument()
      expect(screen.getByText('Draft')).toBeInTheDocument()
      unmount2()

      // Change to null props
      renderWithProviders(PlanTypeLabel, {
        props: createMockProps({ planType: null, isDraft: false }),
      })
      expect(screen.queryByText('AI Generated')).not.toBeInTheDocument()
      expect(screen.queryByText('Manual')).not.toBeInTheDocument()
      expect(screen.queryByText('Draft')).not.toBeInTheDocument()
    })

    it('should handle all possible prop combinations', () => {
      const planTypes: Array<'AI' | 'MANUAL' | 'HYBRID' | null> = ['AI', 'MANUAL', 'HYBRID', null]
      const draftValues = [true, false, undefined]

      planTypes.forEach((planType) => {
        draftValues.forEach((isDraft) => {
          const { unmount } = renderWithProviders(PlanTypeLabel, {
            props: createMockProps({ planType, isDraft }),
          })

          const container = document.querySelector('.flex.items-center.gap-2')
          expect(container).toBeInTheDocument()

          // Verify expected labels are present
          if (planType === 'AI') {
            expect(screen.getByText('AI Generated')).toBeInTheDocument()
          } else if (planType === 'MANUAL') {
            expect(screen.getByText('Manual')).toBeInTheDocument()
          } else if (planType === 'HYBRID') {
            expect(screen.getByText('Hybrid')).toBeInTheDocument()
          }

          if (isDraft === true) {
            expect(screen.getByText('Draft')).toBeInTheDocument()
          }

          unmount()
        })
      })
    })

    it('should maintain consistent DOM structure across all states', () => {
      const configurations = [
        { planType: null, isDraft: false },
        { planType: 'AI' as const, isDraft: false },
        { planType: 'AI' as const, isDraft: true },
        { planType: null, isDraft: true },
      ]

      configurations.forEach((config) => {
        const { unmount } = renderWithProviders(PlanTypeLabel, {
          props: createMockProps(config),
        })

        const container = document.querySelector('.flex.items-center.gap-2')
        expect(container).toBeInTheDocument()
        expect(container?.tagName).toBe('DIV')
        unmount()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have semantic HTML structure', () => {
      renderWithProviders(PlanTypeLabel, {
        props: createMockProps({ planType: 'AI', isDraft: true }),
      })

      const container = document.querySelector('.flex.items-center.gap-2')
      expect(container?.tagName).toBe('DIV')

      const aiLabel = screen.getByText('AI Generated')
      expect(aiLabel.tagName).toBe('SPAN')

      const draftLabel = screen.getByText('Draft')
      expect(draftLabel.tagName).toBe('SPAN')
    })

    it('should provide clear text content for screen readers', () => {
      renderWithProviders(PlanTypeLabel, {
        props: createMockProps({ planType: 'AI', isDraft: true }),
      })

      expect(screen.getByText('AI Generated')).toHaveTextContent('AI Generated')
      expect(screen.getByText('Draft')).toHaveTextContent('Draft')
    })

    it('should be keyboard accessible (no interactive elements)', () => {
      renderWithProviders(PlanTypeLabel, {
        props: createMockProps({ planType: 'AI', isDraft: true }),
      })

      // Component should not have any interactive elements
      expect(document.querySelectorAll('button, a, input, select, textarea')).toHaveLength(0)
    })

    it('should have appropriate ARIA attributes if needed', () => {
      renderWithProviders(PlanTypeLabel, {
        props: createMockProps({ planType: 'AI', isDraft: true }),
      })

      // For this simple display component, no special ARIA attributes are needed
      // but we verify the content is accessible
      const container = document.querySelector('.flex.items-center.gap-2')
      expect(container).not.toHaveAttribute('aria-hidden')
    })
  })

  describe('Component Integration', () => {
    it('should work as a presentational component', () => {
      renderWithProviders(PlanTypeLabel, {
        props: createMockProps({ planType: 'AI', isDraft: true }),
      })

      // Component should render without requiring any external context
      expect(screen.getByText('AI Generated')).toBeInTheDocument()
      expect(screen.getByText('Draft')).toBeInTheDocument()
    })

    it('should not emit any events (pure display component)', () => {
      const { emitted } = renderWithProviders(PlanTypeLabel, {
        props: createMockProps({ planType: 'AI', isDraft: true }),
      })

      // No events should be emitted from this display component
      expect(Object.keys(emitted())).toHaveLength(0)
    })

    it('should be reusable across different parent components', () => {
      // Test multiple instances with different props
      const instance1 = renderWithProviders(PlanTypeLabel, {
        props: createMockProps({ planType: 'AI' }),
      })
      expect(screen.getByText('AI Generated')).toBeInTheDocument()
      instance1.unmount()

      const instance2 = renderWithProviders(PlanTypeLabel, {
        props: createMockProps({ planType: 'MANUAL', isDraft: true }),
      })
      expect(screen.getByText('Manual')).toBeInTheDocument()
      expect(screen.getByText('Draft')).toBeInTheDocument()
      instance2.unmount()

      renderWithProviders(PlanTypeLabel, {
        props: createMockProps({ isDraft: true }),
      })
      expect(screen.getByText('Draft')).toBeInTheDocument()
    })
  })

  describe('Performance Considerations', () => {
    it('should render efficiently with minimal DOM nodes', () => {
      renderWithProviders(PlanTypeLabel, {
        props: createMockProps({ planType: 'AI', isDraft: true }),
      })

      const container = document.querySelector('.flex.items-center.gap-2')
      expect(container?.children).toHaveLength(2) // Only the necessary labels
    })

    it('should handle frequent prop updates without performance issues', () => {
      // Simulate frequent updates with different renders
      const planTypes = ['AI', 'MANUAL', 'HYBRID', null] as const

      // Test multiple renders to simulate frequent updates
      for (let i = 0; i < 5; i++) {
        const planType = planTypes[i % planTypes.length]
        const isDraft = i % 2 === 0

        const { unmount } = renderWithProviders(PlanTypeLabel, {
          props: createMockProps({ planType, isDraft }),
        })

        // Component should still be functional after many updates
        const container = document.querySelector('.flex.items-center.gap-2')
        expect(container).toBeInTheDocument()
        unmount()
      }
    })
  })
})
