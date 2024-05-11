import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import router from "@/router/router.js"

import "@/assets/style.css"
import "@/assets/fonts.css"

const pinia = createPinia()

const app = createApp(App)

app.use(router)
app.use(pinia)


app.mount('#app')
