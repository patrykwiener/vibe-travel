import { ref, watch } from 'vue'

/**
 * Composable for debouncing search input
 * Delays the execution of search until user stops typing
 *
 * @param delay - Debounce delay in milliseconds (default: 300ms)
 * @param minLength - Minimum length required for search (default: 2)
 * @returns Object with search query reactive refs and utilities
 */
export function useSearchDebounce(delay: number = 300, minLength: number = 2) {
  const searchQuery = ref('')
  const debouncedQuery = ref('')
  const isSearching = ref(false)

  let timeoutId: ReturnType<typeof setTimeout> | null = null

  // Watch for changes in searchQuery and debounce the updates
  watch(searchQuery, (newValue) => {
    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    // Set searching state only if the value meets criteria for triggering search
    if (newValue.length === 0 || newValue.length >= minLength) {
      isSearching.value = true
    }

    // Set new timeout
    timeoutId = setTimeout(() => {
      // Only update debouncedQuery if the value meets minimum length or is empty (for clearing)
      if (newValue.length === 0 || newValue.length >= minLength) {
        debouncedQuery.value = newValue
      }
      isSearching.value = false
      timeoutId = null
    }, delay)
  })

  // Clear search function
  const clearSearch = () => {
    searchQuery.value = ''
    debouncedQuery.value = ''
    isSearching.value = false

    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  // Manual trigger for immediate search
  const triggerSearchNow = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }

    // Only trigger if minimum length is met or search is empty (for clearing)
    if (searchQuery.value.length === 0 || searchQuery.value.length >= minLength) {
      debouncedQuery.value = searchQuery.value
    }
    isSearching.value = false
  }

  return {
    searchQuery,
    debouncedQuery,
    isSearching,
    clearSearch,
    triggerSearchNow,
  }
}
