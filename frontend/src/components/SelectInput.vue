<script setup lang="ts">
interface SelectOption {
  value: string
  label: string
}

interface Props {
  modelValue: string | null
  label: string
  id: string
  options: SelectOption[]
  placeholder?: string
  helpText?: string
  required?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string | null): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>

<template>
  <div>
    <label :for="id" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    <select
      :id="id"
      :value="modelValue || ''"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value || null)"
      class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-900 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
    >
      <option value="">{{ placeholder || `Select ${label.toLowerCase()}` }}</option>
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
    <p v-if="helpText" class="mt-1 text-sm text-gray-500 dark:text-gray-400">
      {{ helpText }}
    </p>
  </div>
</template>
