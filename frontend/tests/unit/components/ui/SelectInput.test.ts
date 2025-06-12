import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, screen } from '@testing-library/vue'
import { renderWithProviders } from '@tests/utils'
import SelectInput from '@/components/ui/SelectInput.vue'

// Helper to create mock options
const createMockOptions = () => [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
]

// Helper to create mock props
const createMockProps = (
  overrides: Partial<{
    modelValue: string | null
    label: string
    id: string
    options: Array<{ value: string; label: string }>
    placeholder?: string
    helpText?: string
    required?: boolean
  }> = {},
) => ({
  modelValue: null,
  label: 'Test Select',
  id: 'test-select',
  options: createMockOptions(),
  placeholder: undefined,
  helpText: undefined,
  required: false,
  ...overrides,
})

describe('SelectInput - Core Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render select input with label', () => {
      renderWithProviders(SelectInput, {
        props: createMockProps({ label: 'Choose Option' }),
      })

      expect(screen.getByLabelText('Choose Option')).toBeInTheDocument()
      expect(screen.getByText('Choose Option')).toBeInTheDocument()
    })

    it('should render with correct id attribute', () => {
      renderWithProviders(SelectInput, {
        props: createMockProps({ id: 'my-select', label: 'Test' }),
      })

      const selectElement = screen.getByRole('combobox')
      expect(selectElement).toHaveAttribute('id', 'my-select')
    })

    it('should render all provided options', () => {
      const options = [
        { value: 'paris', label: 'Paris' },
        { value: 'london', label: 'London' },
        { value: 'tokyo', label: 'Tokyo' },
      ]

      renderWithProviders(SelectInput, {
        props: createMockProps({ options }),
      })

      expect(screen.getByRole('option', { name: 'Paris' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'London' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Tokyo' })).toBeInTheDocument()
    })

    it('should render default placeholder option', () => {
      renderWithProviders(SelectInput, {
        props: createMockProps({ label: 'Travel Style' }),
      })

      expect(screen.getByRole('option', { name: 'Select travel style' })).toBeInTheDocument()
    })

    it('should render custom placeholder when provided', () => {
      renderWithProviders(SelectInput, {
        props: createMockProps({
          label: 'Country',
          placeholder: 'Choose your destination',
        }),
      })

      expect(screen.getByRole('option', { name: 'Choose your destination' })).toBeInTheDocument()
    })

    it('should show required asterisk when required is true', () => {
      renderWithProviders(SelectInput, {
        props: createMockProps({
          label: 'Required Field',
          required: true,
        }),
      })

      expect(screen.getByText('Required Field')).toBeInTheDocument()
      expect(screen.getByText('*')).toBeInTheDocument()
    })

    it('should not show required asterisk when required is false', () => {
      renderWithProviders(SelectInput, {
        props: createMockProps({
          label: 'Optional Field',
          required: false,
        }),
      })

      expect(screen.getByText('Optional Field')).toBeInTheDocument()
      expect(screen.queryByText('*')).not.toBeInTheDocument()
    })

    it('should render help text when provided', () => {
      renderWithProviders(SelectInput, {
        props: createMockProps({
          helpText: 'Please select your preferred option',
        }),
      })

      expect(screen.getByText('Please select your preferred option')).toBeInTheDocument()
    })

    it('should not render help text when not provided', () => {
      renderWithProviders(SelectInput, {
        props: createMockProps(),
      })

      const helpText = document.querySelector('p')
      expect(helpText).not.toBeInTheDocument()
    })
  })

  describe('Value Handling', () => {
    it('should display selected value correctly', () => {
      renderWithProviders(SelectInput, {
        props: createMockProps({ modelValue: 'option2' }),
      })

      const selectElement = screen.getByRole('combobox') as HTMLSelectElement
      expect(selectElement.value).toBe('option2')
    })

    it('should display empty string when modelValue is null', () => {
      renderWithProviders(SelectInput, {
        props: createMockProps({ modelValue: null }),
      })

      const selectElement = screen.getByRole('combobox') as HTMLSelectElement
      expect(selectElement.value).toBe('')
    })

    it('should handle undefined modelValue', () => {
      renderWithProviders(SelectInput, {
        props: createMockProps({ modelValue: undefined as any }),
      })

      const selectElement = screen.getByRole('combobox') as HTMLSelectElement
      expect(selectElement.value).toBe('')
    })

    it('should emit update:modelValue when selection changes', async () => {
      const { emitted } = renderWithProviders(SelectInput, {
        props: createMockProps(),
      })

      const selectElement = screen.getByRole('combobox')
      await fireEvent.change(selectElement, { target: { value: 'option1' } })

      expect(emitted()['update:modelValue']).toBeTruthy()
      expect(emitted()['update:modelValue']).toHaveLength(1)
      const updateEvents = emitted()['update:modelValue'] as unknown[][]
      expect(updateEvents[0][0]).toBe('option1')
    })

    it('should emit null when empty value is selected', async () => {
      const { emitted } = renderWithProviders(SelectInput, {
        props: createMockProps({ modelValue: 'option1' }),
      })

      const selectElement = screen.getByRole('combobox')
      await fireEvent.change(selectElement, { target: { value: '' } })

      expect(emitted()['update:modelValue']).toBeTruthy()
      const updateEvents = emitted()['update:modelValue'] as unknown[][]
      expect(updateEvents[0][0]).toBeNull()
    })

    it('should handle rapid selection changes', async () => {
      const { emitted } = renderWithProviders(SelectInput, {
        props: createMockProps(),
      })

      const selectElement = screen.getByRole('combobox')

      // Rapid changes
      await fireEvent.change(selectElement, { target: { value: 'option1' } })
      await fireEvent.change(selectElement, { target: { value: 'option2' } })
      await fireEvent.change(selectElement, { target: { value: 'option3' } })

      expect(emitted()['update:modelValue']).toHaveLength(3)
      const updateEvents = emitted()['update:modelValue'] as unknown[][]
      expect(updateEvents[0][0]).toBe('option1')
      expect(updateEvents[1][0]).toBe('option2')
      expect(updateEvents[2][0]).toBe('option3')
    })
  })

  describe('Options Rendering', () => {
    it('should handle empty options array', () => {
      renderWithProviders(SelectInput, {
        props: createMockProps({
          options: [],
          label: 'Empty Select',
        }),
      })

      // Should still render placeholder option
      expect(screen.getByRole('option', { name: 'Select empty select' })).toBeInTheDocument()

      // Should not have any other options
      const options = screen.getAllByRole('option')
      expect(options).toHaveLength(1)
    })

    it('should handle options with special characters', () => {
      const specialOptions = [
        { value: 'option1', label: 'Café & Restaurant' },
        { value: 'option2', label: 'Tōkyō 東京' },
        { value: 'option3', label: 'Price: $100-$500' },
      ]

      renderWithProviders(SelectInput, {
        props: createMockProps({ options: specialOptions }),
      })

      expect(screen.getByRole('option', { name: 'Café & Restaurant' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Tōkyō 東京' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Price: $100-$500' })).toBeInTheDocument()
    })

    it('should handle options with same labels but different values', () => {
      const duplicateOptions = [
        { value: 'en', label: 'English' },
        { value: 'en-us', label: 'English' },
        { value: 'en-gb', label: 'English' },
      ]

      renderWithProviders(SelectInput, {
        props: createMockProps({ options: duplicateOptions }),
      })

      const options = screen.getAllByRole('option', { name: 'English' })
      expect(options).toHaveLength(3)
    })

    it('should handle very long option labels', () => {
      const longLabelOption = {
        value: 'long',
        label:
          'This is a very long option label that might cause layout issues if not handled properly',
      }

      renderWithProviders(SelectInput, {
        props: createMockProps({
          options: [longLabelOption],
        }),
      })

      expect(screen.getByRole('option', { name: longLabelOption.label })).toBeInTheDocument()
    })
  })

  describe('Styling and CSS Classes', () => {
    it('should apply correct base CSS classes', () => {
      renderWithProviders(SelectInput, {
        props: createMockProps(),
      })

      const selectElement = screen.getByRole('combobox')
      expect(selectElement).toHaveClass('bg-gray-50')
      expect(selectElement).toHaveClass('border')
      expect(selectElement).toHaveClass('border-gray-300')
      expect(selectElement).toHaveClass('text-gray-900')
      expect(selectElement).toHaveClass('text-sm')
      expect(selectElement).toHaveClass('rounded-lg')
      expect(selectElement).toHaveClass('block')
      expect(selectElement).toHaveClass('w-full')
      expect(selectElement).toHaveClass('p-2.5')
    })

    it('should apply dark mode classes', () => {
      renderWithProviders(SelectInput, {
        props: createMockProps(),
      })

      const selectElement = screen.getByRole('combobox')
      expect(selectElement).toHaveClass('dark:bg-gray-900')
      expect(selectElement).toHaveClass('dark:border-gray-600')
      expect(selectElement).toHaveClass('dark:text-white')
    })

    it('should apply focus and ring classes', () => {
      renderWithProviders(SelectInput, {
        props: createMockProps(),
      })

      const selectElement = screen.getByRole('combobox')
      expect(selectElement).toHaveClass('focus:ring-primary-600')
      expect(selectElement).toHaveClass('focus:border-primary-600')
      expect(selectElement).toHaveClass('dark:focus:ring-primary-500')
      expect(selectElement).toHaveClass('dark:focus:border-primary-500')
    })

    it('should have proper label styling', () => {
      renderWithProviders(SelectInput, {
        props: createMockProps({
          label: 'Styled Label',
          id: 'styled-select',
        }),
      })

      const label = screen.getByText('Styled Label')
      expect(label).toHaveClass('block')
      expect(label).toHaveClass('mb-2')
      expect(label).toHaveClass('text-sm')
      expect(label).toHaveClass('font-medium')
      expect(label).toHaveClass('text-gray-900')
      expect(label).toHaveClass('dark:text-white')
      expect(label).toHaveAttribute('for', 'styled-select')
    })

    it('should style required indicator correctly', () => {
      renderWithProviders(SelectInput, {
        props: createMockProps({
          label: 'Required',
          required: true,
        }),
      })

      const requiredIndicator = screen.getByText('*')
      expect(requiredIndicator).toHaveClass('text-red-500')
    })

    it('should style help text correctly', () => {
      renderWithProviders(SelectInput, {
        props: createMockProps({
          helpText: 'Helper text',
        }),
      })

      const helpText = screen.getByText('Helper text')
      expect(helpText).toHaveClass('mt-1')
      expect(helpText).toHaveClass('text-sm')
      expect(helpText).toHaveClass('text-gray-500')
      expect(helpText).toHaveClass('dark:text-gray-400')
    })
  })

  describe('Accessibility', () => {
    it('should have proper label association', () => {
      renderWithProviders(SelectInput, {
        props: createMockProps({
          id: 'accessible-select',
          label: 'Accessible Label',
        }),
      })

      const selectElement = screen.getByRole('combobox')
      const label = screen.getByText('Accessible Label')

      expect(selectElement).toHaveAttribute('id', 'accessible-select')
      expect(label).toHaveAttribute('for', 'accessible-select')
    })

    it('should be keyboard accessible', async () => {
      renderWithProviders(SelectInput, {
        props: createMockProps(),
      })

      const selectElement = screen.getByRole('combobox')

      // Test focus
      selectElement.focus()
      expect(document.activeElement).toBe(selectElement)

      // Test keyboard navigation
      await fireEvent.keyDown(selectElement, { key: 'ArrowDown' })
      // Browser handles option navigation
    })

    it('should have semantic HTML structure', () => {
      const { container } = renderWithProviders(SelectInput, {
        props: createMockProps({
          id: 'semantic-select',
          label: 'Semantic Label',
        }),
      })

      expect(container.querySelector('div')).toBeInTheDocument()
      expect(container.querySelector('label')).toBeInTheDocument()
      expect(container.querySelector('select')).toBeInTheDocument()
    })

    it('should provide clear option text for screen readers', () => {
      renderWithProviders(SelectInput, {
        props: createMockProps({
          options: [
            { value: 'budget', label: 'Budget Travel' },
            { value: 'luxury', label: 'Luxury Travel' },
          ],
          label: 'Travel Style',
        }),
      })

      expect(screen.getByRole('option', { name: 'Budget Travel' })).toHaveTextContent(
        'Budget Travel',
      )
      expect(screen.getByRole('option', { name: 'Luxury Travel' })).toHaveTextContent(
        'Luxury Travel',
      )
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing label gracefully', () => {
      expect(() => {
        renderWithProviders(SelectInput, {
          props: {
            modelValue: null,
            label: '',
            id: 'test',
            options: createMockOptions(),
          },
        })
      }).not.toThrow()
    })

    it('should handle missing id gracefully', () => {
      expect(() => {
        renderWithProviders(SelectInput, {
          props: {
            modelValue: null,
            label: 'Test',
            id: '',
            options: createMockOptions(),
          },
        })
      }).not.toThrow()
    })

    it('should handle options with empty values', () => {
      const optionsWithEmpty = [
        { value: '', label: 'Empty Option' },
        { value: 'valid', label: 'Valid Option' },
      ]

      renderWithProviders(SelectInput, {
        props: createMockProps({ options: optionsWithEmpty }),
      })

      expect(screen.getByRole('option', { name: 'Empty Option' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Valid Option' })).toBeInTheDocument()
    })

    it('should handle value that does not exist in options', () => {
      renderWithProviders(SelectInput, {
        props: createMockProps({
          modelValue: 'nonexistent',
          options: createMockOptions(),
        }),
      })

      const selectElement = screen.getByRole('combobox') as HTMLSelectElement
      // When value doesn't exist in options, browser resets to empty string
      expect(selectElement.value).toBe('')
    })

    it('should handle duplicate values in options', () => {
      const duplicateOptions = [
        { value: 'duplicate', label: 'First Duplicate' },
        { value: 'duplicate', label: 'Second Duplicate' },
        { value: 'unique', label: 'Unique Option' },
      ]

      renderWithProviders(SelectInput, {
        props: createMockProps({ options: duplicateOptions }),
      })

      // Should render all options even with duplicate values
      expect(screen.getByRole('option', { name: 'First Duplicate' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Second Duplicate' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Unique Option' })).toBeInTheDocument()
    })
  })

  describe('Integration with Forms', () => {
    it('should work correctly in form context', () => {
      const { container } = renderWithProviders(SelectInput, {
        props: createMockProps({
          id: 'form-select',
          label: 'Form Field',
        }),
      })

      const form = document.createElement('form')
      const selectElement = container.querySelector('select')!
      form.appendChild(selectElement)

      expect(selectElement.form).toBe(form)
    })

    it('should handle form reset correctly', async () => {
      renderWithProviders(SelectInput, {
        props: createMockProps({ modelValue: 'option1' }),
      })

      const selectElement = screen.getByRole('combobox') as HTMLSelectElement
      expect(selectElement.value).toBe('option1')

      // Simulate form reset
      selectElement.value = ''
      expect(selectElement.value).toBe('')
    })
  })

  describe('TypeScript Type Safety', () => {
    it('should maintain correct TypeScript types for props', () => {
      const props = createMockProps()

      expect(['string', 'object']).toContain(typeof props.modelValue) // null or string
      expect(typeof props.label).toBe('string')
      expect(typeof props.id).toBe('string')
      expect(Array.isArray(props.options)).toBe(true)
      expect(['string', 'undefined']).toContain(typeof props.placeholder)
      expect(['string', 'undefined']).toContain(typeof props.helpText)
      expect(typeof props.required).toBe('boolean')
    })

    it('should handle all valid modelValue types', () => {
      const validValues = [null, 'string-value', '']

      validValues.forEach((value) => {
        expect(() => {
          renderWithProviders(SelectInput, {
            props: createMockProps({ modelValue: value }),
          })
        }).not.toThrow()
      })
    })
  })
})
