<script setup lang="ts">
import { initFlowbite } from 'flowbite'
import { onMounted } from 'vue'

// Initialize Flowbite when component is mounted
onMounted(() => {
  initFlowbite()
})
</script>

<template>
  <div class="bg-gray-50 dark:bg-gray-900 min-h-screen">
    <div class="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
      <!-- Logo -->
      <a
        href="/"
        class="flex items-center mb-8 text-2xl font-semibold text-gray-900 dark:text-white"
      >
        <img class="w-8 h-8 mr-2" src="/src/assets/logo.jpeg" alt="VibeTravels Logo" />
        VibeTravels
      </a>
      
      <!-- Auth card container -->
      <div
        class="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700"
      >
        <!-- Content slot -->
        <slot></slot>
      </div>
      
      <!-- Decorative background element -->
      <div class="mt-8 text-center">
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Transform simple notes into detailed travel plans
        </p>
      </div>
    </div>
  </div>
</template>
