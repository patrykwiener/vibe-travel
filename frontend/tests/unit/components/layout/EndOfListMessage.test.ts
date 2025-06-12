import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen } from '@testing-library/vue'
import { renderWithProviders } from '@tests/utils'
import EndOfListMessage from '@/components/layout/EndOfListMessage.vue'

// Helper to create mock props
const createMockProps = (
  overrides: Partial<{
    totalLoaded: number
    totalAvailable: number
  }> = {},
) => ({
  totalLoaded: 10,
  totalAvailable: 10,
  ...overrides,
})

describe('EndOfListMessage - Core Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render main container with correct styling when shouldShow is true', () => {
      const { container } = renderWithProviders(EndOfListMessage, {
        props: createMockProps({ totalLoaded: 5, totalAvailable: 5 }),
      })

      const mainContainer = container.querySelector(
        '.flex.flex-col.items-center.justify-center.p-6.text-center',
      )
      expect(mainContainer).toBeInTheDocument()
    })

    it('should not render when totalLoaded is 0', () => {
      const { container } = renderWithProviders(EndOfListMessage, {
        props: createMockProps({ totalLoaded: 0, totalAvailable: 10 }),
      })

      const mainContainer = container.querySelector(
        '.flex.flex-col.items-center.justify-center.p-6.text-center',
      )
      expect(mainContainer).not.toBeInTheDocument()
    })

    it('should not render when totalLoaded is less than totalAvailable', () => {
      const { container } = renderWithProviders(EndOfListMessage, {
        props: createMockProps({ totalLoaded: 5, totalAvailable: 10 }),
      })

      const mainContainer = container.querySelector(
        '.flex.flex-col.items-center.justify-center.p-6.text-center',
      )
      expect(mainContainer).not.toBeInTheDocument()
    })

    it('should render when totalLoaded equals totalAvailable and both are greater than 0', () => {
      renderWithProviders(EndOfListMessage, {
        props: createMockProps({ totalLoaded: 15, totalAvailable: 15 }),
      })

      expect(screen.getByText('All notes loaded (15 of 15)')).toBeInTheDocument()
    })

    it('should render when totalLoaded is greater than totalAvailable', () => {
      renderWithProviders(EndOfListMessage, {
        props: createMockProps({ totalLoaded: 12, totalAvailable: 10 }),
      })

      expect(screen.getByText('All notes loaded (12 of 10)')).toBeInTheDocument()
    })
  })

  describe('Visibility Logic (shouldShow computed)', () => {
    it('should show when totalLoaded > 0 and totalLoaded >= totalAvailable', () => {
      const testCases = [
        { totalLoaded: 1, totalAvailable: 1, shouldShow: true },
        { totalLoaded: 5, totalAvailable: 5, shouldShow: true },
        { totalLoaded: 10, totalAvailable: 8, shouldShow: true },
        { totalLoaded: 100, totalAvailable: 100, shouldShow: true },
      ]

      testCases.forEach(({ totalLoaded, totalAvailable, shouldShow }) => {
        const { container, unmount } = renderWithProviders(EndOfListMessage, {
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
        const { container, unmount } = renderWithProviders(EndOfListMessage, {
          props: createMockProps({ totalLoaded, totalAvailable }),
        })

        const mainContainer = container.querySelector(
          '.flex.flex-col.items-center.justify-center.p-6.text-center',
        )
        expect(mainContainer).not.toBeInTheDocument()

        unmount()
      })
    })

    it('should not show when totalLoaded < totalAvailable', () => {
      const testCases = [
        { totalLoaded: 1, totalAvailable: 5 },
        { totalLoaded: 5, totalAvailable: 10 },
        { totalLoaded: 50, totalAvailable: 100 },
      ]

      testCases.forEach(({ totalLoaded, totalAvailable }) => {
        const { container, unmount } = renderWithProviders(EndOfListMessage, {
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

  describe('Icon Rendering', () => {
    it('should render check circle icon with correct styling', () => {
      const { container } = renderWithProviders(EndOfListMessage, {
        props: createMockProps({ totalLoaded: 5, totalAvailable: 5 }),
      })

      // Check for icon container with correct classes
      const iconContainer = container.querySelector(
        '.w-8.h-8.mb-3.text-gray-400.dark\\:text-gray-600',
      )
      expect(iconContainer).toBeInTheDocument()

      // Check for SVG element with correct classes
      const svg = iconContainer?.querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveClass('w-full', 'h-full')

      // Check for specific check circle icon path
      const checkCircleIcon = container.querySelector(
        'svg path[d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"]',
      )
      expect(checkCircleIcon).toBeInTheDocument()
    })

    it('should have proper SVG attributes', () => {
      const { container } = renderWithProviders(EndOfListMessage, {
        props: createMockProps({ totalLoaded: 3, totalAvailable: 3 }),
      })

      const svg = container.querySelector('svg')
      expect(svg).toHaveAttribute('fill', 'none')
      expect(svg).toHaveAttribute('stroke', 'currentColor')
      expect(svg).toHaveAttribute('viewBox', '0 0 24 24')
      expect(svg).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg')
    })

    it('should have proper path attributes', () => {
      const { container } = renderWithProviders(EndOfListMessage, {
        props: createMockProps({ totalLoaded: 7, totalAvailable: 7 }),
      })

      const path = container.querySelector('svg path')
      expect(path).toHaveAttribute('stroke-linecap', 'round')
      expect(path).toHaveAttribute('stroke-linejoin', 'round')
      expect(path).toHaveAttribute('stroke-width', '1.5')
    })
  })

  describe('Message Content', () => {
    it('should display correct message format with exact counts', () => {
      renderWithProviders(EndOfListMessage, {
        props: createMockProps({ totalLoaded: 25, totalAvailable: 25 }),
      })

      expect(screen.getByText('All notes loaded (25 of 25)')).toBeInTheDocument()
    })

    it('should display correct message when loaded exceeds available', () => {
      renderWithProviders(EndOfListMessage, {
        props: createMockProps({ totalLoaded: 15, totalAvailable: 12 }),
      })

      expect(screen.getByText('All notes loaded (15 of 12)')).toBeInTheDocument()
    })

    it('should handle single note correctly', () => {
      renderWithProviders(EndOfListMessage, {
        props: createMockProps({ totalLoaded: 1, totalAvailable: 1 }),
      })

      expect(screen.getByText('All notes loaded (1 of 1)')).toBeInTheDocument()
    })

    it('should handle large numbers correctly', () => {
      renderWithProviders(EndOfListMessage, {
        props: createMockProps({ totalLoaded: 9999, totalAvailable: 9999 }),
      })

      expect(screen.getByText('All notes loaded (9999 of 9999)')).toBeInTheDocument()
    })

    it('should have correct text styling classes', () => {
      const { container } = renderWithProviders(EndOfListMessage, {
        props: createMockProps({ totalLoaded: 5, totalAvailable: 5 }),
      })

      const messageText = container.querySelector('p')
      expect(messageText).toHaveClass('text-sm', 'text-gray-500', 'dark:text-gray-400')
    })
  })

  describe('Dark Mode Support', () => {
    it('should have dark mode classes for icon', () => {
      const { container } = renderWithProviders(EndOfListMessage, {
        props: createMockProps({ totalLoaded: 5, totalAvailable: 5 }),
      })

      const iconContainer = container.querySelector('.text-gray-400.dark\\:text-gray-600')
      expect(iconContainer).toBeInTheDocument()
    })

    it('should have dark mode classes for message text', () => {
      const { container } = renderWithProviders(EndOfListMessage, {
        props: createMockProps({ totalLoaded: 5, totalAvailable: 5 }),
      })

      const messageText = container.querySelector('p')
      expect(messageText).toHaveClass('text-gray-500', 'dark:text-gray-400')
    })
  })

  describe('Layout and Responsive Design', () => {
    it('should have proper container layout classes', () => {
      const { container } = renderWithProviders(EndOfListMessage, {
        props: createMockProps({ totalLoaded: 5, totalAvailable: 5 }),
      })

      const mainContainer = container.querySelector(
        '.flex.flex-col.items-center.justify-center.p-6.text-center',
      )
      expect(mainContainer).toBeInTheDocument()
    })

    it('should have proper spacing between icon and message', () => {
      const { container } = renderWithProviders(EndOfListMessage, {
        props: createMockProps({ totalLoaded: 5, totalAvailable: 5 }),
      })

      const iconContainer = container.querySelector('.w-8.h-8.mb-3')
      expect(iconContainer).toBeInTheDocument()
    })

    it('should have proper icon size', () => {
      const { container } = renderWithProviders(EndOfListMessage, {
        props: createMockProps({ totalLoaded: 5, totalAvailable: 5 }),
      })

      const iconContainer = container.querySelector('.w-8.h-8')
      expect(iconContainer).toBeInTheDocument()
    })
  })

  describe('Component Props Validation', () => {
    it('should handle zero values correctly', () => {
      const { container } = renderWithProviders(EndOfListMessage, {
        props: createMockProps({ totalLoaded: 0, totalAvailable: 0 }),
      })

      // Should not render when totalLoaded is 0
      const mainContainer = container.querySelector(
        '.flex.flex-col.items-center.justify-center.p-6.text-center',
      )
      expect(mainContainer).not.toBeInTheDocument()
    })

    it('should handle negative values gracefully', () => {
      const { container } = renderWithProviders(EndOfListMessage, {
        props: createMockProps({ totalLoaded: -1, totalAvailable: -1 }),
      })

      // Should not render when totalLoaded is <= 0
      const mainContainer = container.querySelector(
        '.flex.flex-col.items-center.justify-center.p-6.text-center',
      )
      expect(mainContainer).not.toBeInTheDocument()
    })

    it('should handle extremely large numbers', () => {
      renderWithProviders(EndOfListMessage, {
        props: createMockProps({ totalLoaded: 999999, totalAvailable: 999999 }),
      })

      expect(screen.getByText('All notes loaded (999999 of 999999)')).toBeInTheDocument()
    })

    it('should handle decimal numbers by displaying them as-is', () => {
      renderWithProviders(EndOfListMessage, {
        props: createMockProps({ totalLoaded: 5.5, totalAvailable: 5.5 }),
      })

      expect(screen.getByText('All notes loaded (5.5 of 5.5)')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      renderWithProviders(EndOfListMessage, {
        props: createMockProps({ totalLoaded: 5, totalAvailable: 5 }),
      })

      // Check for proper paragraph element
      const messageElement = screen.getByText('All notes loaded (5 of 5)')
      expect(messageElement.tagName).toBe('P')
    })

    it('should provide meaningful text content for screen readers', () => {
      renderWithProviders(EndOfListMessage, {
        props: createMockProps({ totalLoaded: 10, totalAvailable: 10 }),
      })

      const messageText = screen.getByText('All notes loaded (10 of 10)')
      expect(messageText).toBeInTheDocument()
      expect(messageText).toHaveTextContent('All notes loaded (10 of 10)')
    })

    it('should have proper color contrast classes', () => {
      const { container } = renderWithProviders(EndOfListMessage, {
        props: createMockProps({ totalLoaded: 5, totalAvailable: 5 }),
      })

      // Text should have appropriate color contrast
      const messageText = container.querySelector('p')
      expect(messageText).toHaveClass('text-gray-500', 'dark:text-gray-400')

      // Icon should have appropriate color contrast
      const iconContainer = container.querySelector('.text-gray-400.dark\\:text-gray-600')
      expect(iconContainer).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle when totalLoaded is much larger than totalAvailable', () => {
      renderWithProviders(EndOfListMessage, {
        props: createMockProps({ totalLoaded: 1000, totalAvailable: 10 }),
      })

      expect(screen.getByText('All notes loaded (1000 of 10)')).toBeInTheDocument()
    })

    it('should handle boundary conditions', () => {
      // Test exactly equal values
      const { unmount } = renderWithProviders(EndOfListMessage, {
        props: createMockProps({ totalLoaded: 50, totalAvailable: 50 }),
      })

      expect(screen.getByText('All notes loaded (50 of 50)')).toBeInTheDocument()
      unmount()

      // Test one more than available
      renderWithProviders(EndOfListMessage, {
        props: createMockProps({ totalLoaded: 51, totalAvailable: 50 }),
      })

      expect(screen.getByText('All notes loaded (51 of 50)')).toBeInTheDocument()
    })

    it('should maintain consistent rendering with prop updates', () => {
      const { unmount } = renderWithProviders(EndOfListMessage, {
        props: createMockProps({ totalLoaded: 3, totalAvailable: 5 }),
      })

      // Initially should not render
      expect(screen.queryByText(/All notes loaded/)).not.toBeInTheDocument()
      unmount()

      // Render with new props that should show the component
      renderWithProviders(EndOfListMessage, {
        props: createMockProps({ totalLoaded: 5, totalAvailable: 5 }),
      })

      // Now should render
      expect(screen.getByText('All notes loaded (5 of 5)')).toBeInTheDocument()
    })
  })

  describe('TypeScript Type Safety', () => {
    it('should accept valid prop types', () => {
      // This test ensures TypeScript compilation succeeds with proper types
      expect(() => {
        renderWithProviders(EndOfListMessage, {
          props: createMockProps({
            totalLoaded: 10,
            totalAvailable: 10,
          }),
        })
      }).not.toThrow()
    })
  })
})
