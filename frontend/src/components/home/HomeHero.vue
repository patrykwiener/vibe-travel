<script setup lang="ts">
// Hero section component for the landing page
</script>

<template>
  <section class="bg-white dark:bg-gray-900">
    <div class="grid max-w-screen-xl px-8 py-8 mx-auto lg:gap-8 xl:gap-0 lg:py-16 lg:grid-cols-12">
      <div class="mr-auto place-self-center lg:col-span-7">
        <h1
          class="max-w-2xl mb-4 text-4xl font-extrabold tracking-tight leading-none md:text-5xl xl:text-6xl dark:text-white"
        >
          Transform Your Travel Ideas into Perfect Itineraries
        </h1>
        <p
          class="max-w-2xl mb-6 font-light text-gray-500 lg:mb-8 md:text-lg lg:text-xl dark:text-gray-400"
        >
          VibeTravels helps you convert simple notes into detailed travel plans using AI. Create
          engaging trips tailored to your preferences without the hassle of endless research.
        </p>
        <div class="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
          <router-link
            to="/register"
            class="inline-flex items-center justify-center px-5 py-3 mr-3 text-base font-medium text-center text-white rounded-lg bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 dark:focus:ring-primary-900"
          >
            Get started
            <svg
              class="w-5 h-5 ml-2 -mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                clip-rule="evenodd"
              ></path>
            </svg>
          </router-link>
          <router-link
            to="/login"
            class="inline-flex items-center justify-center px-5 py-3 text-base font-medium text-center text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 dark:text-white dark:border-gray-700 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
          >
            Learn more
          </router-link>
        </div>
      </div>
      <div class="hidden lg:mt-0 lg:col-span-5 lg:flex">
        <img src="/src/assets/logo.jpeg" alt="mockup" />
      </div>
    </div>
  </section>
</template>
