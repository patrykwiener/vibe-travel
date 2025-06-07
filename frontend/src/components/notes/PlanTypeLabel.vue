<script setup lang="ts">
export interface PlanTypeLabelProps {
  planType: 'AI' | 'MANUAL' | 'HYBRID' | null
  isDraft?: boolean
}

defineProps<PlanTypeLabelProps>()
</script>

<template>
  <div class="flex items-center gap-2">
    <!-- Plan Type Label -->
    <span
      v-if="planType === 'AI'"
      class="bg-primary-100 text-primary-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-primary-900 dark:text-primary-300"
    >
      AI Generated
    </span>
    <span
      v-else-if="planType === 'MANUAL'"
      class="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300"
    >
      Manual
    </span>
    <span
      v-else-if="planType === 'HYBRID'"
      class="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-purple-900 dark:text-purple-300"
    >
      Hybrid
    </span>

    <!-- Draft Label -->
    <span
      v-if="isDraft"
      class="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-yellow-900 dark:text-yellow-300"
    >
      Draft
    </span>
  </div>
</template>
