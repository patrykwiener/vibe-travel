<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

interface Props {
  variant?: 'floating' | 'header'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'header',
})

const router = useRouter()
const authStore = useAuthStore()

// Handle click - navigate to note creation
const handleClick = () => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }

  router.push('/notes/new')
}

// Styling based on variant
const buttonClasses = computed(() => {
  const baseClasses =
    'inline-flex items-center font-medium text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 transition-colors'

  if (props.variant === 'floating') {
    return `${baseClasses} fixed bottom-6 right-6 px-4 py-4 rounded-full shadow-lg hover:shadow-xl z-50`
  }

  return `${baseClasses} px-5 py-2.5 text-sm rounded-lg`
})

const iconClasses = computed(() => {
  return props.variant === 'floating' ? 'w-6 h-6' : 'w-4 h-4 mr-2'
})

const showText = computed(() => props.variant === 'header')
</script>

<template>
  <button
    @click="handleClick"
    type="button"
    :class="buttonClasses"
    :aria-label="variant === 'floating' ? 'Create new note' : undefined"
  >
    <!-- Plus Icon -->
    <svg
      :class="iconClasses"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
    </svg>

    <!-- Text (only for header variant) -->
    <span v-if="showText"> Create Note </span>
  </button>
</template>
