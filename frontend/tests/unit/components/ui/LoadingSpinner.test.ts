import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/vue'
import { renderWithProviders } from '@tests/utils'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'

describe('LoadingSpinner - Core Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render spinner with default props', () => {
      renderWithProviders(LoadingSpinner)

      // Check for spinner SVG with correct classes
      const spinner = document.querySelector('svg')
      expect(spinner).toBeInTheDocument()
      expect(spinner).toHaveClass('w-6', 'h-6', 'animate-spin')
      expect(spinner).toHaveAttribute('aria-hidden', 'true')

      // Check for status role
      const statusContainer = screen.getByRole('status')
      expect(statusContainer).toBeInTheDocument()

      // Check for both screen reader text and visible text
      const allLoadingTexts = screen.getAllByText('Loading...')
      expect(allLoadingTexts).toHaveLength(2) // sr-only + visible text
    })

    it('should render with custom text', () => {
      const customText = 'Processing your request...'
      renderWithProviders(LoadingSpinner, {
        props: { text: customText },
      })

      expect(screen.getByText(customText)).toBeInTheDocument()
      // Screen reader text is still "Loading..." but visible text is custom
      const screenReaderText = document.querySelector('.sr-only')
      expect(screenReaderText).toHaveTextContent('Loading...')
    })

    it('should render without text when text prop is empty', () => {
      const { container } = renderWithProviders(LoadingSpinner, {
        props: { text: '' },
      })

      // Should still have screen reader text
      const screenReaderText = document.querySelector('.sr-only')
      expect(screenReaderText).toHaveTextContent('Loading...')

      // Should not have visible text paragraph
      const visibleText = container.querySelector('p')
      expect(visibleText).not.toBeInTheDocument()
    })

    it('should render spinner with correct SVG structure', () => {
      renderWithProviders(LoadingSpinner)

      const svg = document.querySelector('svg')
      expect(svg).toHaveAttribute('viewBox', '0 0 100 101')
      expect(svg).toHaveAttribute('fill', 'none')
      expect(svg).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg')

      // Should have two path elements for spinner design
      const paths = svg?.querySelectorAll('path')
      expect(paths).toHaveLength(2)
    })
  })

  describe('Size Variations', () => {
    it('should render small size correctly', () => {
      renderWithProviders(LoadingSpinner, {
        props: { size: 'sm', text: 'Small loading...' },
      })

      const spinner = document.querySelector('svg')
      expect(spinner).toHaveClass('w-4', 'h-4')
      expect(spinner).not.toHaveClass('w-6', 'h-6', 'w-8', 'h-8')

      const text = screen.getByText('Small loading...')
      expect(text).toHaveClass('text-sm')
    })

    it('should render medium size correctly (default)', () => {
      renderWithProviders(LoadingSpinner, {
        props: { size: 'md', text: 'Medium loading...' },
      })

      const spinner = document.querySelector('svg')
      expect(spinner).toHaveClass('w-6', 'h-6')
      expect(spinner).not.toHaveClass('w-4', 'h-4', 'w-8', 'h-8')

      const text = screen.getByText('Medium loading...')
      expect(text).toHaveClass('text-base')
    })

    it('should render large size correctly', () => {
      renderWithProviders(LoadingSpinner, {
        props: { size: 'lg', text: 'Large loading...' },
      })

      const spinner = document.querySelector('svg')
      expect(spinner).toHaveClass('w-8', 'h-8')
      expect(spinner).not.toHaveClass('w-4', 'h-4', 'w-6', 'h-6')

      const text = screen.getByText('Large loading...')
      expect(text).toHaveClass('text-lg')
    })

    it('should handle invalid size gracefully', () => {
      renderWithProviders(LoadingSpinner, {
        props: { size: 'invalid' as any },
      })

      // Should fall back to medium size classes based on component implementation
      // Looking at component, invalid size would use undefined which falls back to default
      const spinner = document.querySelector('svg')
      // Since invalid size is used, it won't apply any size classes from the computed property
      expect(spinner).toBeInTheDocument()
      expect(spinner).toHaveClass('animate-spin')
    })
  })

  describe('Styling and CSS Classes', () => {
    it('should apply correct base CSS classes to container', () => {
      renderWithProviders(LoadingSpinner)

      const container = document.querySelector('.flex.flex-col.items-center.justify-center.p-4')
      expect(container).toBeInTheDocument()
    })

    it('should apply correct spinner styling classes', () => {
      renderWithProviders(LoadingSpinner)

      const spinner = document.querySelector('svg')
      expect(spinner).toHaveClass(
        'text-gray-200',
        'animate-spin',
        'dark:text-gray-600',
        'fill-primary-600',
      )
    })

    it('should apply correct text styling classes', () => {
      renderWithProviders(LoadingSpinner, {
        props: { text: 'Test loading...' },
      })

      const text = screen.getByText('Test loading...')
      expect(text).toHaveClass('mt-2', 'text-gray-500', 'dark:text-gray-400')
    })

    it('should have proper spacing between spinner and text', () => {
      renderWithProviders(LoadingSpinner, {
        props: { text: 'Loading content...' },
      })

      const text = screen.getByText('Loading content...')
      expect(text).toHaveClass('mt-2')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      renderWithProviders(LoadingSpinner)

      const statusContainer = screen.getByRole('status')
      expect(statusContainer).toBeInTheDocument()

      const spinner = document.querySelector('svg')
      expect(spinner).toHaveAttribute('aria-hidden', 'true')
    })

    it('should provide screen reader accessible text', () => {
      renderWithProviders(LoadingSpinner)

      const screenReaderText = document.querySelector('.sr-only')
      expect(screenReaderText).toBeInTheDocument()
      expect(screenReaderText).toHaveTextContent('Loading...')
    })

    it('should have semantic text for different contexts', () => {
      const contexts = [
        { text: 'Loading your notes...', expected: 'Loading your notes...' },
        { text: 'Saving changes...', expected: 'Saving changes...' },
        { text: 'Generating plan...', expected: 'Generating plan...' },
      ]

      contexts.forEach(({ text, expected }) => {
        const { unmount } = renderWithProviders(LoadingSpinner, {
          props: { text },
        })

        expect(screen.getByText(expected)).toBeInTheDocument()
        unmount()
      })
    })

    it('should be keyboard accessible (no focusable elements)', () => {
      renderWithProviders(LoadingSpinner)

      // Spinner should not have any interactive elements
      expect(document.querySelectorAll('button, a, input, select, textarea')).toHaveLength(0)
    })
  })

  describe('Props Validation', () => {
    it('should handle undefined props gracefully', () => {
      renderWithProviders(LoadingSpinner, {
        props: { size: undefined, text: undefined },
      })

      // Should use defaults
      const spinner = document.querySelector('svg')
      expect(spinner).toHaveClass('w-6', 'h-6') // default medium size

      // Should have both screen reader and visible default text
      const allLoadingTexts = screen.getAllByText('Loading...')
      expect(allLoadingTexts).toHaveLength(2)
    })

    it('should handle null text prop', () => {
      renderWithProviders(LoadingSpinner, {
        props: { text: null as any },
      })

      // Should still show screen reader text
      const screenReaderText = document.querySelector('.sr-only')
      expect(screenReaderText).toHaveTextContent('Loading...')
    })

    it('should handle all valid size values', () => {
      const validSizes: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg']

      validSizes.forEach((size) => {
        const { unmount } = renderWithProviders(LoadingSpinner, {
          props: { size },
        })

        const spinner = document.querySelector('svg')
        expect(spinner).toBeInTheDocument()
        expect(spinner).toHaveClass('animate-spin')
        unmount()
      })
    })
  })

  describe('Dark Mode Support', () => {
    it('should have dark mode classes for spinner', () => {
      renderWithProviders(LoadingSpinner)

      const spinner = document.querySelector('svg')
      expect(spinner).toHaveClass('dark:text-gray-600')
    })

    it('should have dark mode classes for text', () => {
      renderWithProviders(LoadingSpinner, {
        props: { text: 'Loading in dark mode...' },
      })

      const text = screen.getByText('Loading in dark mode...')
      expect(text).toHaveClass('dark:text-gray-400')
    })
  })

  describe('Animation', () => {
    it('should have spin animation class', () => {
      renderWithProviders(LoadingSpinner)

      const spinner = document.querySelector('svg')
      expect(spinner).toHaveClass('animate-spin')
    })

    it('should maintain animation across all sizes', () => {
      const sizes: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg']

      sizes.forEach((size) => {
        const { unmount } = renderWithProviders(LoadingSpinner, {
          props: { size },
        })

        const spinner = document.querySelector('svg')
        expect(spinner).toHaveClass('animate-spin')
        unmount()
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long text strings', () => {
      const longText = 'A'.repeat(200)
      renderWithProviders(LoadingSpinner, {
        props: { text: longText },
      })

      expect(screen.getByText(longText)).toBeInTheDocument()
    })

    it('should handle text with special characters', () => {
      const specialText = 'Loading émojis 🌍 and açcénts...'
      renderWithProviders(LoadingSpinner, {
        props: { text: specialText },
      })

      expect(screen.getByText(specialText)).toBeInTheDocument()
    })

    it('should handle text with line breaks', () => {
      const textWithBreaks = 'Loading...\nPlease wait'
      renderWithProviders(LoadingSpinner, {
        props: { text: textWithBreaks },
      })

      // HTML collapses whitespace, so line breaks become spaces
      const expectedText = 'Loading... Please wait'
      const textElement = document.querySelector('p')
      expect(textElement).toHaveTextContent(expectedText)
    })
  })

  describe('Component Integration', () => {
    it('should work as a standalone component', () => {
      renderWithProviders(LoadingSpinner)

      // Should render without requiring external context
      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(document.querySelector('svg')).toBeInTheDocument()
    })

    it('should not emit any events (pure display component)', () => {
      const { emitted } = renderWithProviders(LoadingSpinner)

      // No events should be emitted from this display component
      expect(Object.keys(emitted())).toHaveLength(0)
    })

    it('should maintain consistent styling when used in different contexts', () => {
      // Test multiple instances
      const { unmount: unmount1 } = renderWithProviders(LoadingSpinner, {
        props: { size: 'sm', text: 'Small context' },
      })
      expect(document.querySelector('svg')).toHaveClass('w-4', 'h-4')
      unmount1()

      const { unmount: unmount2 } = renderWithProviders(LoadingSpinner, {
        props: { size: 'lg', text: 'Large context' },
      })
      expect(document.querySelector('svg')).toHaveClass('w-8', 'h-8')
      unmount2()

      renderWithProviders(LoadingSpinner)
      expect(document.querySelector('svg')).toHaveClass('w-6', 'h-6')
    })
  })

  describe('Performance Considerations', () => {
    it('should render efficiently with minimal DOM nodes', () => {
      const { container } = renderWithProviders(LoadingSpinner)

      // Should have a focused DOM structure
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper.children.length).toBeLessThanOrEqual(2) // status div and optional text
    })

    it('should not cause layout shifts with different text lengths', () => {
      const texts = ['Loading...', 'Processing your request, please wait...', 'Done!']

      texts.forEach((text) => {
        const { unmount } = renderWithProviders(LoadingSpinner, {
          props: { text },
        })

        // Text should be properly contained - find the paragraph element
        const paragraphElement = document.querySelector('p')
        expect(paragraphElement).toBeInTheDocument()
        expect(paragraphElement?.textContent).toBe(text)
        unmount()
      })
    })
  })

  describe('TypeScript Type Safety', () => {
    it('should accept valid size types', () => {
      const validSizes: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg']

      validSizes.forEach((size) => {
        expect(() => {
          renderWithProviders(LoadingSpinner, {
            props: { size },
          })
        }).not.toThrow()
      })
    })

    it('should accept string text values', () => {
      const textValues = [
        'Loading...',
        '',
        'Very long loading message that might wrap to multiple lines',
        'Special chars: åçèñt',
      ]

      textValues.forEach((text) => {
        expect(() => {
          renderWithProviders(LoadingSpinner, {
            props: { text },
          })
        }).not.toThrow()
      })
    })
  })
})
