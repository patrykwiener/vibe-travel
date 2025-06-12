import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, screen } from '@testing-library/vue'
import { renderWithProviders } from '@tests/utils'
import CreateNoteButton from '@/components/ui/buttons/CreateNoteButton.vue'
import { useAuthStore } from '@/stores/auth'

// Mock the auth store
vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(),
}))

// Mock router
const mockPush = vi.fn()
vi.mock('vue-router', async () => {
  const actual = await vi.importActual('vue-router')
  return {
    ...actual,
    useRouter: () => ({
      push: mockPush,
    }),
  }
})

describe('CreateNoteButton', () => {
  const mockAuthStore = {
    isAuthenticated: true,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuthStore).mockReturnValue(mockAuthStore as any)
  })

  describe('Component Rendering', () => {
    it('should render header variant by default', () => {
      renderWithProviders(CreateNoteButton)

      const button = screen.getByRole('button', { name: /create note/i })
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('px-5', 'py-2.5', 'text-sm', 'rounded-lg')
      expect(button).not.toHaveClass('fixed', 'bottom-6', 'right-6')

      // Should show text for header variant
      expect(screen.getByText('Create Note')).toBeInTheDocument()
    })

    it('should render floating variant when specified', () => {
      renderWithProviders(CreateNoteButton, {
        props: { variant: 'floating' },
      })

      const button = screen.getByRole('button', { name: /create new note/i })
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('fixed', 'bottom-6', 'right-6', 'rounded-full')
      expect(button).not.toHaveClass('px-5', 'py-2.5', 'text-sm', 'rounded-lg')

      // Should not show text for floating variant
      expect(screen.queryByText('Create Note')).not.toBeInTheDocument()
    })

    it('should have proper ARIA label for floating variant', () => {
      renderWithProviders(CreateNoteButton, {
        props: { variant: 'floating' },
      })

      const button = screen.getByRole('button', { name: /create new note/i })
      expect(button).toHaveAttribute('aria-label', 'Create new note')
    })

    it('should not have ARIA label for header variant', () => {
      renderWithProviders(CreateNoteButton)

      const button = screen.getByRole('button', { name: /create note/i })
      expect(button).not.toHaveAttribute('aria-label')
    })

    it('should render plus icon with correct classes', () => {
      renderWithProviders(CreateNoteButton)

      const svg = screen.getByRole('button').querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveClass('w-4', 'h-4', 'mr-2')
    })

    it('should render plus icon with floating classes for floating variant', () => {
      renderWithProviders(CreateNoteButton, {
        props: { variant: 'floating' },
      })

      const svg = screen.getByRole('button').querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveClass('w-6', 'h-6')
      expect(svg).not.toHaveClass('mr-2')
    })
  })

  describe('Authentication Handling', () => {
    it('should navigate to notes creation when authenticated', async () => {
      mockAuthStore.isAuthenticated = true
      renderWithProviders(CreateNoteButton)

      const button = screen.getByRole('button', { name: /create note/i })
      await fireEvent.click(button)

      expect(mockPush).toHaveBeenCalledWith('/notes/new')
      expect(mockPush).toHaveBeenCalledTimes(1)
    })

    it('should navigate to login when not authenticated', async () => {
      mockAuthStore.isAuthenticated = false
      renderWithProviders(CreateNoteButton)

      const button = screen.getByRole('button', { name: /create note/i })
      await fireEvent.click(button)

      expect(mockPush).toHaveBeenCalledWith('/login')
      expect(mockPush).toHaveBeenCalledTimes(1)
    })

    it('should handle authentication state changes', async () => {
      mockAuthStore.isAuthenticated = false
      const { rerender } = renderWithProviders(CreateNoteButton)

      const button = screen.getByRole('button', { name: /create note/i })
      await fireEvent.click(button)
      expect(mockPush).toHaveBeenCalledWith('/login')

      // Simulate authentication state change
      mockAuthStore.isAuthenticated = true
      await rerender({ props: {} })

      await fireEvent.click(button)
      expect(mockPush).toHaveBeenCalledWith('/notes/new')
    })
  })

  describe('Button Styling', () => {
    it('should apply correct base styles for all variants', () => {
      renderWithProviders(CreateNoteButton)

      const button = screen.getByRole('button')
      expect(button).toHaveClass(
        'inline-flex',
        'items-center',
        'font-medium',
        'text-white',
        'bg-primary-600',
        'hover:bg-primary-700',
        'focus:ring-4',
        'focus:outline-none',
        'focus:ring-primary-300',
        'transition-colors',
      )
    })

    it('should apply header-specific styles', () => {
      renderWithProviders(CreateNoteButton, {
        props: { variant: 'header' },
      })

      const button = screen.getByRole('button')
      expect(button).toHaveClass('px-5', 'py-2.5', 'text-sm', 'rounded-lg')
    })

    it('should apply floating-specific styles', () => {
      renderWithProviders(CreateNoteButton, {
        props: { variant: 'floating' },
      })

      const button = screen.getByRole('button')
      expect(button).toHaveClass(
        'fixed',
        'bottom-6',
        'right-6',
        'px-4',
        'py-4',
        'rounded-full',
        'shadow-lg',
        'hover:shadow-xl',
        'z-50',
      )
    })
  })

  describe('User Interaction', () => {
    it('should be clickable and responsive', async () => {
      renderWithProviders(CreateNoteButton)

      const button = screen.getByRole('button', { name: /create note/i })
      expect(button).toBeEnabled()

      await fireEvent.click(button)
      expect(mockPush).toHaveBeenCalled()
    })

    it('should handle multiple clicks correctly', async () => {
      renderWithProviders(CreateNoteButton)

      const button = screen.getByRole('button', { name: /create note/i })

      await fireEvent.click(button)
      await fireEvent.click(button)
      await fireEvent.click(button)

      expect(mockPush).toHaveBeenCalledTimes(3)
      expect(mockPush).toHaveBeenCalledWith('/notes/new')
    })

    it('should handle keyboard interaction via focus', async () => {
      renderWithProviders(CreateNoteButton)

      const button = screen.getByRole('button', { name: /create note/i })

      // Test that button can be focused (keyboard accessible)
      button.focus()
      expect(document.activeElement).toBe(button)

      // Test that focused button can be clicked
      await fireEvent.click(button)
      expect(mockPush).toHaveBeenCalledWith('/notes/new')
    })
  })

  describe('Props Validation', () => {
    it('should handle invalid variant gracefully', () => {
      renderWithProviders(CreateNoteButton, {
        props: { variant: 'invalid' as any },
      })

      // Should fall back to header variant styles but not show text (since variant !== 'header')
      const button = screen.getByRole('button')
      expect(button).toHaveClass('px-5', 'py-2.5', 'text-sm', 'rounded-lg')
      expect(screen.queryByText('Create Note')).not.toBeInTheDocument()
    })

    it('should handle undefined variant', () => {
      renderWithProviders(CreateNoteButton, {
        props: { variant: undefined },
      })

      // Should use default header variant
      const button = screen.getByRole('button')
      expect(button).toHaveClass('px-5', 'py-2.5', 'text-sm', 'rounded-lg')
      expect(screen.getByText('Create Note')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper button semantics', () => {
      renderWithProviders(CreateNoteButton)

      const button = screen.getByRole('button', { name: /create note/i })
      expect(button).toHaveAttribute('type', 'button')
    })

    it('should be keyboard accessible', async () => {
      renderWithProviders(CreateNoteButton)

      const button = screen.getByRole('button', { name: /create note/i })

      // Should be focusable
      button.focus()
      expect(document.activeElement).toBe(button)

      // Test actual click behavior rather than keyDown events
      await fireEvent.click(button)
      expect(mockPush).toHaveBeenCalled()
    })

    it('should provide meaningful text content for screen readers', () => {
      renderWithProviders(CreateNoteButton, {
        props: { variant: 'header' },
      })

      expect(screen.getByText('Create Note')).toBeInTheDocument()
    })

    it('should provide meaningful aria-label for floating variant', () => {
      renderWithProviders(CreateNoteButton, {
        props: { variant: 'floating' },
      })

      const button = screen.getByRole('button', { name: /create new note/i })
      expect(button).toHaveAttribute('aria-label', 'Create new note')
    })
  })
})
