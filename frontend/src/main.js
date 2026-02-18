import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '../src/main.css'
import GoogleSignInPlugin from "vue3-google-signin"

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(GoogleSignInPlugin, {
  clientId: '556524231818-vnsaf1n3pq0c3m6b61eog5jot8m64k16.apps.googleusercontent.com', // <-- Yahan ID dalein
})

app.use(createPinia())
app.use(router)

app.mount('#app')
