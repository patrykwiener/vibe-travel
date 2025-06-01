import { ref, onMounted, onBeforeUnmount } from 'vue'

/**
 * Composable for infinite scroll functionality
 * Detects when user scrolls near the bottom and triggers load more action
 *
 * @param loadMore - Function to call when more items need to be loaded
 * @param threshold - Distance from bottom (in pixels) to trigger load (default: 200px)
 * @returns Object with scroll state and utilities
 */
export function useInfiniteScroll(loadMore: () => Promise<void> | void, threshold: number = 200) {
  const isNearBottom = ref(false)
  const scrollContainer = ref<HTMLElement | null>(null)
  const isLoading = ref(false)

  // Check if user has scrolled near the bottom
  const checkScrollPosition = () => {
    let scrollTop: number
    let scrollHeight: number
    let clientHeight: number

    if (scrollContainer.value) {
      // Use specific container
      scrollTop = scrollContainer.value.scrollTop
      scrollHeight = scrollContainer.value.scrollHeight
      clientHeight = scrollContainer.value.clientHeight
    } else {
      // Use window/document
      scrollTop = window.pageYOffset || document.documentElement.scrollTop
      scrollHeight = document.documentElement.scrollHeight
      clientHeight = window.innerHeight
    }

    const distanceFromBottom = scrollHeight - scrollTop - clientHeight

    const wasNearBottom = isNearBottom.value
    isNearBottom.value = distanceFromBottom <= threshold

    // Only trigger if we just entered the "near bottom" zone and we're not already loading
    if (isNearBottom.value && !wasNearBottom && !isLoading.value) {
      console.log('Triggering load more from infinite scroll')
      isLoading.value = true
      Promise.resolve(loadMore()).finally(() => {
        // Add a small delay to prevent rapid successive calls
        setTimeout(() => {
          isLoading.value = false
        }, 500)
      })
    }
  }

  // Throttled scroll handler to prevent excessive calls
  let isThrottled = false
  const throttledScrollHandler = () => {
    if (isThrottled) return

    isThrottled = true
    requestAnimationFrame(() => {
      checkScrollPosition()
      isThrottled = false
    })
  }

  // Set up scroll listener
  const setupScrollListener = (element?: HTMLElement) => {
    const target = element || scrollContainer.value || window

    if (target) {
      target.addEventListener('scroll', throttledScrollHandler, { passive: true })
    }
  }

  // Clean up scroll listener
  const cleanupScrollListener = (element?: HTMLElement) => {
    const target = element || scrollContainer.value || window

    if (target) {
      target.removeEventListener('scroll', throttledScrollHandler)
    }
  }

  // Setup on mount
  onMounted(() => {
    setupScrollListener()
  })

  // Cleanup on unmount
  onBeforeUnmount(() => {
    cleanupScrollListener()
  })

  // Manual setup for custom scroll container
  const setScrollContainer = (element: HTMLElement) => {
    // Clean up previous listener
    if (scrollContainer.value) {
      cleanupScrollListener(scrollContainer.value)
    }

    scrollContainer.value = element
    setupScrollListener(element)
  }

  // Force check scroll position (useful for initial load or after content changes)
  const checkScroll = () => {
    checkScrollPosition()
  }

  return {
    isNearBottom,
    scrollContainer,
    setScrollContainer,
    checkScroll,
    setupScrollListener,
    cleanupScrollListener,
    isLoading,
  }
}
