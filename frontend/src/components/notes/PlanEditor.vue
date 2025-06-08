<script setup lang="ts">
import { computed } from 'vue'

export interface PlanEditorProps {
  modelValue: string
  maxCharacters?: number
  rows?: number
  placeholder?: string
  disabled?: boolean
}

export interface PlanEditorEmits {
  'update:modelValue': [value: string]
}

const props = withDefaults(defineProps<PlanEditorProps>(), {
  maxCharacters: 3000,
  rows: 25,
  placeholder: 'Your travel plan will appear here...',
  disabled: false,
})

const emit = defineEmits<PlanEditorEmits>()

const characterCount = computed(() => props.modelValue?.length || 0)
const isCharacterLimitExceeded = computed(() => characterCount.value > props.maxCharacters)

const updateValue = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div>
    <label for="plan_text" class="sr-only">Plan content</label>
    <textarea
      id="plan_text"
      :value="modelValue"
      @input="updateValue"
      :rows="rows"
      :disabled="disabled"
      :class="[
        'bg-gray-50 border text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500',
        isCharacterLimitExceeded ? 'border-red-300 dark:border-red-600' : 'border-gray-300',
        disabled ? 'opacity-50 cursor-not-allowed' : '',
      ]"
      :placeholder="placeholder"
    ></textarea>

    <!-- Character Counter -->
    <div class="flex justify-between items-center mt-2">
      <div class="text-sm text-gray-500 dark:text-gray-400">
        <span :class="{ 'text-red-600 dark:text-red-400': isCharacterLimitExceeded }">
          {{ characterCount }}/{{ maxCharacters }} characters
        </span>
      </div>
      <div v-if="isCharacterLimitExceeded" class="text-sm text-red-600 dark:text-red-400">
        Plan is too long. Please shorten it to save.
      </div>
    </div>
  </div>
</template>
