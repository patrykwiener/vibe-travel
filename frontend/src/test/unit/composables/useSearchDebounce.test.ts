import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { useSearchDebounce } from '@/composables/useSearchDebounce'

describe('useSearchDebounce - Core Functionality', () => {
  beforeEach(() => {
    // Reset all mocks and timers
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('Basic Setup and Initialization', () => {
    it('should initialize with correct default values', () => {
      const { searchQuery, debouncedQuery, isSearching } = useSearchDebounce()

      expect(searchQuery.value).toBe('')
      expect(debouncedQuery.value).toBe('')
      expect(isSearching.value).toBe(false)
    })

    it('should accept custom delay parameter', async () => {
      const customDelay = 500
      const { searchQuery, debouncedQuery } = useSearchDebounce(customDelay)

      searchQuery.value = 'test query'
      await nextTick()

      // Should not update debouncedQuery immediately
      expect(debouncedQuery.value).toBe('')

      // Fast forward less than custom delay
      vi.advanceTimersByTime(400)
      expect(debouncedQuery.value).toBe('')

      // Fast forward past custom delay
      vi.advanceTimersByTime(200)
      expect(debouncedQuery.value).toBe('test query')
    })

    it('should accept custom minimum length parameter', async () => {
      const { searchQuery, debouncedQuery } = useSearchDebounce(300, 3)

      // Set query below minimum length
      searchQuery.value = 'ab'
      await nextTick()
      vi.advanceTimersByTime(400)

      // Should not update debouncedQuery
      expect(debouncedQuery.value).toBe('')

      // Set query at minimum length
      searchQuery.value = 'abc'
      await nextTick()
      vi.advanceTimersByTime(400)

      // Should update debouncedQuery
      expect(debouncedQuery.value).toBe('abc')
    })

    it('should use default values when no parameters provided', async () => {
      const { searchQuery, debouncedQuery } = useSearchDebounce()

      // Test default delay (300ms)
      searchQuery.value = 'test'
      await nextTick()
      vi.advanceTimersByTime(299)
      expect(debouncedQuery.value).toBe('')

      vi.advanceTimersByTime(1)
      expect(debouncedQuery.value).toBe('test')
    })
  })

  describe('Debounce Behavior', () => {
    it('should debounce search input changes', async () => {
      const { searchQuery, debouncedQuery } = useSearchDebounce(300)

      // Rapid changes should not update debouncedQuery immediately
      searchQuery.value = 'a'
      await nextTick()
      expect(debouncedQuery.value).toBe('')

      searchQuery.value = 'ab'
      await nextTick()
      expect(debouncedQuery.value).toBe('')

      searchQuery.value = 'abc'
      await nextTick()
      expect(debouncedQuery.value).toBe('')

      // Only after delay should debouncedQuery update
      vi.advanceTimersByTime(300)
      expect(debouncedQuery.value).toBe('abc')
    })

    it('should reset debounce timer on each input change', async () => {
      const { searchQuery, debouncedQuery } = useSearchDebounce(300)

      searchQuery.value = 'test'
      await nextTick()
      vi.advanceTimersByTime(200)

      // Change again before timeout
      searchQuery.value = 'testing'
      await nextTick()
      vi.advanceTimersByTime(200)

      // Should still not be updated (timer was reset)
      expect(debouncedQuery.value).toBe('')

      // Complete the new timeout
      vi.advanceTimersByTime(100)
      expect(debouncedQuery.value).toBe('testing')
    })

    it('should handle rapid consecutive changes correctly', async () => {
      const { searchQuery, debouncedQuery } = useSearchDebounce(300)

      // Simulate rapid typing
      const words = ['t', 'te', 'tes', 'test', 'testi', 'testin', 'testing']
      for (const word of words) {
        searchQuery.value = word
        await nextTick()
        vi.advanceTimersByTime(50) // Fast typing
      }

      // Should still not be updated
      expect(debouncedQuery.value).toBe('')

      // Complete the timeout
      vi.advanceTimersByTime(300)
      expect(debouncedQuery.value).toBe('testing')
    })

    it('should clear timeout when search is cleared', () => {
      const { searchQuery, debouncedQuery, clearSearch } = useSearchDebounce(300)

      searchQuery.value = 'test'
      vi.advanceTimersByTime(200)

      clearSearch()

      // Should clear immediately
      expect(searchQuery.value).toBe('')
      expect(debouncedQuery.value).toBe('')

      // Advancing time should not trigger any update
      vi.advanceTimersByTime(300)
      expect(debouncedQuery.value).toBe('')
    })
  })

  describe('Minimum Length Validation', () => {
    it('should respect minimum length requirement', async () => {
      const { searchQuery, debouncedQuery } = useSearchDebounce(300, 3)

      // Single character (below minimum)
      searchQuery.value = 'a'
      await nextTick()
      vi.advanceTimersByTime(300)
      expect(debouncedQuery.value).toBe('')

      // Two characters (below minimum)
      searchQuery.value = 'ab'
      await nextTick()
      vi.advanceTimersByTime(300)
      expect(debouncedQuery.value).toBe('')

      // Three characters (at minimum)
      searchQuery.value = 'abc'
      await nextTick()
      vi.advanceTimersByTime(300)
      expect(debouncedQuery.value).toBe('abc')

      // More characters (above minimum)
      searchQuery.value = 'abcd'
      await nextTick()
      vi.advanceTimersByTime(300)
      expect(debouncedQuery.value).toBe('abcd')
    })

    it('should allow empty string regardless of minimum length', async () => {
      const { searchQuery, debouncedQuery } = useSearchDebounce(300, 5)

      // Set a value first
      searchQuery.value = 'testing'
      await nextTick()
      vi.advanceTimersByTime(300)
      expect(debouncedQuery.value).toBe('testing')

      // Clear to empty string
      searchQuery.value = ''
      await nextTick()
      vi.advanceTimersByTime(300)
      expect(debouncedQuery.value).toBe('')
    })

    it('should handle minimum length of zero', async () => {
      const { searchQuery, debouncedQuery } = useSearchDebounce(300, 0)

      // Any input should be valid
      searchQuery.value = 'a'
      await nextTick()
      vi.advanceTimersByTime(300)
      expect(debouncedQuery.value).toBe('a')

      searchQuery.value = ''
      await nextTick()
      vi.advanceTimersByTime(300)
      expect(debouncedQuery.value).toBe('')
    })

    it('should handle large minimum length values', async () => {
      const { searchQuery, debouncedQuery } = useSearchDebounce(300, 10)

      searchQuery.value = 'short'
      await nextTick()
      vi.advanceTimersByTime(300)
      expect(debouncedQuery.value).toBe('')

      searchQuery.value = 'this is a long enough query'
      await nextTick()
      vi.advanceTimersByTime(300)
      expect(debouncedQuery.value).toBe('this is a long enough query')
    })
  })

  describe('Loading State Management', () => {
    it('should set isSearching to true when input meets criteria', async () => {
      const { searchQuery, isSearching } = useSearchDebounce(300, 2)

      // Below minimum length - should not set searching
      searchQuery.value = 'a'
      await nextTick()
      expect(isSearching.value).toBe(false)

      // At minimum length - should set searching
      searchQuery.value = 'ab'
      await nextTick()
      expect(isSearching.value).toBe(true)

      // Complete debounce
      vi.advanceTimersByTime(300)
      expect(isSearching.value).toBe(false)
    })

    it('should set isSearching to true for empty string (clearing)', async () => {
      const { searchQuery, isSearching } = useSearchDebounce(300, 3)

      // Set a value first
      searchQuery.value = 'test'
      await nextTick()
      vi.advanceTimersByTime(300)

      // Clear the search
      searchQuery.value = ''
      await nextTick()
      expect(isSearching.value).toBe(true)

      vi.advanceTimersByTime(300)
      expect(isSearching.value).toBe(false)
    })

    it('should reset isSearching when debounce completes', async () => {
      const { searchQuery, isSearching } = useSearchDebounce(300)

      searchQuery.value = 'test'
      await nextTick()
      expect(isSearching.value).toBe(true)

      vi.advanceTimersByTime(300)
      expect(isSearching.value).toBe(false)
    })

    it('should handle isSearching state correctly for rapid changes', async () => {
      const { searchQuery, isSearching } = useSearchDebounce(300)

      searchQuery.value = 'te'
      await nextTick()
      expect(isSearching.value).toBe(true)

      // Change again before timeout
      searchQuery.value = 'test'
      await nextTick()
      expect(isSearching.value).toBe(true)

      // Complete timeout
      vi.advanceTimersByTime(300)
      expect(isSearching.value).toBe(false)
    })
  })

  describe('Clear Search Functionality', () => {
    it('should clear all state when clearSearch is called', () => {
      const { searchQuery, debouncedQuery, isSearching, clearSearch } = useSearchDebounce()

      // Set some state
      searchQuery.value = 'test query'
      vi.advanceTimersByTime(150) // Partial timeout

      clearSearch()

      expect(searchQuery.value).toBe('')
      expect(debouncedQuery.value).toBe('')
      expect(isSearching.value).toBe(false)
    })

    it('should cancel pending timeout when clearSearch is called', () => {
      const { searchQuery, debouncedQuery, clearSearch } = useSearchDebounce(300)

      searchQuery.value = 'test'
      vi.advanceTimersByTime(200)

      clearSearch()

      // Advance remaining time
      vi.advanceTimersByTime(200)

      // Should not update debouncedQuery
      expect(debouncedQuery.value).toBe('')
    })

    it('should allow new search after clearSearch', async () => {
      const { searchQuery, debouncedQuery, clearSearch } = useSearchDebounce(300)

      // Set and clear
      searchQuery.value = 'old query'
      clearSearch()

      // Set new query
      searchQuery.value = 'new query'
      await nextTick()
      vi.advanceTimersByTime(300)

      expect(debouncedQuery.value).toBe('new query')
    })
  })

  describe('Manual Trigger Functionality', () => {
    it('should trigger search immediately when triggerSearchNow is called', () => {
      const { searchQuery, debouncedQuery, triggerSearchNow } = useSearchDebounce(300)

      searchQuery.value = 'test query'

      // Trigger immediately without waiting for debounce
      triggerSearchNow()

      expect(debouncedQuery.value).toBe('test query')
    })

    it('should cancel pending timeout when triggerSearchNow is called', async () => {
      const { searchQuery, debouncedQuery, isSearching, triggerSearchNow } = useSearchDebounce(300)

      searchQuery.value = 'test'
      await nextTick()
      expect(isSearching.value).toBe(true)

      triggerSearchNow()

      expect(debouncedQuery.value).toBe('test')
      expect(isSearching.value).toBe(false)

      // Advancing time should not trigger again
      vi.advanceTimersByTime(300)
      expect(debouncedQuery.value).toBe('test') // Unchanged
    })

    it('should respect minimum length when triggerSearchNow is called', () => {
      const { searchQuery, debouncedQuery, triggerSearchNow } = useSearchDebounce(300, 3)

      // Below minimum length
      searchQuery.value = 'ab'
      triggerSearchNow()
      expect(debouncedQuery.value).toBe('')

      // At minimum length
      searchQuery.value = 'abc'
      triggerSearchNow()
      expect(debouncedQuery.value).toBe('abc')
    })

    it('should allow empty string trigger for clearing', () => {
      const { searchQuery, debouncedQuery, triggerSearchNow } = useSearchDebounce(300, 3)

      // Set initial value
      searchQuery.value = 'test'
      triggerSearchNow()
      expect(debouncedQuery.value).toBe('test')

      // Clear with empty string
      searchQuery.value = ''
      triggerSearchNow()
      expect(debouncedQuery.value).toBe('')
    })

    it('should reset isSearching state when triggerSearchNow is called', async () => {
      const { searchQuery, isSearching, triggerSearchNow } = useSearchDebounce(300)

      searchQuery.value = 'test'
      await nextTick()
      expect(isSearching.value).toBe(true)

      triggerSearchNow()
      expect(isSearching.value).toBe(false)
    })
  })

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle zero delay', async () => {
      const { searchQuery, debouncedQuery } = useSearchDebounce(0)

      searchQuery.value = 'test'
      await nextTick()

      // Should update immediately with zero delay
      vi.advanceTimersByTime(0)
      expect(debouncedQuery.value).toBe('test')
    })

    it('should handle negative delay', async () => {
      const { searchQuery, debouncedQuery } = useSearchDebounce(-100)

      searchQuery.value = 'test'
      await nextTick()

      // Should still work (setTimeout handles negative values as 0)
      vi.advanceTimersByTime(0)
      expect(debouncedQuery.value).toBe('test')
    })

    it('should handle very large delay values', async () => {
      const { searchQuery, debouncedQuery } = useSearchDebounce(10000)

      searchQuery.value = 'test'
      await nextTick()
      vi.advanceTimersByTime(9999)
      expect(debouncedQuery.value).toBe('')

      vi.advanceTimersByTime(1)
      expect(debouncedQuery.value).toBe('test')
    })

    it('should handle negative minimum length', async () => {
      const { searchQuery, debouncedQuery } = useSearchDebounce(300, -1)

      // Any input should be valid with negative minimum length
      searchQuery.value = 'a'
      await nextTick()
      vi.advanceTimersByTime(300)
      expect(debouncedQuery.value).toBe('a')
    })

    it('should handle special characters and unicode', async () => {
      const { searchQuery, debouncedQuery } = useSearchDebounce(300)

      const specialQuery = 'café 🌟 特殊字符'
      searchQuery.value = specialQuery
      await nextTick()
      vi.advanceTimersByTime(300)

      expect(debouncedQuery.value).toBe(specialQuery)
    })

    it('should handle very long strings', async () => {
      const { searchQuery, debouncedQuery } = useSearchDebounce(300)

      const longQuery = 'a'.repeat(10000)
      searchQuery.value = longQuery
      await nextTick()
      vi.advanceTimersByTime(300)

      expect(debouncedQuery.value).toBe(longQuery)
    })

    it('should handle whitespace-only strings', async () => {
      const { searchQuery, debouncedQuery } = useSearchDebounce(300, 2)

      searchQuery.value = '   '
      await nextTick()
      vi.advanceTimersByTime(300)

      expect(debouncedQuery.value).toBe('   ')
    })
  })

  describe('Multiple Instance Isolation', () => {
    it('should maintain separate state for multiple instances', async () => {
      const instance1 = useSearchDebounce(300)
      const instance2 = useSearchDebounce(300)

      instance1.searchQuery.value = 'query1'
      instance2.searchQuery.value = 'query2'
      await nextTick()

      vi.advanceTimersByTime(300)

      expect(instance1.debouncedQuery.value).toBe('query1')
      expect(instance2.debouncedQuery.value).toBe('query2')
    })

    it('should not interfere with each other when clearing', async () => {
      const instance1 = useSearchDebounce(300)
      const instance2 = useSearchDebounce(300)

      instance1.searchQuery.value = 'query1'
      instance2.searchQuery.value = 'query2'
      await nextTick()

      vi.advanceTimersByTime(300)

      instance1.clearSearch()

      expect(instance1.searchQuery.value).toBe('')
      expect(instance1.debouncedQuery.value).toBe('')
      expect(instance2.searchQuery.value).toBe('query2')
      expect(instance2.debouncedQuery.value).toBe('query2')
    })

    it('should handle different configurations per instance', async () => {
      const fastInstance = useSearchDebounce(100, 1)
      const slowInstance = useSearchDebounce(500, 3)

      fastInstance.searchQuery.value = 'ab'
      slowInstance.searchQuery.value = 'abc'
      await nextTick()

      // Fast instance should update first
      vi.advanceTimersByTime(100)
      expect(fastInstance.debouncedQuery.value).toBe('ab')
      expect(slowInstance.debouncedQuery.value).toBe('')

      // Slow instance should update later
      vi.advanceTimersByTime(400)
      expect(slowInstance.debouncedQuery.value).toBe('abc')
    })
  })

  describe('Memory Management and Cleanup', () => {
    it('should clean up timeouts properly', async () => {
      const { searchQuery, clearSearch } = useSearchDebounce(300)
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')

      searchQuery.value = 'test'
      await nextTick()
      clearSearch()

      expect(clearTimeoutSpy).toHaveBeenCalled()
    })

    it('should handle multiple rapid clear operations', () => {
      const { searchQuery, clearSearch } = useSearchDebounce(300)

      searchQuery.value = 'test1'
      clearSearch()
      clearSearch()
      clearSearch()

      // Should not throw or cause issues
      expect(() => {
        vi.advanceTimersByTime(300)
      }).not.toThrow()
    })

    it('should handle triggerSearchNow after clearSearch', () => {
      const { searchQuery, debouncedQuery, clearSearch, triggerSearchNow } = useSearchDebounce(300)

      searchQuery.value = 'test'
      clearSearch()

      searchQuery.value = 'new test'
      triggerSearchNow()

      expect(debouncedQuery.value).toBe('new test')
    })
  })

  describe('Real-world Usage Patterns', () => {
    it('should handle typical search input pattern', async () => {
      const { searchQuery, debouncedQuery, isSearching } = useSearchDebounce(300, 2)

      // User starts typing
      searchQuery.value = 'p'
      await nextTick()
      expect(isSearching.value).toBe(false) // Below minimum

      searchQuery.value = 'pa'
      await nextTick()
      expect(isSearching.value).toBe(true) // At minimum

      searchQuery.value = 'par'
      await nextTick()
      expect(isSearching.value).toBe(true)

      searchQuery.value = 'pari'
      await nextTick()
      expect(isSearching.value).toBe(true)

      searchQuery.value = 'paris'
      await nextTick()
      expect(isSearching.value).toBe(true)

      // User stops typing
      vi.advanceTimersByTime(300)
      expect(debouncedQuery.value).toBe('paris')
      expect(isSearching.value).toBe(false)
    })

    it('should handle backspace/deletion pattern', async () => {
      const { searchQuery, debouncedQuery } = useSearchDebounce(300, 2)

      // Type full word
      searchQuery.value = 'testing'
      await nextTick()
      vi.advanceTimersByTime(300)
      expect(debouncedQuery.value).toBe('testing')

      // Backspace
      searchQuery.value = 'testin'
      await nextTick()
      searchQuery.value = 'testi'
      await nextTick()
      searchQuery.value = 'test'
      await nextTick()

      vi.advanceTimersByTime(300)
      expect(debouncedQuery.value).toBe('test')

      // Delete below minimum
      searchQuery.value = 't'
      await nextTick()
      vi.advanceTimersByTime(300)
      expect(debouncedQuery.value).toBe('test') // Unchanged
    })

    it('should handle search and clear cycle', async () => {
      const { searchQuery, debouncedQuery, clearSearch } = useSearchDebounce(300)

      // Search
      searchQuery.value = 'vacation ideas'
      await nextTick()
      vi.advanceTimersByTime(300)
      expect(debouncedQuery.value).toBe('vacation ideas')

      // Clear
      clearSearch()
      expect(searchQuery.value).toBe('')
      expect(debouncedQuery.value).toBe('')

      // New search
      searchQuery.value = 'travel destinations'
      await nextTick()
      vi.advanceTimersByTime(300)
      expect(debouncedQuery.value).toBe('travel destinations')
    })
  })
})
