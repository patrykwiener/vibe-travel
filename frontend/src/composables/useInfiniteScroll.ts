import { ref, onMounted, onBeforeUnmount } from 'vue'

/**
 * Composable for infinite scroll functionality
 * Detects when user scrolls near the bottom and triggers load more action
 *
 * @param loadMore - Function to call when more items need to be loaded
 * @param threshold - Distance from bottom (in pixels) to trigger load (default: 200px)
 * @param externalLoadingState - Optional external loading state to check (for synchronization)
 * @returns Object with scroll state and utilities
 */
export function useInfiniteScroll(
  loadMore: () => Promise<void> | void, 
  threshold: number = 200,
  externalLoadingState?: () => boolean
) {
  const isNearBottom = ref(false)
  const scrollContainer = ref<HTMLElement | null>(null)
  const lastTriggerTime = ref(0)

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

    isNearBottom.value = distanceFromBottom <= threshold

    // Check if we should trigger load more
    const isCurrentlyLoading = externalLoadingState ? externalLoadingState() : false
    const timeSinceLastTrigger = Date.now() - lastTriggerTime.value
    const minInterval = 500 // Minimum 500ms between triggers

    // Only trigger if:
    // 1. We are near the bottom (either just entered or still there after new content loaded)
    // 2. We're not already loading (external state)
    // 3. Enough time has passed since last trigger
    const shouldTrigger = isNearBottom.value && !isCurrentlyLoading && timeSinceLastTrigger >= minInterval
    
    if (shouldTrigger) {
      lastTriggerTime.value = Date.now()
      
      // Use a try-catch and don't await to avoid blocking the scroll handler
      Promise.resolve(loadMore()).catch((error) => {
        console.error('Infinite scroll: Load more failed:', error)
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

  // Reset the infinite scroll state (useful when initial load completes)
  const resetScrollState = () => {
    lastTriggerTime.value = 0
    isNearBottom.value = false
  }

  return {
    isNearBottom,
    scrollContainer,
    setScrollContainer,
    checkScroll,
    resetScrollState,
    setupScrollListener,
    cleanupScrollListener,
  }
}
