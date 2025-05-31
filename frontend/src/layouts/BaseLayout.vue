<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { initFlowbite } from 'flowbite'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// Initialize Flowbite when component is mounted
onMounted(() => {
  initFlowbite()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Mobile menu state
const isMobileMenuOpen = ref(false)
const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

// User dropdown menu state
const isUserMenuOpen = ref(false)
const userMenuRef = ref<HTMLElement | null>(null)

const toggleUserMenu = () => {
  isUserMenuOpen.value = !isUserMenuOpen.value
}

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  if (userMenuRef.value && !userMenuRef.value.contains(event.target as Node)) {
    isUserMenuOpen.value = false
  }
}

// Handle logout
const handleLogout = () => {
  authStore.logout()
  isUserMenuOpen.value = false
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-800">
    <!-- Navbar -->
    <nav class="bg-white border-gray-200 dark:bg-gray-900 sticky top-0 z-40 shadow-md">
      <div class="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
        <a href="/" class="flex items-center space-x-3 rtl:space-x-reverse">
          <img src="/src/assets/logo.jpeg" class="h-8" alt="VibeTravels Logo" />
          <span class="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">
            VibeTravels
          </span>
        </a>
        
        <!-- Navigation and User menu (order-2) -->
        <div class="flex items-center md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
          <!-- Desktop Navigation Links -->
          <div class="hidden md:flex md:items-center md:space-x-8 md:mr-6">
            <router-link
              to="/"
              class="text-base font-medium transition-colors duration-200"
              :class="{
                'text-primary-700 dark:text-primary-500': $route.path === '/',
                'text-gray-700 hover:text-primary-700 dark:text-gray-300 dark:hover:text-primary-500': $route.path !== '/'
              }"
              :aria-current="$route.path === '/' ? 'page' : undefined"
            >
              Home
            </router-link>

            <!-- Links visible only to authenticated users -->
            <template v-if="authStore.isAuthenticated">
              <router-link
                to="/notes"
                class="text-base font-medium transition-colors duration-200"
                :class="{
                  'text-primary-700 dark:text-primary-500': $route.path.startsWith('/notes'),
                  'text-gray-700 hover:text-primary-700 dark:text-gray-300 dark:hover:text-primary-500': !$route.path.startsWith('/notes')
                }"
                :aria-current="$route.path.startsWith('/notes') ? 'page' : undefined"
              >
                Notes
              </router-link>
            </template>

            <!-- Links visible only to guests -->
            <template v-else>
              <router-link
                to="/login"
                class="text-base font-medium transition-colors duration-200"
                :class="{
                  'text-primary-700 dark:text-primary-500': $route.path === '/login',
                  'text-gray-700 hover:text-primary-700 dark:text-gray-300 dark:hover:text-primary-500': $route.path !== '/login'
                }"
                :aria-current="$route.path === '/login' ? 'page' : undefined"
              >
                Sign In
              </router-link>
              <router-link
                to="/register"
                class="text-base font-medium transition-colors duration-200"
                :class="{
                  'text-primary-700 dark:text-primary-500': $route.path === '/register',
                  'text-gray-700 hover:text-primary-700 dark:text-gray-300 dark:hover:text-primary-500': $route.path !== '/register'
                }"
                :aria-current="$route.path === '/register' ? 'page' : undefined"
              >
                Sign Up
              </router-link>
            </template>
          </div>
          
          <!-- Separator line (only on desktop when authenticated) -->
          <div v-if="authStore.isAuthenticated" class="hidden md:block h-6 w-px bg-gray-300 dark:bg-gray-600 mr-6"></div>
          
          <!-- User Menu Dropdown (only when authenticated) -->
          <div v-if="authStore.isAuthenticated" class="relative" ref="userMenuRef">
            <button
              @click="toggleUserMenu"
              type="button"
              class="flex text-sm bg-gray-800 rounded-full md:me-0 focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600"
              id="user-menu-button"
              :aria-expanded="isUserMenuOpen"
              data-dropdown-toggle="user-dropdown"
              data-dropdown-placement="bottom"
            >
              <span class="sr-only">Open user menu</span>
              <div class="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                {{ authStore.user?.email?.charAt(0).toUpperCase() }}
              </div>
            </button>
            <!-- Dropdown menu -->
            <div
              :class="{ 'hidden': !isUserMenuOpen }"
              class="z-50 absolute right-0 mt-2 w-48 text-base list-none bg-white divide-y divide-gray-100 rounded-lg shadow-lg dark:bg-gray-700 dark:divide-gray-600"
              id="user-dropdown"
            >
              <div class="px-4 py-3">
                <span class="block text-sm text-gray-900 dark:text-white">Signed in as</span>
                <span class="block text-sm text-gray-500 dark:text-gray-400">{{ authStore.user?.email }}</span>
              </div>
              <ul class="py-2" aria-labelledby="user-menu-button">
                <li>
                  <router-link
                    to="/profile"
                    @click="isUserMenuOpen = false"
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white"
                    :class="{
                      'bg-gray-100 dark:bg-gray-600': $route.path === '/profile',
                    }"
                  >
                    Profile
                  </router-link>
                </li>
                <li>
                  <button
                    @click="handleLogout"
                    class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white"
                  >
                    Sign out
                  </button>
                </li>
              </ul>
            </div>
          </div>
          
          <!-- Mobile menu toggle -->
          <button
            @click="toggleMobileMenu"
            data-collapse-toggle="navbar-user"
            type="button"
            class="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
            aria-controls="navbar-user"
            :aria-expanded="isMobileMenuOpen"
          >
            <span class="sr-only">Open main menu</span>
            <svg
              class="w-5 h-5"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 17 14"
            >
              <path
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M1 1h15M1 7h15M1 13h15"
              />
            </svg>
          </button>
        </div>
        
        <!-- Mobile Navigation menu -->
        <div
          :class="{ 'hidden': !isMobileMenuOpen }"
          class="items-center justify-between w-full md:hidden md:w-auto"
          id="navbar-user"
        >
          <ul
            class="flex flex-col font-medium p-4 mt-4 border border-gray-100 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
          >
            <li>
              <router-link
                to="/"
                class="block py-3 px-4 text-base font-semibold rounded-md transition-colors duration-200"
                :class="{
                  'text-white bg-primary-700': $route.path === '/',
                  'text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700': $route.path !== '/'
                }"
                :aria-current="$route.path === '/' ? 'page' : undefined"
                @click="isMobileMenuOpen = false"
              >
                Home
              </router-link>
            </li>

            <!-- Links visible only to authenticated users -->
            <template v-if="authStore.isAuthenticated">
              <li>
                <router-link
                  to="/notes"
                  class="block py-3 px-4 text-base font-semibold rounded-md transition-colors duration-200"
                  :class="{
                    'text-white bg-primary-700': $route.path.startsWith('/notes'),
                    'text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700': !$route.path.startsWith('/notes')
                  }"
                  :aria-current="$route.path.startsWith('/notes') ? 'page' : undefined"
                  @click="isMobileMenuOpen = false"
                >
                  My Notes
                </router-link>
              </li>
            </template>

            <!-- Links visible only to guests -->
            <template v-else>
              <li>
                <router-link
                  to="/login"
                  class="block py-3 px-4 text-base font-semibold rounded-md transition-colors duration-200"
                  :class="{
                    'text-white bg-primary-700': $route.path === '/login',
                    'text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700': $route.path !== '/login'
                  }"
                  :aria-current="$route.path === '/login' ? 'page' : undefined"
                  @click="isMobileMenuOpen = false"
                >
                  Login
                </router-link>
              </li>
              <li>
                <router-link
                  to="/register"
                  class="block py-3 px-4 text-base font-semibold rounded-md transition-colors duration-200"
                  :class="{
                    'text-white bg-primary-700': $route.path === '/register',
                    'text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700': $route.path !== '/register'
                  }"
                  :aria-current="$route.path === '/register' ? 'page' : undefined"
                  @click="isMobileMenuOpen = false"
                >
                  Register
                </router-link>
              </li>
            </template>
          </ul>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="flex-grow page-container">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="bg-white dark:bg-gray-900 mt-auto">
      <div class="mx-auto w-full max-w-screen-xl p-4 py-6 lg:py-8">
        <div class="md:flex md:justify-between">
          <div class="mb-6 md:mb-0">
            <a href="/" class="flex items-center">
              <img src="/src/assets/logo.jpeg" class="h-8 me-3" alt="VibeTravels Logo" />
              <span class="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">
                VibeTravels
              </span>
            </a>
            <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Transform simple notes into detailed travel plans with AI
            </p>
          </div>
          <div class="grid grid-cols-2 gap-8 sm:gap-6 sm:grid-cols-3">
            <div>
              <h2 class="mb-6 text-sm font-semibold text-gray-900 uppercase dark:text-white">
                Resources
              </h2>
              <ul class="text-gray-500 dark:text-gray-400 font-medium">
                <li class="mb-4">
                  <a href="#" class="hover:underline">Help Center</a>
                </li>
                <li>
                  <a href="#" class="hover:underline">Blog</a>
                </li>
              </ul>
            </div>
            <div>
              <h2 class="mb-6 text-sm font-semibold text-gray-900 uppercase dark:text-white">
                Follow us
              </h2>
              <ul class="text-gray-500 dark:text-gray-400 font-medium">
                <li class="mb-4">
                  <a href="#" class="hover:underline">Twitter</a>
                </li>
                <li>
                  <a href="#" class="hover:underline">Instagram</a>
                </li>
              </ul>
            </div>
            <div>
              <h2 class="mb-6 text-sm font-semibold text-gray-900 uppercase dark:text-white">
                Legal
              </h2>
              <ul class="text-gray-500 dark:text-gray-400 font-medium">
                <li class="mb-4">
                  <a href="#" class="hover:underline">Privacy Policy</a>
                </li>
                <li>
                  <a href="#" class="hover:underline">Terms &amp; Conditions</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <hr class="my-6 border-gray-200 sm:mx-auto dark:border-gray-700 lg:my-8" />
        <div class="sm:flex sm:items-center sm:justify-between">
          <span class="text-sm text-gray-500 sm:text-center dark:text-gray-400">
            © 2025 <a href="/" class="hover:underline">VibeTravels</a>. All Rights Reserved.
          </span>
          <div class="flex mt-4 sm:justify-center sm:mt-0">
            <a href="#" class="text-gray-500 hover:text-gray-900 dark:hover:text-white ms-5">
              <svg
                class="w-4 h-4"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 20 17"
              >
                <path
                  fill-rule="evenodd"
                  d="M20 1.892a8.178 8.178 0 0 1-2.355.635 4.074 4.074 0 0 0 1.8-2.235 8.344 8.344 0 0 1-2.605.98A4.13 4.13 0 0 0 13.85 0a4.068 4.068 0 0 0-4.1 4.038 4 4 0 0 0 .105.919A11.705 11.705 0 0 1 1.4.734a4.006 4.006 0 0 0 1.268 5.392 4.165 4.165 0 0 1-1.859-.5v.05A4.057 4.057 0 0 0 4.1 9.635a4.19 4.19 0 0 1-1.856.07 4.108 4.108 0 0 0 3.831 2.807A8.36 8.36 0 0 1 0 14.184 11.732 11.732 0 0 0 6.291 16 11.502 11.502 0 0 0 17.964 4.5c0-.177 0-.35-.012-.523A8.143 8.143 0 0 0 20 1.892Z"
                  clip-rule="evenodd"
                />
              </svg>
              <span class="sr-only">Twitter page</span>
            </a>
            <a href="#" class="text-gray-500 hover:text-gray-900 dark:hover:text-white ms-5">
              <svg
                class="w-4 h-4"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 .333A9.911 9.911 0 0 0 6.866 19.65c.5.092.678-.215.678-.477 0-.237-.01-1.017-.014-1.845-2.757.6-3.338-1.169-3.338-1.169a2.627 2.627 0 0 0-1.1-1.451c-.9-.615.07-.6.07-.6a2.084 2.084 0 0 1 1.518 1.021 2.11 2.11 0 0 0 2.884.823c.044-.503.268-.973.63-1.325-2.2-.25-4.516-1.1-4.516-4.9A3.832 3.832 0 0 1 4.7 7.068a3.56 3.56 0 0 1 .095-2.623s.832-.266 2.726 1.016a9.409 9.409 0 0 1 4.962 0c1.89-1.282 2.717-1.016 2.717-1.016.366.83.402 1.768.1 2.623a3.827 3.827 0 0 1 1.02 2.659c0 3.807-2.319 4.644-4.525 4.889a2.366 2.366 0 0 1 .673 1.834c0 1.326-.012 2.394-.012 2.72 0 .263.18.572.681.475A9.911 9.911 0 0 0 10 .333Z"
                  clip-rule="evenodd"
                />
              </svg>
              <span class="sr-only">GitHub account</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>
