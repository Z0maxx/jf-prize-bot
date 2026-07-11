import { createPinia } from 'pinia'
import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'

import './index.css'
import { api } from './api.ts'

import App from './App.vue'
import BountyGroupsView from './views/BountyGroupsView.vue'
import HomeView from './views/HomeView.vue'
import PlayersView from './views/PlayersView.vue'
import PrizesView from './views/PrizesView.vue'
import TradeOffersView from './views/TradeOffersView.vue'

api.useUrl('http://localhost:6520')

const app = createApp(App)

app.use(createPinia())

const routes = [
  { path: '/', component: HomeView },
  { path: '/players', component: PlayersView },
  { path: '/prizes', component: PrizesView },
  { path: '/trade-offers', component: TradeOffersView },
  { path: '/bounty-groups', component: BountyGroupsView },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

app.use(router)

app.mount('#app')
