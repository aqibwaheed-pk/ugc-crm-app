import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '../src/main.css'
import GoogleSignInPlugin from "vue3-google-signin"

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(GoogleSignInPlugin, {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
})

app.use(createPinia())
app.use(router)

app.mount('#app')
