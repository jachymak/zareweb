import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { initDevToday } from './devToday'

if (import.meta.env.DEV) initDevToday()

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
