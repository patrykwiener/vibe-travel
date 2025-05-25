import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from './auth'

export interface Note {
  id: string
  userId: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed'
  tags?: string[]
}

export interface Plan {
  id: string
  noteId: string
  userId: string
  title: string
  content: string
  destination: string
  startDate?: string
  endDate?: string
  createdAt: string
  updatedAt: string
}

export const useNotesStore = defineStore('notes', () => {
  const authStore = useAuthStore()

  const notes = ref<Note[]>([])
  const plans = ref<Plan[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const userNotes = computed(() => {
    if (!authStore.user) return []
    return notes.value.filter((note) => note.userId === authStore.user?.id)
  })

  const userPlans = computed(() => {
    if (!authStore.user) return []
    return plans.value.filter((plan) => plan.userId === authStore.user?.id)
  })

  const fetchNotes = async () => {
    if (!authStore.token) return

    isLoading.value = true
    error.value = null

    try {
      // TODO: Implement actual API call once backend is connected
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Simulated response
      notes.value = [
        {
          id: '1',
          userId: authStore.user?.id || '',
          title: 'Weekend in Barcelona',
          content:
            'I want to spend a weekend in Barcelona. Looking for cultural spots, good food, and some beach time.',
          createdAt: '2025-04-12T10:00:00Z',
          updatedAt: '2025-04-12T10:00:00Z',
          processingStatus: 'completed',
          tags: ['city', 'beach', 'culture'],
        },
        {
          id: '2',
          userId: authStore.user?.id || '',
          title: 'Japan in Cherry Blossom Season',
          content:
            'Planning a two-week trip to Japan during cherry blossom season. Would like to visit Tokyo, Kyoto, and Osaka.',
          createdAt: '2025-05-01T14:30:00Z',
          updatedAt: '2025-05-01T14:30:00Z',
          processingStatus: 'pending',
          tags: ['japan', 'culture', 'spring'],
        },
      ]
    } catch (e) {
      console.error('Fetch notes error:', e)
      error.value = 'Failed to load notes.'
    } finally {
      isLoading.value = false
    }
  }

  const fetchPlans = async () => {
    if (!authStore.token) return

    isLoading.value = true
    error.value = null

    try {
      // TODO: Implement actual API call once backend is connected
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Simulated response
      plans.value = [
        {
          id: '1',
          noteId: '1',
          userId: authStore.user?.id || '',
          title: 'Barcelona Weekend Itinerary',
          content:
            '# Day 1\n- Morning: Visit Sagrada Familia\n- Afternoon: Explore Gothic Quarter\n- Evening: Dinner at El Nacional\n\n# Day 2\n- Morning: Park Güell\n- Afternoon: Beach time at Barceloneta\n- Evening: Tapas tour',
          destination: 'Barcelona, Spain',
          startDate: '2025-06-15',
          endDate: '2025-06-17',
          createdAt: '2025-04-12T11:30:00Z',
          updatedAt: '2025-04-12T11:30:00Z',
        },
      ]
    } catch (e) {
      console.error('Fetch plans error:', e)
      error.value = 'Failed to load travel plans.'
    } finally {
      isLoading.value = false
    }
  }

  const createNote = async (title: string, content: string, tags?: string[]) => {
    if (!authStore.token || !authStore.user) return null

    isLoading.value = true
    error.value = null

    try {
      // TODO: Implement actual API call once backend is connected
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Simulated response - create a new note with a unique ID
      const newNote: Note = {
        id: `note-${Date.now()}`,
        userId: authStore.user.id,
        title,
        content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        processingStatus: 'pending',
        tags,
      }

      // Add to the list
      notes.value.push(newNote)

      return newNote
    } catch (e) {
      console.error('Create note error:', e)
      error.value = 'Failed to create note.'
      return null
    } finally {
      isLoading.value = false
    }
  }

  const updateNote = async (id: string, updates: Partial<Note>) => {
    if (!authStore.token) return false

    isLoading.value = true
    error.value = null

    try {
      // TODO: Implement actual API call once backend is connected
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Update in the local state
      const noteIndex = notes.value.findIndex((note) => note.id === id)
      if (noteIndex !== -1) {
        notes.value[noteIndex] = {
          ...notes.value[noteIndex],
          ...updates,
          updatedAt: new Date().toISOString(),
        }
      }

      return true
    } catch (e) {
      console.error('Update note error:', e)
      error.value = 'Failed to update note.'
      return false
    } finally {
      isLoading.value = false
    }
  }

  const deleteNote = async (id: string) => {
    if (!authStore.token) return false

    isLoading.value = true
    error.value = null

    try {
      // TODO: Implement actual API call once backend is connected
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Remove from the local state
      notes.value = notes.value.filter((note) => note.id !== id)

      return true
    } catch (e) {
      console.error('Delete note error:', e)
      error.value = 'Failed to delete note.'
      return false
    } finally {
      isLoading.value = false
    }
  }

  const generatePlan = async (noteId: string) => {
    if (!authStore.token || !authStore.user) return null

    isLoading.value = true
    error.value = null

    try {
      // First update the note status
      const noteIndex = notes.value.findIndex((note) => note.id === noteId)
      if (noteIndex !== -1) {
        notes.value[noteIndex].processingStatus = 'processing'
      }

      // TODO: Implement actual API call to the AI service once backend is connected
      // This would be an async operation that might take time
      await new Promise((resolve) => setTimeout(resolve, 3000)) // Simulate AI processing

      // Find the note we're generating a plan for
      const note = notes.value.find((n) => n.id === noteId)
      if (!note) {
        throw new Error('Note not found')
      }

      // Simulated response - create a new plan
      const newPlan: Plan = {
        id: `plan-${Date.now()}`,
        noteId,
        userId: authStore.user.id,
        title: `${note.title} - Plan`,
        content: `# Generated Travel Plan for: ${note.title}\n\n## Destination Overview\nBased on your note, here's a customized travel plan.\n\n## Itinerary\n- Day 1: Arrival and settling in\n- Day 2: Main attractions\n- Day 3: Local experiences\n\n## Recommendations\n- Stay at: Hotel Example\n- Don't miss: Local cuisine\n- Travel tip: Use public transportation`,
        destination: note.title.split(' ').pop() || 'Unknown',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Update the note status to completed
      if (noteIndex !== -1) {
        notes.value[noteIndex].processingStatus = 'completed'
      }

      // Add the plan to our list
      plans.value.push(newPlan)

      return newPlan
    } catch (e) {
      console.error('Generate plan error:', e)
      error.value = 'Failed to generate travel plan.'

      // Update the note status to failed
      const noteIndex = notes.value.findIndex((note) => note.id === noteId)
      if (noteIndex !== -1) {
        notes.value[noteIndex].processingStatus = 'failed'
      }

      return null
    } finally {
      isLoading.value = false
    }
  }

  return {
    notes,
    plans,
    isLoading,
    error,
    userNotes,
    userPlans,
    fetchNotes,
    fetchPlans,
    createNote,
    updateNote,
    deleteNote,
    generatePlan,
  }
})
