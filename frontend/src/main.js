import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
// initializing API client on app stratup
import './utils/api-config.js'

createApp(App).mount('#app')
