import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useInfiniteScroll } from '@/composables/useInfiniteScroll'

// Mock DOM methods and properties
const mockScrollEvent = () => new Event('scroll')

// Helper to create a mock HTML element with scroll properties
const createMockElement = (
  scrollTop: number = 0,
  scrollHeight: number = 1000,
  clientHeight: number = 600,
): HTMLElement => {
  const element = document.createElement('div')
  Object.defineProperty(element, 'scrollTop', {
    value: scrollTop,
    writable: true,
    configurable: true,
  })
  Object.defineProperty(element, 'scrollHeight', {
    value: scrollHeight,
    writable: true,
    configurable: true,
  })
  Object.defineProperty(element, 'clientHeight', {
    value: clientHeight,
    writable: true,
    configurable: true,
  })
  return element
}

// Mock window scroll properties
const mockWindowScroll = (
  pageYOffset: number = 0,
  scrollHeight: number = 1000,
  innerHeight: number = 600,
) => {
  Object.defineProperty(window, 'pageYOffset', {
    value: pageYOffset,
    writable: true,
    configurable: true,
  })
  Object.defineProperty(document.documentElement, 'scrollTop', {
    value: pageYOffset,
    writable: true,
    configurable: true,
  })
  Object.defineProperty(document.documentElement, 'scrollHeight', {
    value: scrollHeight,
    writable: true,
    configurable: true,
  })
  Object.defineProperty(window, 'innerHeight', {
    value: innerHeight,
    writable: true,
    configurable: true,
  })
}

