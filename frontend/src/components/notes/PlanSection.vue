<script setup lang="ts">
import { computed } from 'vue'
import PlanTypeLabel from './PlanTypeLabel.vue'
import PlanEditor from './PlanEditor.vue'

export interface PlanSectionProps {
  planText: string
  planType: 'AI' | 'MANUAL' | 'HYBRID' | null
  isGenerating: boolean
  isSaving: boolean
  canSave: boolean
  canDiscard: boolean
}

export interface PlanSectionEmits {
  generate: []
  save: []
  discard: []
  'update:planText': [value: string]
}

const props = defineProps<PlanSectionProps>()
defineEmits<PlanSectionEmits>()

const maxCharacters = 3000
const isCharacterLimitExceeded = computed(() => (props.planText?.length || 0) > maxCharacters)
</script>

<template>
  <div class="mb-10">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
      <div class="flex items-center gap-2">
        <h3 class="text-xl font-bold text-gray-900 dark:text-white">Travel Plan</h3>
        <PlanTypeLabel :plan-type="planType" :is-draft="canSave" />
      </div>
      <div class="mt-4 md:mt-0">
        <button
          @click="$emit('generate')"
          :disabled="isGenerating"
          type="button"
          class="text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="isGenerating">Generating...</span>
          <span v-else>Generate Plan</span>
        </button>
      </div>
    </div>

    <!-- Plan Editor -->
    <div
      class="p-4 bg-white border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700"
    >
      <div class="grid grid-cols-1 gap-6">
        <PlanEditor
          :model-value="planText"
          :max-characters="maxCharacters"
          :disabled="isGenerating"
          @update:model-value="$emit('update:planText', $event)"
        />

        <div class="flex items-center space-x-4">
          <button
            @click="$emit('save')"
            :disabled="!canSave || isSaving || isCharacterLimitExceeded"
            type="button"
            class="text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="isSaving">Saving...</span>
            <span v-else>Save Changes</span>
          </button>

          <button
            v-if="canDiscard"
            @click="$emit('discard')"
            :disabled="isSaving"
            type="button"
            class="text-gray-900 bg-white hover:bg-gray-100 border border-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:focus:ring-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Discard Changes
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
