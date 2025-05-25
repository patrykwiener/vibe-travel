<script setup lang="ts">
// User Profile view component
</script>

<template>
  <div
    class="py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-6 bg-gray-100 dark:bg-gray-800 min-h-screen"
  >
    <div class="mx-auto max-w-2xl p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
      <div class="mb-6">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">Travel Preferences</h2>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Set your travel preferences to get personalized travel plans.
        </p>
      </div>

      <form class="space-y-6">
        <div>
          <label
            for="travel_style"
            class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
          >
            Travel Style
          </label>
          <select
            id="travel_style"
            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
          >
            <option value="">Not Specified</option>
            <option value="Relax">Relax</option>
            <option value="Adventure">Adventure</option>
            <option value="Culture">Culture</option>
            <option value="Party">Party</option>
          </select>
        </div>

        <div>
          <label
            for="preferred_pace"
            class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
          >
            Preferred Pace
          </label>
          <select
            id="preferred_pace"
            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
          >
            <option value="">Not Specified</option>
            <option value="Calm">Calm</option>
            <option value="Moderate">Moderate</option>
            <option value="Intense">Intense</option>
          </select>
        </div>

        <div>
          <label for="budget" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
            Budget
          </label>
          <select
            id="budget"
            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
          >
            <option value="">Not Specified</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>

        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Last updated: <span class="font-medium">Not updated yet</span>
          </p>
        </div>

        <button
          type="submit"
          class="text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
        >
          Save Preferences
        </button>
      </form>
    </div>
  </div>
</template>
