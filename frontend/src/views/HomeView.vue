<script setup lang="ts">
import HomeHero from '@/components/HomeHero.vue'
import HomeFeatures from '@/components/HomeFeatures.vue'
</script>

<template>
  <div class="bg-gray-100 dark:bg-gray-800">
    <HomeHero />
    <HomeFeatures />

    <!-- CTA Section -->
    <section class="bg-white dark:bg-gray-900">
      <div class="py-8 px-4 mx-auto max-w-screen-xl sm:py-16 lg:px-6">
        <div class="mx-auto max-w-screen-sm text-center">
          <h2
            class="mb-4 text-4xl tracking-tight font-extrabold leading-tight text-gray-900 dark:text-white"
          >
            Start your journey today
          </h2>
          <p class="mb-6 font-light text-gray-500 dark:text-gray-400 md:text-lg">
            Create your first travel note and see how VibeTravels can transform your ideas into
            perfect itineraries.
          </p>
          <router-link
            to="/register"
            class="text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-primary-600 dark:hover:bg-primary-700 focus:outline-none dark:focus:ring-primary-800"
          >
            Get started
          </router-link>
        </div>
      </div>
    </section>
  </div>
</template>
