<script setup lang="ts">
// Note Detail view component
</script>

<template>
  <div
    class="py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-6 bg-gray-100 dark:bg-gray-800 min-h-screen"
  >
    <!-- Note Details Section -->
    <div class="mb-8">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Weekend in Paris</h2>
          <div class="mt-2 text-sm text-gray-700 dark:text-gray-400 space-y-1">
            <div><span class="font-medium">Place:</span> Paris, France</div>
            <div><span class="font-medium">Dates:</span> 10-12 Jun 2025 (3 days)</div>
            <div><span class="font-medium">People:</span> 2</div>
          </div>
        </div>
        <div class="mt-4 md:mt-0 flex flex-col sm:flex-row gap-2">
          <router-link
            :to="`/notes/1/edit`"
            class="text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
          >
            Edit Note
          </router-link>
          <button
            type="button"
            class="text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800"
          >
            Delete Note
          </button>
        </div>
      </div>

      <div
        class="mt-6 bg-white border border-gray-200 rounded-lg p-6 dark:bg-gray-800 dark:border-gray-700"
      >
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">Key Ideas</h3>
        <p class="text-gray-700 dark:text-gray-400">
          Visit the Eiffel Tower, enjoy a river cruise on the Seine, explore Montmartre, and visit
          the Louvre. Would like to try authentic French cuisine and have a picnic in a park if the
          weather is nice. Interested in visiting some less touristy areas as well.
        </p>
      </div>
    </div>

    <!-- Plan Section -->
    <div class="mb-10">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <h3 class="text-xl font-bold text-gray-900 dark:text-white">Travel Plan</h3>
        <div class="mt-4 md:mt-0">
          <button
            type="button"
            class="text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
          >
            Generate Plan
          </button>
        </div>
      </div>

      <!-- Plan Editor -->
      <div
        class="p-4 bg-white border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700"
      >
        <div class="grid grid-cols-1 gap-6">
          <div>
            <label for="plan_text" class="sr-only">Plan content</label>
            <textarea
              id="plan_text"
              rows="12"
              class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
              placeholder="Your travel plan will appear here..."
            ></textarea>
          </div>

          <div class="flex items-center space-x-4">
            <button
              type="button"
              class="text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
            >
              Save Plan
            </button>
            <button
              type="button"
              class="text-gray-900 bg-white hover:bg-gray-100 border border-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:focus:ring-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700"
            >
              Reject Plan
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Back to Notes -->
    <div>
      <router-link to="/notes" class="inline-flex items-center text-blue-600 hover:underline">
        <svg
          class="w-3.5 h-3.5 me-2"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 14 10"
        >
          <path
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 5H1m0 0l4 4M1 5l4-4"
          />
        </svg>
        Back to Notes List
      </router-link>
    </div>
  </div>
</template>
