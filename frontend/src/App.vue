<script setup lang="ts">
import BaseLayout from './components/BaseLayout.vue'
import { onMounted } from 'vue'
import { initFlowbite } from 'flowbite'

// initialize components based on data attribute selectors
onMounted(() => {
  initFlowbite()
})
</script>

<template>
  <BaseLayout>
    <router-view />
  </BaseLayout>
</template>

<style>
/* Global styles go here */
</style>