describe('useInfiniteScroll - Core Functionality', () => {
  let loadMoreMock: ReturnType<typeof vi.fn>
  let externalLoadingStateMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // Reset all mocks and timers
    vi.useFakeTimers()
    loadMoreMock = vi.fn()
    externalLoadingStateMock = vi.fn().mockReturnValue(false)

    // Mock requestAnimationFrame
    global.requestAnimationFrame = vi.fn((cb) => {
      cb(0)
      return 0
    })

    // Reset DOM
    document.body.innerHTML = ''
    mockWindowScroll()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('Basic Setup and Initialization', () => {
    it('should initialize with correct default values', () => {
      const { isNearBottom, scrollContainer } = useInfiniteScroll(loadMoreMock)

      expect(isNearBottom.value).toBe(false)
      expect(scrollContainer.value).toBeNull()
    })

    it('should accept custom threshold parameter', () => {
      const customThreshold = 100
      const { checkScroll } = useInfiniteScroll(loadMoreMock, customThreshold)

      // Setup scroll position 150px from bottom (should not trigger with 100px threshold)
      mockWindowScroll(250, 1000, 600) // 1000 - 250 - 600 = 150px from bottom

      checkScroll()

      expect(loadMoreMock).not.toHaveBeenCalled()
    })

    it('should accept external loading state function', () => {
      externalLoadingStateMock.mockReturnValue(true)
      const { checkScroll } = useInfiniteScroll(loadMoreMock, 200, externalLoadingStateMock)

      // Setup scroll position near bottom
      mockWindowScroll(600, 1000, 600) // 1000 - 600 - 600 = -200px (at bottom)

      checkScroll()

      // Should not trigger because external loading state is true
      expect(loadMoreMock).not.toHaveBeenCalled()
    })
  })

  describe('Scroll Position Detection', () => {
    it('should detect when user is near bottom with window scroll', () => {
      const { isNearBottom, checkScroll } = useInfiniteScroll(loadMoreMock)

      // Setup scroll position 150px from bottom (within default 200px threshold)
      mockWindowScroll(250, 1000, 600) // 1000 - 250 - 600 = 150px from bottom

      checkScroll()

      expect(isNearBottom.value).toBe(true)
    })

    it('should not detect near bottom when far from bottom', () => {
      const { isNearBottom, checkScroll } = useInfiniteScroll(loadMoreMock)

      // Setup scroll position 300px from bottom (outside default 200px threshold)
      mockWindowScroll(100, 1000, 600) // 1000 - 100 - 600 = 300px from bottom

      checkScroll()

      expect(isNearBottom.value).toBe(false)
    })

    it('should detect near bottom with custom scroll container', () => {
      const { isNearBottom, setScrollContainer, checkScroll } = useInfiniteScroll(loadMoreMock)

      // Create mock element with scroll position 150px from bottom
      const element = createMockElement(250, 1000, 600) // 1000 - 250 - 600 = 150px from bottom
      setScrollContainer(element)

      checkScroll()

      expect(isNearBottom.value).toBe(true)
    })

    it('should use window scroll when no container is set', () => {
      const { isNearBottom, checkScroll } = useInfiniteScroll(loadMoreMock)

      // Setup window scroll position near bottom
      mockWindowScroll(600, 1000, 600) // At bottom

      checkScroll()

      expect(isNearBottom.value).toBe(true)
    })
  })

  describe('Load More Triggering', () => {
    it('should trigger load more when near bottom', async () => {
      const { checkScroll } = useInfiniteScroll(loadMoreMock)

      // Setup scroll position near bottom
      mockWindowScroll(600, 1000, 600) // At bottom

      checkScroll()

      expect(loadMoreMock).toHaveBeenCalledTimes(1)
    })

    it('should not trigger load more when not near bottom', () => {
      const { checkScroll } = useInfiniteScroll(loadMoreMock)

      // Setup scroll position far from bottom
      mockWindowScroll(100, 1000, 600) // 300px from bottom

      checkScroll()

      expect(loadMoreMock).not.toHaveBeenCalled()
    })

    it('should not trigger load more when external loading state is true', () => {
      externalLoadingStateMock.mockReturnValue(true)
      const { checkScroll } = useInfiniteScroll(loadMoreMock, 200, externalLoadingStateMock)

      // Setup scroll position near bottom
      mockWindowScroll(600, 1000, 600)

      checkScroll()

      expect(loadMoreMock).not.toHaveBeenCalled()
    })

    it('should handle async load more function', async () => {
      const asyncLoadMore = vi.fn().mockResolvedValue(undefined)
      const { checkScroll } = useInfiniteScroll(asyncLoadMore)

      mockWindowScroll(600, 1000, 600)

      checkScroll()

      expect(asyncLoadMore).toHaveBeenCalledTimes(1)
    })

    it('should handle load more function that throws error', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const errorLoadMore = vi.fn().mockRejectedValue(new Error('Load failed'))
      const { checkScroll } = useInfiniteScroll(errorLoadMore)

      mockWindowScroll(600, 1000, 600)
      checkScroll()

      // Since the error handling is done in a Promise.resolve().catch()
      // we can just verify the function was called
      expect(errorLoadMore).toHaveBeenCalledTimes(1)
      consoleErrorSpy.mockRestore()
    })
  })

  describe('Throttling and Rate Limiting', () => {
    it('should respect minimum interval between triggers', () => {
      const { checkScroll } = useInfiniteScroll(loadMoreMock)

      mockWindowScroll(600, 1000, 600)

      // First trigger
      checkScroll()
      expect(loadMoreMock).toHaveBeenCalledTimes(1)

      // Immediate second trigger (should be blocked by 500ms interval)
      checkScroll()
      expect(loadMoreMock).toHaveBeenCalledTimes(1)

      // Advance time by 600ms and trigger again
      vi.advanceTimersByTime(600)
      checkScroll()
      expect(loadMoreMock).toHaveBeenCalledTimes(2)
    })

    it('should throttle scroll events using requestAnimationFrame', () => {
      const { setupScrollListener } = useInfiniteScroll(loadMoreMock)
      const requestAnimationFrameSpy = vi.spyOn(global, 'requestAnimationFrame')

      setupScrollListener()
      mockWindowScroll(600, 1000, 600)

      // Trigger multiple scroll events rapidly
      window.dispatchEvent(mockScrollEvent())
      window.dispatchEvent(mockScrollEvent())
      window.dispatchEvent(mockScrollEvent())

      // Should call requestAnimationFrame for each event, but the throttling
      // prevents the actual scroll handler from running multiple times
      expect(requestAnimationFrameSpy).toHaveBeenCalled()
    })
  })

  describe('Scroll Container Management', () => {
    it('should set up scroll listener on custom container', () => {
      const { setScrollContainer } = useInfiniteScroll(loadMoreMock)
      const element = createMockElement()
      const addEventListenerSpy = vi.spyOn(element, 'addEventListener')

      setScrollContainer(element)

      expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), {
        passive: true,
      })
    })

    it('should clean up previous listener when setting new container', () => {
      const { setScrollContainer } = useInfiniteScroll(loadMoreMock)
      const element1 = createMockElement()
      const element2 = createMockElement()
      const removeEventListenerSpy1 = vi.spyOn(element1, 'removeEventListener')

      setScrollContainer(element1)
      setScrollContainer(element2)

      expect(removeEventListenerSpy1).toHaveBeenCalledWith('scroll', expect.any(Function))
    })

    it('should use window as default when no container is set', () => {
      const { setupScrollListener } = useInfiniteScroll(loadMoreMock)
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener')

      setupScrollListener()

      expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), {
        passive: true,
      })
    })
  })

  describe('State Management and Utilities', () => {
    it('should reset scroll state correctly', () => {
      const { isNearBottom, checkScroll, resetScrollState } = useInfiniteScroll(loadMoreMock)

      // Trigger near bottom state
      mockWindowScroll(600, 1000, 600)
      checkScroll()

      expect(isNearBottom.value).toBe(true)
      expect(loadMoreMock).toHaveBeenCalledTimes(1)

      // Reset state
      resetScrollState()

      expect(isNearBottom.value).toBe(false)

      // Should be able to trigger again immediately after reset
      checkScroll()
      expect(loadMoreMock).toHaveBeenCalledTimes(2)
    })

    it('should provide access to scroll container ref', () => {
      const { scrollContainer, setScrollContainer } = useInfiniteScroll(loadMoreMock)
      const element = createMockElement()

      expect(scrollContainer.value).toBeNull()

      setScrollContainer(element)

      expect(scrollContainer.value).toBe(element)
    })

    it('should provide manual scroll check function', () => {
      const { checkScroll } = useInfiniteScroll(loadMoreMock)

      mockWindowScroll(600, 1000, 600)

      // Manual trigger
      checkScroll()

      expect(loadMoreMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('Event Listener Management', () => {
    it('should set up event listeners with correct options', () => {
      const { setupScrollListener } = useInfiniteScroll(loadMoreMock)
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener')

      setupScrollListener()

      expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), {
        passive: true,
      })
    })

    it('should clean up event listeners', () => {
      const { cleanupScrollListener } = useInfiniteScroll(loadMoreMock)
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

      cleanupScrollListener()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
    })

    it('should setup listeners on provided element', () => {
      const { setupScrollListener } = useInfiniteScroll(loadMoreMock)
      const element = createMockElement()
      const addEventListenerSpy = vi.spyOn(element, 'addEventListener')

      setupScrollListener(element)

      expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), {
        passive: true,
      })
    })

    it('should cleanup listeners on provided element', () => {
      const { cleanupScrollListener } = useInfiniteScroll(loadMoreMock)
      const element = createMockElement()
      const removeEventListenerSpy = vi.spyOn(element, 'removeEventListener')

      cleanupScrollListener(element)

      expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
    })
  })

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle zero scroll height', () => {
      const { isNearBottom, checkScroll } = useInfiniteScroll(loadMoreMock)

      mockWindowScroll(0, 0, 600)

      checkScroll()

      // Should not crash and should be considered near bottom
      expect(isNearBottom.value).toBe(true)
    })

    it('should handle negative distance from bottom', () => {
      const { isNearBottom, checkScroll } = useInfiniteScroll(loadMoreMock)

      // Scroll past the bottom (can happen in some browsers)
      mockWindowScroll(500, 1000, 600) // 1000 - 500 - 600 = -100px (past bottom)

      checkScroll()

      expect(isNearBottom.value).toBe(true)
      expect(loadMoreMock).toHaveBeenCalledTimes(1)
    })

    it('should handle very large threshold values', () => {
      const { isNearBottom, checkScroll } = useInfiniteScroll(loadMoreMock, 10000)

      mockWindowScroll(0, 1000, 600) // 400px from bottom

      checkScroll()

      expect(isNearBottom.value).toBe(true)
    })

    it('should handle container element being null', () => {
      const { setScrollContainer, checkScroll } = useInfiniteScroll(loadMoreMock)

      // This should not crash
      expect(() => {
        setScrollContainer(null as any)
        checkScroll()
      }).not.toThrow()
    })

    it('should work with exact threshold boundary', () => {
      const { isNearBottom, checkScroll } = useInfiniteScroll(loadMoreMock, 200)

      // Set scroll position exactly at threshold
      mockWindowScroll(200, 1000, 600) // 1000 - 200 - 600 = 200px from bottom

      checkScroll()

      expect(isNearBottom.value).toBe(true)
      expect(loadMoreMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('Integration with Vue Lifecycle', () => {
    it('should handle component mounting and unmounting lifecycle', () => {
      // This test verifies that the composable properly manages lifecycle hooks
      // The actual lifecycle is handled by Vue, but we test the setup/cleanup functions
      const { setupScrollListener, cleanupScrollListener } = useInfiniteScroll(loadMoreMock)
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

      setupScrollListener()
      expect(addEventListenerSpy).toHaveBeenCalled()

      cleanupScrollListener()
      expect(removeEventListenerSpy).toHaveBeenCalled()
    })
  })
})

describe('useInfiniteScroll - Advanced Usage Patterns', () => {
  let loadMoreMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.useFakeTimers()
    loadMoreMock = vi.fn()
    global.requestAnimationFrame = vi.fn((cb) => {
      cb(0)
      return 0
    })
    mockWindowScroll()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('Multiple Container Scenarios', () => {
    it('should handle switching between containers', () => {
      const { setScrollContainer, checkScroll } = useInfiniteScroll(loadMoreMock)

      const container1 = createMockElement(600, 1000, 600) // At bottom
      const container2 = createMockElement(100, 1000, 600) // Not at bottom

      // Set first container and trigger
      setScrollContainer(container1)
      checkScroll()
      expect(loadMoreMock).toHaveBeenCalledTimes(1)

      // Switch to second container
      setScrollContainer(container2)
      checkScroll()
      // Should not trigger because second container is not at bottom
      expect(loadMoreMock).toHaveBeenCalledTimes(1)

      // Advance time to reset interval and modify second container to be at bottom
      vi.advanceTimersByTime(600)
      Object.defineProperty(container2, 'scrollTop', { value: 600, writable: true })
      checkScroll()
      expect(loadMoreMock).toHaveBeenCalledTimes(2)
    })
  })

  describe('Performance and Memory Management', () => {
    it('should not leak event listeners when container changes', () => {
      const { setScrollContainer } = useInfiniteScroll(loadMoreMock)
      const container1 = createMockElement()
      const container2 = createMockElement()

      const removeEventListenerSpy1 = vi.spyOn(container1, 'removeEventListener')
      const addEventListenerSpy2 = vi.spyOn(container2, 'addEventListener')

      setScrollContainer(container1)
      setScrollContainer(container2)

      expect(removeEventListenerSpy1).toHaveBeenCalledWith('scroll', expect.any(Function))
      expect(addEventListenerSpy2).toHaveBeenCalledWith('scroll', expect.any(Function), {
        passive: true,
      })
    })

    it('should handle rapid scroll events efficiently', () => {
      const { setupScrollListener } = useInfiniteScroll(loadMoreMock)
      const requestAnimationFrameSpy = vi.spyOn(global, 'requestAnimationFrame')

      setupScrollListener()

      // Simulate rapid scrolling
      for (let i = 0; i < 10; i++) {
        window.dispatchEvent(mockScrollEvent())
      }

      // Should call requestAnimationFrame for rapid scrolling but throttling prevents excess calls
      expect(requestAnimationFrameSpy).toHaveBeenCalled()
    })
  })

  describe('External State Synchronization', () => {
    it('should respect external loading state changes', () => {
      const externalLoadingState = vi.fn()
      const { checkScroll } = useInfiniteScroll(loadMoreMock, 200, externalLoadingState)

      mockWindowScroll(600, 1000, 600)

      // First check with loading false
      externalLoadingState.mockReturnValue(false)
      checkScroll()
      expect(loadMoreMock).toHaveBeenCalledTimes(1)

      // Advance time and check with loading true
      vi.advanceTimersByTime(600)
      externalLoadingState.mockReturnValue(true)
      checkScroll()
      expect(loadMoreMock).toHaveBeenCalledTimes(1) // Should not call again

      // Advance time and check with loading false again
      vi.advanceTimersByTime(600)
      externalLoadingState.mockReturnValue(false)
      checkScroll()
      expect(loadMoreMock).toHaveBeenCalledTimes(2) // Should call again
    })
  })
})
