import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { renderWithProviders } from '@/test/utils'

// Simple test component for demonstration
const TestComponent = {
  template: '<div data-testid="test">Hello World</div>',
}

describe('Test Environment Setup', () => {
  it('should render a simple component', () => {
    const wrapper = mount(TestComponent)
    expect(wrapper.find('[data-testid="test"]').text()).toBe('Hello World')
  })

  it('should work with testing library', () => {
    const { getByTestId } = renderWithProviders(TestComponent)
    expect(getByTestId('test')).toBeInTheDocument()
    expect(getByTestId('test')).toHaveTextContent('Hello World')
  })

  it('should have access to vitest globals', () => {
    expect(describe).toBeDefined()
    expect(it).toBeDefined()
    expect(expect).toBeDefined()
  })
})
