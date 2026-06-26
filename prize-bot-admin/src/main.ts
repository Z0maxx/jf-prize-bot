import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './index.css'
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'
import PlayersView from './views/PlayersView.vue'
import PrizesView from './views/PrizesView.vue'

const app = createApp(App)

app.use(createPinia())

const routes = [
  { path: '/', component: HomeView },
  { path: '/players', component: PlayersView },
  { path: '/prizes', component: PrizesView }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

app.use(router)

app.mount('#app')
