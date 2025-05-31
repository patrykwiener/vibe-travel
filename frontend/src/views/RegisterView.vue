<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { ApiError } from '@/utils/api-errors'

const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const acceptTerms = ref(false)
const localError = ref<string | null>(null)

// Form validation
const passwordsMatch = computed(() => {
  if (confirmPassword.value === '') return true
  return password.value === confirmPassword.value
})

const passwordTooShort = computed(() => {
  return password.value !== '' && password.value.length < 8
})

const passwordValid = computed(() => {
  return password.value.length >= 8
})

const hasValidationErrors = computed(() => {
  return (
    email.value.trim() === '' ||
    password.value === '' ||
    passwordTooShort.value ||
    (!passwordsMatch.value && confirmPassword.value !== '') ||
    !acceptTerms.value
  )
})

// Clear confirm password when main password becomes invalid
watch(passwordValid, (newValid) => {
  if (!newValid) {
    confirmPassword.value = ''
  }
})

// Form submission handler
const handleRegister = async (event: Event) => {
  event.preventDefault()
  localError.value = null // Clear previous errors

  if (!passwordsMatch.value) {
    localError.value = "Passwords don't match"
    return
  }

  if (passwordTooShort.value) {
    localError.value = 'Password must be at least 8 characters long'
    return
  }

  if (!acceptTerms.value) {
    localError.value = 'You must accept the Terms and Conditions'
    return
  }

  try {
    await authStore.register(email.value, password.value)
  } catch (error) {
    if (error instanceof ApiError) {
      localError.value = error.userMessage
    } else {
      localError.value = 'An unexpected error occurred. Please try again.'
    }
  }
}
</script>

<template>
  <AuthLayout>
    <div class="p-6 space-y-4 md:space-y-6 sm:p-8">
      <h1
        class="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white"
      >
        Create an account
      </h1>
      <form @submit="handleRegister" class="space-y-4 md:space-y-6">
        <!-- Error Alert - Following Flowbite alert standards -->
        <div
          v-if="localError"
          class="flex items-center p-4 mb-4 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800"
          role="alert"
        >
          <svg
            class="flex-shrink-0 inline w-4 h-4 mr-3"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z"
            />
          </svg>
          <span class="sr-only">Error</span>
          <div>{{ localError }}</div>
        </div>

        <!-- Email Field -->
        <div>
          <label for="email" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >Your email</label
          >
          <input
            v-model="email"
            type="email"
            name="email"
            id="email"
            class="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            placeholder="name@company.com"
            required
          />
        </div>

        <!-- Password Field -->
        <div>
          <label for="password" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >Password</label
          >
          <input
            v-model="password"
            type="password"
            name="password"
            id="password"
            placeholder="••••••••"
            class="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            required
          />
          <p v-if="passwordTooShort" class="mt-1 text-sm text-red-600 dark:text-red-400">
            Password must be at least 8 characters long
          </p>
        </div>

        <!-- Confirm Password Field -->
        <div>
          <label
            for="confirm-password"
            class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >Confirm password</label
          >
          <input
            v-model="confirmPassword"
            type="password"
            name="confirm-password"
            id="confirm-password"
            placeholder="••••••••"
            :disabled="!passwordValid"
            :class="[
              'bg-gray-50 border text-gray-900 rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500',
              !passwordValid
                ? 'opacity-50 cursor-not-allowed'
                : passwordsMatch
                ? 'border-gray-300 focus:ring-primary-600 focus:border-primary-600 dark:focus:ring-blue-500 dark:focus:border-blue-500'
                : 'border-red-500 focus:ring-red-500 focus:border-red-500 dark:focus:ring-red-500 dark:focus:border-red-500',
            ]"
            required
          />
          <p
            v-if="!passwordsMatch && confirmPassword !== ''"
            class="mt-1 text-sm text-red-600 dark:text-red-400"
          >
            Passwords don't match
          </p>
        </div>

        <div class="flex items-start">
          <div class="flex items-center h-5">
            <input
              v-model="acceptTerms"
              id="terms"
              aria-describedby="terms"
              type="checkbox"
              class="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-primary-300 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-primary-600 dark:ring-offset-gray-800"
              required
            />
          </div>
          <div class="ml-3 text-sm">
            <label for="terms" class="font-light text-gray-500 dark:text-gray-300">
              I accept the
              <a class="font-medium text-primary-600 hover:underline dark:text-primary-500" href="#"
                >Terms and Conditions</a
              >
            </label>
          </div>
        </div>

        <button
          type="submit"
          class="w-full text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary-600"
          :disabled="authStore.isLoading || hasValidationErrors"
        >
          <span v-if="authStore.isLoading">
            <svg
              class="inline w-4 h-4 mr-2 text-gray-200 animate-spin fill-primary-600"
              viewBox="0 0 100 101"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                fill="currentColor"
              />
              <path
                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                fill="currentFill"
              />
            </svg>
            Creating account...
          </span>
          <span v-else>Create an account</span>
        </button>

        <p class="text-sm font-light text-gray-500 dark:text-gray-400">
          Already have an account?
          <router-link
            to="/login"
            class="font-medium text-primary-600 hover:underline dark:text-primary-500"
            >Login here</router-link
          >
        </p>
      </form>
    </div>
  </AuthLayout>
</template>
