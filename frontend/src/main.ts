import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
// initializing API client on app startup
import './utils/api-config.ts'

createApp(App).mount('#app')
