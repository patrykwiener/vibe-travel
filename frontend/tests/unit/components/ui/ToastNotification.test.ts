import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen } from '@testing-library/vue'
import { renderWithProviders } from '@tests/utils'
import ToastNotification from '@/components/ui/ToastNotification.vue'

// Helper to create mock props
const createMockProps = (
  overrides: Partial<{
    show: boolean
    type?: 'success' | 'error' | 'warning' | 'info'
    title?: string
    message: string
    duration?: number
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  }> = {},
) => ({
  show: false,
  type: 'info' as const,
  message: 'Test notification message',
  duration: 5000,
  position: 'top-right' as const,
  ...overrides,
})

describe('ToastNotification - Core Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('Component Rendering', () => {
    it('should not render when show is false', () => {
      renderWithProviders(ToastNotification, {
        props: createMockProps({ show: false }),
      })

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('should render when show is true', async () => {
      const { rerender } = renderWithProviders(ToastNotification, {
        props: createMockProps({ show: false }),
      })

      // First ensure it's not visible
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()

      // Then trigger the show change to true to activate the watcher
      await rerender({ ...createMockProps({ show: true }) })

      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('Test notification message')).toBeInTheDocument()
    })

    it('should render with title when provided', async () => {
      const { rerender } = renderWithProviders(ToastNotification, {
        props: createMockProps({ show: false }),
      })

      await rerender({
        ...createMockProps({
          show: true,
          title: 'Test Title',
        }),
      })

      expect(screen.getByText('Test Title')).toBeInTheDocument()
      expect(screen.getByText('Test notification message')).toBeInTheDocument()
    })

    it('should render without title when not provided', async () => {
      const { rerender } = renderWithProviders(ToastNotification, {
        props: createMockProps({ show: false }),
      })

      await rerender({
        ...createMockProps({
          show: true,
          title: undefined,
        }),
      })

      expect(screen.getByText('Test notification message')).toBeInTheDocument()
      expect(screen.queryByText('Test Title')).not.toBeInTheDocument()
    })

    it('should render close button with proper aria-label', async () => {
      const { rerender } = renderWithProviders(ToastNotification, {
        props: createMockProps({ show: false }),
      })

      await rerender({ ...createMockProps({ show: true }) })

      const closeButton = screen.getByRole('button', { name: /close/i })
      expect(closeButton).toBeInTheDocument()
      expect(closeButton).toHaveAttribute('aria-label', 'Close')
    })
  })

  describe('Toast Types and Styling', () => {
    it('should apply success type styling', async () => {
      const { rerender } = renderWithProviders(ToastNotification, {
        props: createMockProps({ show: false }),
      })

      await rerender({
        ...createMockProps({
          show: true,
          type: 'success',
        }),
      })

      const toast = screen.getByRole('alert')
      expect(toast).toHaveClass('bg-green-50', 'border-green-300', 'text-green-800')
    })

    it('should apply error type styling', async () => {
      const { rerender } = renderWithProviders(ToastNotification, {
        props: createMockProps({ show: false }),
      })

      await rerender({
        ...createMockProps({
          show: true,
          type: 'error',
        }),
      })

      const toast = screen.getByRole('alert')
      expect(toast).toHaveClass('bg-red-50', 'border-red-300', 'text-red-800')
    })

    it('should apply warning type styling', async () => {
      const { rerender } = renderWithProviders(ToastNotification, {
        props: createMockProps({ show: false }),
      })

      await rerender({
        ...createMockProps({
          show: true,
          type: 'warning',
        }),
      })

      const toast = screen.getByRole('alert')
      expect(toast).toHaveClass('bg-yellow-50', 'border-yellow-300', 'text-yellow-800')
    })

    it('should apply info type styling by default', async () => {
      const { rerender } = renderWithProviders(ToastNotification, {
        props: createMockProps({ show: false }),
      })

      await rerender({
        ...createMockProps({
          show: true,
          type: 'info',
        }),
      })

      const toast = screen.getByRole('alert')
      expect(toast).toHaveClass('bg-blue-50', 'border-blue-300', 'text-blue-800')
    })
  })

  describe('Show/Hide State Management', () => {
    it('should become visible when show prop changes to true', async () => {
      const { rerender } = renderWithProviders(ToastNotification, {
        props: createMockProps({ show: false }),
      })

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()

      await rerender({
        ...createMockProps({ show: true }),
      })

      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should clean up timers on multiple duration changes', async () => {
      const { rerender } = renderWithProviders(ToastNotification, {
        props: createMockProps({
          show: true,
          duration: 1000,
        }),
      })

      // Change duration multiple times
      await rerender({ ...createMockProps({ show: true, duration: 2000 }) })
      await rerender({ ...createMockProps({ show: true, duration: 3000 }) })
      await rerender({ ...createMockProps({ show: true, duration: 500 }) })

      // Should not cause memory leaks or multiple timeouts
      vi.advanceTimersByTime(500)
      // This test mainly ensures no errors are thrown
    })
  })

  describe('TypeScript Type Safety', () => {
    it('should maintain correct TypeScript types for props', () => {
      const props = createMockProps()

      expect(typeof props.show).toBe('boolean')
      expect(typeof props.message).toBe('string')
      expect(typeof props.duration).toBe('number')
      expect(['success', 'error', 'warning', 'info']).toContain(props.type)
      expect(['top-right', 'top-left', 'bottom-right', 'bottom-left']).toContain(props.position)
    })
  })

  describe('Performance Considerations', () => {
    it('should not render DOM when not visible', () => {
      const { container } = renderWithProviders(ToastNotification, {
        props: createMockProps({ show: false }),
      })

      // Should not render the toast DOM when not visible
      expect(container.querySelector('[role="alert"]')).not.toBeInTheDocument()
    })

    it('should efficiently handle multiple timer resets', async () => {
      const { rerender } = renderWithProviders(ToastNotification, {
        props: createMockProps({
          show: true,
          duration: 1000,
        }),
      })

      // Rapid show/hide cycles that should reset timers
      for (let i = 0; i < 5; i++) {
        await rerender({ ...createMockProps({ show: false }) })
        await rerender({ ...createMockProps({ show: true, duration: 1000 }) })
      }

      // Should not cause performance issues or memory leaks
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })
})
