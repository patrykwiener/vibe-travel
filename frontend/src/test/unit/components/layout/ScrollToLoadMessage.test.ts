import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen } from '@testing-library/vue'
import { renderWithProviders } from '@/test/utils'
import ScrollToLoadMessage from '@/components/layout/ScrollToLoadMessage.vue'

// Helper to create mock props
const createMockProps = (
  overrides: Partial<{
    totalLoaded: number
    totalAvailable: number
  }> = {},
) => ({
  totalLoaded: 5,
  totalAvailable: 10,
  ...overrides,
})

describe('ScrollToLoadMessage - Core Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render main container with correct styling when shouldShow is true', () => {
      const { container } = renderWithProviders(ScrollToLoadMessage, {
        props: createMockProps({ totalLoaded: 5, totalAvailable: 10 }),
      })

      const mainContainer = container.querySelector(
        '.flex.flex-col.items-center.justify-center.p-6.text-center',
      )
      expect(mainContainer).toBeInTheDocument()
    })

    it('should not render when totalLoaded is 0', () => {
      const { container } = renderWithProviders(ScrollToLoadMessage, {
        props: createMockProps({ totalLoaded: 0, totalAvailable: 10 }),
      })

      const mainContainer = container.querySelector(
        '.flex.flex-col.items-center.justify-center.p-6.text-center',
      )
      expect(mainContainer).not.toBeInTheDocument()
    })

    it('should not render when totalLoaded equals totalAvailable', () => {
      const { container } = renderWithProviders(ScrollToLoadMessage, {
        props: createMockProps({ totalLoaded: 10, totalAvailable: 10 }),
      })

      const mainContainer = container.querySelector(
        '.flex.flex-col.items-center.justify-center.p-6.text-center',
      )
      expect(mainContainer).not.toBeInTheDocument()
    })

    it('should not render when totalLoaded is greater than totalAvailable', () => {
      const { container } = renderWithProviders(ScrollToLoadMessage, {
        props: createMockProps({ totalLoaded: 12, totalAvailable: 10 }),
      })

      const mainContainer = container.querySelector(
        '.flex.flex-col.items-center.justify-center.p-6.text-center',
      )
      expect(mainContainer).not.toBeInTheDocument()
    })

    it('should render when there are items loaded and more available', () => {
      renderWithProviders(ScrollToLoadMessage, {
        props: createMockProps({ totalLoaded: 3, totalAvailable: 8 }),
      })

      expect(screen.getByText('Scroll down to load more notes')).toBeInTheDocument()
      expect(screen.getByText('5 more notes available (3 of 8 loaded)')).toBeInTheDocument()
    })
  })

  describe('Visibility Logic (shouldShow computed)', () => {
    it('should show when totalLoaded > 0 and totalLoaded < totalAvailable', () => {
      const testCases = [
        { totalLoaded: 1, totalAvailable: 2, shouldShow: true },
        { totalLoaded: 5, totalAvailable: 10, shouldShow: true },
        { totalLoaded: 50, totalAvailable: 100, shouldShow: true },
        { totalLoaded: 99, totalAvailable: 100, shouldShow: true },
      ]

      testCases.forEach(({ totalLoaded, totalAvailable, shouldShow }) => {
        const { container, unmount } = renderWithProviders(ScrollToLoadMessage, {
          props: createMockProps({ totalLoaded, totalAvailable }),
        })

        const mainContainer = container.querySelector(
          '.flex.flex-col.items-center.justify-center.p-6.text-center',
        )

        if (shouldShow) {
          expect(mainContainer).toBeInTheDocument()
        } else {
          expect(mainContainer).not.toBeInTheDocument()
        }

        unmount()
      })
    })

    it('should not show when totalLoaded is 0', () => {
      const testCases = [
        { totalLoaded: 0, totalAvailable: 0 },
        { totalLoaded: 0, totalAvailable: 5 },
        { totalLoaded: 0, totalAvailable: 100 },
      ]

      testCases.forEach(({ totalLoaded, totalAvailable }) => {
        const { container, unmount } = renderWithProviders(ScrollToLoadMessage, {
          props: createMockProps({ totalLoaded, totalAvailable }),
        })

        const mainContainer = container.querySelector(
          '.flex.flex-col.items-center.justify-center.p-6.text-center',
        )
        expect(mainContainer).not.toBeInTheDocument()

        unmount()
      })
    })

    it('should not show when totalLoaded >= totalAvailable', () => {
      const testCases = [
        { totalLoaded: 5, totalAvailable: 5 },
        { totalLoaded: 10, totalAvailable: 8 },
        { totalLoaded: 100, totalAvailable: 50 },
      ]

      testCases.forEach(({ totalLoaded, totalAvailable }) => {
        const { container, unmount } = renderWithProviders(ScrollToLoadMessage, {
          props: createMockProps({ totalLoaded, totalAvailable }),
        })

        const mainContainer = container.querySelector(
          '.flex.flex-col.items-center.justify-center.p-6.text-center',
        )
        expect(mainContainer).not.toBeInTheDocument()

        unmount()
      })
    })
  })

  describe('Remaining Count Logic', () => {
    it('should calculate remaining count correctly', () => {
      renderWithProviders(ScrollToLoadMessage, {
        props: createMockProps({ totalLoaded: 7, totalAvailable: 20 }),
      })

      // Remaining: 20 - 7 = 13
      expect(screen.getByText('13 more notes available (7 of 20 loaded)')).toBeInTheDocument()
    })

    it('should handle single remaining note correctly', () => {
      renderWithProviders(ScrollToLoadMessage, {
        props: createMockProps({ totalLoaded: 9, totalAvailable: 10 }),
      })

      // Remaining: 10 - 9 = 1 (should use singular "note")
      expect(screen.getByText('1 more note available (9 of 10 loaded)')).toBeInTheDocument()
    })

    it('should handle multiple remaining notes correctly', () => {
      renderWithProviders(ScrollToLoadMessage, {
        props: createMockProps({ totalLoaded: 2, totalAvailable: 15 }),
      })

      // Remaining: 15 - 2 = 13 (should use plural "notes")
      expect(screen.getByText('13 more notes available (2 of 15 loaded)')).toBeInTheDocument()
    })

    it('should handle large numbers correctly', () => {
      renderWithProviders(ScrollToLoadMessage, {
        props: createMockProps({ totalLoaded: 100, totalAvailable: 1000 }),
      })

      // Remaining: 1000 - 100 = 900
      expect(screen.getByText('900 more notes available (100 of 1000 loaded)')).toBeInTheDocument()
    })
  })

  describe('Icon Rendering and Animation', () => {
    it('should render animated down arrow icon with correct styling', () => {
      const { container } = renderWithProviders(ScrollToLoadMessage, {
        props: createMockProps({ totalLoaded: 5, totalAvailable: 10 }),
      })

      // Check for icon container with correct classes including animation
      const iconContainer = container.querySelector(
        '.w-8.h-8.mb-3.text-primary-500.dark\\:text-primary-400.animate-bounce',
      )
      expect(iconContainer).toBeInTheDocument()

      // Check for SVG element with correct classes
      const svg = iconContainer?.querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveClass('w-full', 'h-full')
    })

    it('should render correct down arrow icon path', () => {
      const { container } = renderWithProviders(ScrollToLoadMessage, {
        props: createMockProps({ totalLoaded: 3, totalAvailable: 7 }),
      })

      // Check for specific down arrow icon path
      const downArrowIcon = container.querySelector('svg path[d="M19 14l-7 7m0 0l-7-7m7 7V3"]')
      expect(downArrowIcon).toBeInTheDocument()
    })

    it('should have proper SVG attributes', () => {
      const { container } = renderWithProviders(ScrollToLoadMessage, {
        props: createMockProps({ totalLoaded: 4, totalAvailable: 9 }),
      })

      const svg = container.querySelector('svg')
      expect(svg).toHaveAttribute('fill', 'none')
      expect(svg).toHaveAttribute('stroke', 'currentColor')
      expect(svg).toHaveAttribute('viewBox', '0 0 24 24')
      expect(svg).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg')
    })

    it('should have proper path attributes', () => {
      const { container } = renderWithProviders(ScrollToLoadMessage, {
        props: createMockProps({ totalLoaded: 6, totalAvailable: 12 }),
      })

      const path = container.querySelector('svg path')
      expect(path).toHaveAttribute('stroke-linecap', 'round')
      expect(path).toHaveAttribute('stroke-linejoin', 'round')
      expect(path).toHaveAttribute('stroke-width', '1.5')
    })

    it('should have bounce animation class', () => {
      const { container } = renderWithProviders(ScrollToLoadMessage, {
        props: createMockProps({ totalLoaded: 2, totalAvailable: 8 }),
      })

      const iconContainer = container.querySelector('.animate-bounce')
      expect(iconContainer).toBeInTheDocument()
    })
  })

  describe('Message Content', () => {
    it('should display main instruction message', () => {
      renderWithProviders(ScrollToLoadMessage, {
        props: createMockProps({ totalLoaded: 5, totalAvailable: 15 }),
      })

      expect(screen.getByText('Scroll down to load more notes')).toBeInTheDocument()
    })

    it('should display detailed count information', () => {
      renderWithProviders(ScrollToLoadMessage, {
        props: createMockProps({ totalLoaded: 12, totalAvailable: 25 }),
      })

      expect(screen.getByText('13 more notes available (12 of 25 loaded)')).toBeInTheDocument()
    })

    it('should use singular form for one remaining note', () => {
      renderWithProviders(ScrollToLoadMessage, {
        props: createMockProps({ totalLoaded: 4, totalAvailable: 5 }),
      })

      // Should use "note" not "notes" for singular
      expect(screen.getByText('1 more note available (4 of 5 loaded)')).toBeInTheDocument()
    })

    it('should use plural form for multiple remaining notes', () => {
      renderWithProviders(ScrollToLoadMessage, {
        props: createMockProps({ totalLoaded: 3, totalAvailable: 10 }),
      })

      // Should use "notes" for plural
      expect(screen.getByText('7 more notes available (3 of 10 loaded)')).toBeInTheDocument()
    })

    it('should have correct text styling classes for main message', () => {
      renderWithProviders(ScrollToLoadMessage, {
        props: createMockProps({ totalLoaded: 5, totalAvailable: 10 }),
      })

      const mainMessage = screen.getByText('Scroll down to load more notes')
      expect(mainMessage).toHaveClass('text-sm', 'text-gray-600', 'dark:text-gray-300', 'mb-1')
    })

    it('should have correct text styling classes for detail message', () => {
      renderWithProviders(ScrollToLoadMessage, {
        props: createMockProps({ totalLoaded: 5, totalAvailable: 10 }),
      })

      const detailMessage = screen.getByText('5 more notes available (5 of 10 loaded)')
      expect(detailMessage).toHaveClass('text-xs', 'text-gray-500', 'dark:text-gray-400')
    })
  })

  describe('Dark Mode Support', () => {
    it('should have dark mode classes for icon', () => {
      const { container } = renderWithProviders(ScrollToLoadMessage, {
        props: createMockProps({ totalLoaded: 5, totalAvailable: 10 }),
      })

      const iconContainer = container.querySelector('.text-primary-500.dark\\:text-primary-400')
      expect(iconContainer).toBeInTheDocument()
    })

    it('should have dark mode classes for main message', () => {
      renderWithProviders(ScrollToLoadMessage, {
        props: createMockProps({ totalLoaded: 5, totalAvailable: 10 }),
      })

      const mainMessage = screen.getByText('Scroll down to load more notes')
      expect(mainMessage).toHaveClass('text-gray-600', 'dark:text-gray-300')
    })

    it('should have dark mode classes for detail message', () => {
      renderWithProviders(ScrollToLoadMessage, {
        props: createMockProps({ totalLoaded: 5, totalAvailable: 10 }),
      })

      const detailMessage = screen.getByText('5 more notes available (5 of 10 loaded)')
      expect(detailMessage).toHaveClass('text-gray-500', 'dark:text-gray-400')
    })
  })

  describe('Layout and Responsive Design', () => {
    it('should have proper container layout classes', () => {
      const { container } = renderWithProviders(ScrollToLoadMessage, {
        props: createMockProps({ totalLoaded: 5, totalAvailable: 10 }),
      })

      const mainContainer = container.querySelector(
        '.flex.flex-col.items-center.justify-center.p-6.text-center',
      )
      expect(mainContainer).toBeInTheDocument()
    })

    it('should have proper spacing between elements', () => {
      const { container } = renderWithProviders(ScrollToLoadMessage, {
        props: createMockProps({ totalLoaded: 5, totalAvailable: 10 }),
      })

      // Icon should have bottom margin
      const iconContainer = container.querySelector('.mb-3')
      expect(iconContainer).toBeInTheDocument()

      // Main message should have bottom margin
      const mainMessage = screen.getByText('Scroll down to load more notes')
      expect(mainMessage).toHaveClass('mb-1')
    })

    it('should have proper icon size', () => {
      const { container } = renderWithProviders(ScrollToLoadMessage, {
        props: createMockProps({ totalLoaded: 5, totalAvailable: 10 }),
      })

      const iconContainer = container.querySelector('.w-8.h-8')
      expect(iconContainer).toBeInTheDocument()
    })

    it('should have proper padding', () => {
      const { container } = renderWithProviders(ScrollToLoadMessage, {
        props: createMockProps({ totalLoaded: 5, totalAvailable: 10 }),
      })

      const mainContainer = container.querySelector('.p-6')
      expect(mainContainer).toBeInTheDocument()
    })
  })

  describe('Component Props Validation', () => {
    it('should handle zero values correctly', () => {
      const { container } = renderWithProviders(ScrollToLoadMessage, {
        props: createMockProps({ totalLoaded: 0, totalAvailable: 5 }),
      })

      // Should not render when totalLoaded is 0
      const mainContainer = container.querySelector(
        '.flex.flex-col.items-center.justify-center.p-6.text-center',
      )
      expect(mainContainer).not.toBeInTheDocument()
    })

    it('should handle equal values correctly', () => {
      const { container } = renderWithProviders(ScrollToLoadMessage, {
        props: createMockProps({ totalLoaded: 5, totalAvailable: 5 }),
      })

      // Should not render when totalLoaded equals totalAvailable
      const mainContainer = container.querySelector(
        '.flex.flex-col.items-center.justify-center.p-6.text-center',
      )
      expect(mainContainer).not.toBeInTheDocument()
    })

    it('should handle negative values gracefully', () => {
      const { container } = renderWithProviders(ScrollToLoadMessage, {
        props: createMockProps({ totalLoaded: -1, totalAvailable: 5 }),
      })

      // Should not render when totalLoaded is <= 0
      const mainContainer = container.querySelector(
        '.flex.flex-col.items-center.justify-center.p-6.text-center',
      )
      expect(mainContainer).not.toBeInTheDocument()
    })

    it('should handle extremely large numbers', () => {
      renderWithProviders(ScrollToLoadMessage, {
        props: createMockProps({ totalLoaded: 500000, totalAvailable: 1000000 }),
      })

      expect(
        screen.getByText('500000 more notes available (500000 of 1000000 loaded)'),
      ).toBeInTheDocument()
    })

    it('should handle decimal numbers by displaying them as-is', () => {
      renderWithProviders(ScrollToLoadMessage, {
        props: createMockProps({ totalLoaded: 5.5, totalAvailable: 10.7 }),
      })

      // remainingCount: 10.7 - 5.5 = 5.199999999999999 (floating point precision)
      expect(
        screen.getByText(/5\.199999999999999 more notes available \(5\.5 of 10\.7 loaded\)/),
      ).toBeInTheDocument()
    })
  })

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle when totalLoaded is 1 and totalAvailable is 2', () => {
      renderWithProviders(ScrollToLoadMessage, {
        props: createMockProps({ totalLoaded: 1, totalAvailable: 2 }),
      })

      expect(screen.getByText('Scroll down to load more notes')).toBeInTheDocument()
      expect(screen.getByText('1 more note available (1 of 2 loaded)')).toBeInTheDocument()
    })

    it('should handle large difference between loaded and available', () => {
      renderWithProviders(ScrollToLoadMessage, {
        props: createMockProps({ totalLoaded: 1, totalAvailable: 1000 }),
      })

      expect(screen.getByText('999 more notes available (1 of 1000 loaded)')).toBeInTheDocument()
    })

    it('should maintain consistent rendering with prop updates', () => {
      const { unmount } = renderWithProviders(ScrollToLoadMessage, {
        props: createMockProps({ totalLoaded: 5, totalAvailable: 5 }),
      })

      // Initially should not render (equal values)
      expect(screen.queryByText(/Scroll down to load more notes/)).not.toBeInTheDocument()
      unmount()

      // Render with new props that should show the component
      renderWithProviders(ScrollToLoadMessage, {
        props: createMockProps({ totalLoaded: 5, totalAvailable: 10 }),
      })

      // Now should render
      expect(screen.getByText('Scroll down to load more notes')).toBeInTheDocument()
      expect(screen.getByText('5 more notes available (5 of 10 loaded)')).toBeInTheDocument()
    })

    it('should handle rapid prop changes', () => {
      const { unmount } = renderWithProviders(ScrollToLoadMessage, {
        props: createMockProps({ totalLoaded: 1, totalAvailable: 10 }),
      })

      expect(screen.getByText('9 more notes available (1 of 10 loaded)')).toBeInTheDocument()
      unmount()

      renderWithProviders(ScrollToLoadMessage, {
        props: createMockProps({ totalLoaded: 5, totalAvailable: 10 }),
      })
      expect(screen.getByText('5 more notes available (5 of 10 loaded)')).toBeInTheDocument()
      unmount()

      renderWithProviders(ScrollToLoadMessage, {
        props: createMockProps({ totalLoaded: 9, totalAvailable: 10 }),
      })
      expect(screen.getByText('1 more note available (9 of 10 loaded)')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      renderWithProviders(ScrollToLoadMessage, {
        props: createMockProps({ totalLoaded: 5, totalAvailable: 10 }),
      })

      // Check for proper paragraph elements
      const mainMessage = screen.getByText('Scroll down to load more notes')
      const detailMessage = screen.getByText('5 more notes available (5 of 10 loaded)')

      expect(mainMessage.tagName).toBe('P')
      expect(detailMessage.tagName).toBe('P')
    })

    it('should provide meaningful text content for screen readers', () => {
      renderWithProviders(ScrollToLoadMessage, {
        props: createMockProps({ totalLoaded: 7, totalAvailable: 15 }),
      })

      const mainMessage = screen.getByText('Scroll down to load more notes')
      const detailMessage = screen.getByText('8 more notes available (7 of 15 loaded)')

      expect(mainMessage).toBeInTheDocument()
      expect(detailMessage).toBeInTheDocument()
      expect(detailMessage).toHaveTextContent('8 more notes available (7 of 15 loaded)')
    })

    it('should have proper color contrast classes', () => {
      const { container } = renderWithProviders(ScrollToLoadMessage, {
        props: createMockProps({ totalLoaded: 5, totalAvailable: 10 }),
      })

      // Icon should have appropriate color contrast
      const iconContainer = container.querySelector('.text-primary-500.dark\\:text-primary-400')
      expect(iconContainer).toBeInTheDocument()

      // Main message should have appropriate color contrast
      const mainMessage = screen.getByText('Scroll down to load more notes')
      expect(mainMessage).toHaveClass('text-gray-600', 'dark:text-gray-300')

      // Detail message should have appropriate color contrast
      const detailMessage = screen.getByText('5 more notes available (5 of 10 loaded)')
      expect(detailMessage).toHaveClass('text-gray-500', 'dark:text-gray-400')
    })

    it('should have proper text size hierarchy', () => {
      renderWithProviders(ScrollToLoadMessage, {
        props: createMockProps({ totalLoaded: 5, totalAvailable: 10 }),
      })

      const mainMessage = screen.getByText('Scroll down to load more notes')
      const detailMessage = screen.getByText('5 more notes available (5 of 10 loaded)')

      // Main message should be larger (text-sm)
      expect(mainMessage).toHaveClass('text-sm')
      // Detail message should be smaller (text-xs)
      expect(detailMessage).toHaveClass('text-xs')
    })
  })

  describe('Performance Considerations', () => {
    it('should handle frequent prop updates without issues', () => {
      // Test a few key iterations instead of all 50 to avoid performance issues
      const testCases = [2, 10, 25, 50, 99]

      testCases.forEach((i) => {
        const { unmount } = renderWithProviders(ScrollToLoadMessage, {
          props: createMockProps({ totalLoaded: i, totalAvailable: 100 }),
        })

        const remaining = 100 - i
        const noteText = remaining === 1 ? 'note' : 'notes'
        expect(
          screen.getByText(`${remaining} more ${noteText} available (${i} of 100 loaded)`),
        ).toBeInTheDocument()

        unmount()
      })
    })
  })

  describe('TypeScript Type Safety', () => {
    it('should accept valid prop types', () => {
      // This test ensures TypeScript compilation succeeds with proper types
      expect(() => {
        renderWithProviders(ScrollToLoadMessage, {
          props: createMockProps({
            totalLoaded: 5,
            totalAvailable: 10,
          }),
        })
      }).not.toThrow()
    })
  })
})
