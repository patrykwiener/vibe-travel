<script setup lang="ts">
// Note Edit view component
</script>

<template>
  <div
    class="py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-6 bg-gray-100 dark:bg-gray-800 min-h-screen"
  >
    <div class="mx-auto max-w-2xl p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
      <div class="mb-6">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">Edit Note</h2>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Update your trip details</p>
      </div>

      <form class="space-y-6">
        <div>
          <label for="title" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
            Title
          </label>
          <input
            type="text"
            id="title"
            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
            value="Weekend in Paris"
            required
          />
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Title must be 3-255 characters long
          </p>
        </div>

        <div>
          <label for="place" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
            Place
          </label>
          <input
            type="text"
            id="place"
            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
            value="Paris, France"
            required
          />
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Place must be 3-255 characters long
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              for="date_from"
              class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Start Date
            </label>
            <input
              type="date"
              id="date_from"
              class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
              value="2025-06-10"
              required
            />
          </div>
          <div>
            <label
              for="date_to"
              class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              End Date
            </label>
            <input
              type="date"
              id="date_to"
              class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
              value="2025-06-12"
              required
            />
          </div>
        </div>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          End date must be within 14 days of start date
        </p>

        <div>
          <label
            for="number_of_people"
            class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
          >
            Number of People
          </label>
          <input
            type="number"
            id="number_of_people"
            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
            min="1"
            max="20"
            value="2"
            required
          />
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Value must be between 1 and 20
          </p>
        </div>

        <div>
          <label
            for="key_ideas"
            class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
          >
            Key Ideas
          </label>
          <textarea
            id="key_ideas"
            rows="4"
            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
          >
Visit the Eiffel Tower, enjoy a river cruise on the Seine, explore Montmartre, and visit the Louvre.
Would like to try authentic French cuisine and have a picnic in a park if the weather is nice.
Interested in visiting some less touristy areas as well.</textarea
          >
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Maximum 5000 characters</p>
        </div>

        <div class="flex items-center space-x-4">
          <button
            type="submit"
            class="text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
          >
            Save Changes
          </button>
          <router-link
            :to="`/notes/1`"
            class="text-gray-900 bg-white hover:bg-gray-100 border border-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:focus:ring-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700"
          >
            Cancel
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>
