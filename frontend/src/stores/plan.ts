import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from './auth'
import {
  notesPlanRouterGetActivePlan,
  notesPlanRouterGeneratePlan,
  notesPlanRouterCreateOrAcceptPlan,
  notesPlanRouterUpdatePlan
} from '@/client/sdk.gen'
import { apiCall, apiCallOptional } from '@/utils/api-interceptor'
import type {
  PlanOutSchema,
  PlanGenerateOutSchema,
  PlanCreateInSchema,
  PlanUpdateInSchema,
  PlanTypeEnum
} from '@/client/types.gen'

export const usePlanStore = defineStore('plan', () => {
  const authStore = useAuthStore()

  // State
  const activeNoteId = ref<number | string | null>(null)
  const planId = ref<number | null>(null)
  const planText = ref<string>('')
  const currentPlanType = ref<PlanTypeEnum | null>(null)
  const generationId = ref<string | null>(null)
  const originalPlanTextForAI = ref<string | null>(null)
  const originalSavedPlanText = ref<string>('')
  const originalSavedPlanType = ref<PlanTypeEnum | null>(null)
  const isModified = ref<boolean>(false)

  // Loading states
  const isGeneratingPlan = ref<boolean>(false)
  const isSavingPlan = ref<boolean>(false)
  const isLoadingInitialPlan = ref<boolean>(false)

  // Getters
  const isPlanTextTooLong = computed(() => planText.value.length > 5000)

  const canSaveChanges = computed(() => {
    const hasModifications = isModified.value
    const hasUnsavedGeneration = generationId.value !== null && planId.value === null
    const isNotTooLong = !isPlanTextTooLong.value
    const hasContent = planText.value.trim() !== '' || generationId.value !== null

    return (hasModifications || hasUnsavedGeneration) && isNotTooLong && hasContent
  })

  const canDiscardChanges = computed(() => {
    // Can discard if there are modifications or unsaved generations, and we have an active note to reload from
    const hasModifications = isModified.value
    const hasUnsavedGeneration = generationId.value !== null && planId.value === null
    const hasActiveNote = activeNoteId.value !== null

    return (hasModifications || hasUnsavedGeneration) && hasActiveNote
  })

  // Actions
  const setActiveNoteId = (noteId: number | string) => {
    // Only reset if we're switching to a different note
    if (activeNoteId.value !== noteId) {
      activeNoteId.value = noteId
      resetPlanState()
    } else {
      activeNoteId.value = noteId
    }
  }

  const resetPlanState = () => {
    planId.value = null
    planText.value = ''
    currentPlanType.value = null
    generationId.value = null
    originalPlanTextForAI.value = null
    originalSavedPlanText.value = ''
    originalSavedPlanType.value = null
    isModified.value = false
    isGeneratingPlan.value = false
    isSavingPlan.value = false
    isLoadingInitialPlan.value = false
  }

  const setInitialPlanData = (planData: PlanOutSchema) => {
    planId.value = planData.id
    planText.value = planData.plan_text
    currentPlanType.value = planData.type
    generationId.value = planData.generation_id
    originalSavedPlanText.value = planData.plan_text
    originalSavedPlanType.value = planData.type
    isModified.value = false
    // For AI and HYBRID plans with generation_id, we might still have the original AI text reference
    // For HYBRID plans without generation_id, this will be null, which is correct
    originalPlanTextForAI.value = (planData.type === 'AI' || planData.type === 'HYBRID') && planData.generation_id ? planData.plan_text : null
  }

  const clearPlanData = () => {
    resetPlanState()
  }

  const updatePlanText = (newText: string) => {
    console.log('updatePlanText called with:', {
      newText,
      currentPlanType: currentPlanType.value,
      originalPlanTextForAI: originalPlanTextForAI.value,
      originalSavedPlanText: originalSavedPlanText.value,
      isModified: isModified.value
    })

    planText.value = newText

    // Check if the text has been modified from the saved state
    isModified.value = newText !== originalSavedPlanText.value

    // Update plan type based on changes
    if (newText === originalSavedPlanText.value) {
      // User reverted to the exact saved state - restore the original saved plan type
      currentPlanType.value = originalSavedPlanType.value
    } else if (originalPlanTextForAI.value !== null) {
      // This plan has AI origins (either AI or HYBRID with AI reference)
      if (newText === originalPlanTextForAI.value && originalSavedPlanType.value === 'AI') {
        // User reverted back to original AI text AND the saved state was AI
        currentPlanType.value = 'AI'
      } else {
        // User modified the text - becomes HYBRID
        currentPlanType.value = 'HYBRID'
      }
    } else {
      // No AI origin reference
      if (currentPlanType.value === 'HYBRID') {
        // If it's already HYBRID, keep it HYBRID
        currentPlanType.value = 'HYBRID'
      } else if (!currentPlanType.value && newText.trim() !== '') {
        // If no plan type is set and user starts typing, it's a manual plan
        currentPlanType.value = 'MANUAL'
      } else if (currentPlanType.value === 'MANUAL') {
        // Keep it as MANUAL if it was already MANUAL
        currentPlanType.value = 'MANUAL'
      }
      // For any other case, don't change the plan type
    }
  }

  const setGeneratedAIPlan = (data: PlanGenerateOutSchema) => {
    planText.value = data.plan_text
    currentPlanType.value = 'AI'
    generationId.value = data.generation_id
    originalPlanTextForAI.value = data.plan_text
    // Don't update originalSavedPlanText here - keep the last saved state for discard
    isModified.value = false // Świeżo wygenerowany, niezmodyfikowany
    planId.value = null      // To nowa propozycja, nie zapisana, więc nie ma planId
  }

  const setSavedPlan = (savedPlanData: PlanOutSchema) => {
    planId.value = savedPlanData.id
    planText.value = savedPlanData.plan_text
    currentPlanType.value = savedPlanData.type
    originalSavedPlanText.value = savedPlanData.plan_text
    originalSavedPlanType.value = savedPlanData.type
    isModified.value = false
    generationId.value = savedPlanData.generation_id
    // For AI and HYBRID plans with generation_id, we might still have the original AI text reference
    // For HYBRID plans without generation_id, this will be null, which is correct
    originalPlanTextForAI.value = (savedPlanData.type === 'AI' || savedPlanData.type === 'HYBRID') && savedPlanData.generation_id ? savedPlanData.plan_text : null
  }

  const discardChanges = async () => {
    if (!activeNoteId.value) return

    try {
      // Simply reload the plan from the backend to get the correct saved state
      await loadPlanForNote(activeNoteId.value)
    } catch (error) {
      console.error('Failed to reload plan when discarding changes:', error)
      throw error
    }
  }

  // API Actions
  const loadPlanForNote = async (noteId: number | string) => {
    if (!authStore.isAuthenticated) {
      throw new Error('User must be authenticated to load plan')
    }

    isLoadingInitialPlan.value = true

    try {
      const planData = await apiCallOptional(() =>
        notesPlanRouterGetActivePlan({
          path: { note_id: Number(noteId) }
        })
      )

      if (planData) {
        setInitialPlanData(planData)
      } else {
        clearPlanData()
      }
    } catch (e) {
      console.error('Failed to load plan:', e)
      throw e
    } finally {
      isLoadingInitialPlan.value = false
    }
  }

  const generatePlan = async () => {
    if (!authStore.isAuthenticated || !activeNoteId.value) {
      throw new Error('User must be authenticated and note must be selected to generate plan')
    }

    isGeneratingPlan.value = true

    try {
      const response = await apiCall(() =>
        notesPlanRouterGeneratePlan({
          path: { note_id: Number(activeNoteId.value) }
        })
      )

      setGeneratedAIPlan(response)
      return response
    } catch (e) {
      console.error('Failed to generate plan:', e)
      throw e
    } finally {
      isGeneratingPlan.value = false
    }
  }

  const savePlan = async () => {
    if (!authStore.isAuthenticated || !activeNoteId.value) {
      throw new Error('User must be authenticated and note must be selected to save plan')
    }

    isSavingPlan.value = true

    try {
      let response: PlanOutSchema

      if (planId.value) {
        // Update existing plan
        const updateData: PlanUpdateInSchema = {
          plan_text: planText.value
        }

        console.log('Updating existing plan with:', updateData)

        response = await apiCall(() =>
          notesPlanRouterUpdatePlan({
            path: { note_id: Number(activeNoteId.value) },
            body: updateData
          })
        )
      } else {
        // Create new plan - handle different scenarios based on plan type and generation_id
        const createData: PlanCreateInSchema = {}

        if (currentPlanType.value === 'AI' && generationId.value) {
          // Accept AI plan without modifications - only generation_id
          createData.generation_id = generationId.value
        } else if (currentPlanType.value === 'HYBRID' && generationId.value) {
          // Hybrid plan: AI generated but modified by user - both generation_id and plan_text
          createData.generation_id = generationId.value
          createData.plan_text = planText.value
        } else {
          // Manual plan or any case without generation_id - only plan_text
          if (!planText.value?.trim()) {
            throw new Error('Plan text cannot be empty for manual plans')
          }
          createData.plan_text = planText.value
        }

        console.log('Creating new plan with:', createData)

        response = await apiCall(() =>
          notesPlanRouterCreateOrAcceptPlan({
            path: { note_id: Number(activeNoteId.value) },
            body: createData
          })
        )
      }

      setSavedPlan(response)
      return response
    } catch (e) {
      console.error('Failed to save plan:', e)
      throw e
    } finally {
      isSavingPlan.value = false
    }
  }

  const resetState = () => {
    activeNoteId.value = null
    resetPlanState()
  }

  return {
    // State
    activeNoteId: computed(() => activeNoteId.value),
    planId: computed(() => planId.value),
    planText: computed(() => planText.value),
    currentPlanType: computed(() => currentPlanType.value),
    generationId: computed(() => generationId.value),
    originalPlanTextForAI: computed(() => originalPlanTextForAI.value),
    originalSavedPlanText: computed(() => originalSavedPlanText.value),
    originalSavedPlanType: computed(() => originalSavedPlanType.value),
    isModified: computed(() => isModified.value),
    isGeneratingPlan: computed(() => isGeneratingPlan.value),
    isSavingPlan: computed(() => isSavingPlan.value),
    isLoadingInitialPlan: computed(() => isLoadingInitialPlan.value),

    // Getters
    isPlanTextTooLong,
    canSaveChanges,
    canDiscardChanges,

    // Actions
    setActiveNoteId,
    resetPlanState,
    setInitialPlanData,
    clearPlanData,
    updatePlanText,
    setGeneratedAIPlan,
    setSavedPlan,
    discardChanges,
    loadPlanForNote,
    generatePlan,
    savePlan,
    resetState
  }
})
