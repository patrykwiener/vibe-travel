<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { initFlowbite } from 'flowbite'
import BaseLayout from './layouts/BaseLayout.vue'

const route = useRoute()

onMounted(() => {
  initFlowbite()
})

const isAuthPage = computed(() => {
  return route.path === '/login' || route.path === '/register'
})
</script>

<template>
  <!-- Use BaseLayout for all pages except auth pages -->
  <BaseLayout v-if="!isAuthPage">
    <router-view />
  </BaseLayout>
  <router-view v-else />
</template>

<style>
/* Global styles go here */
</style>
