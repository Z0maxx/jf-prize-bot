<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, onMounted } from 'vue'

import { useAppStore } from './stores/app.ts'
import { useBountyPrizeGroupStore } from './stores/bountyPrizeGroup.ts'
import { useInventoryStore } from './stores/inventory.ts'
import { usePlayerStore } from './stores/player.ts'
import { usePrizeStore } from './stores/prize.ts'
import { useTradeOfferStore } from './stores/tradeOffer.ts'

import LoginPopup from './components/LoginPopup.vue'
import NavbarButton from './components/NavbarButton.vue'
import ReloadButton from './components/ReloadButton.vue'
import SendPrizesButton from './components/SendPrizesButton.vue'

const appStore = useAppStore()
const { hasChanges } = storeToRefs(appStore)

const playerStore = usePlayerStore()
const prizeStore = usePrizeStore()
const inventoryStore = useInventoryStore()
const tradeOfferStore = useTradeOfferStore()
const bountyPrizeGroupStore = useBountyPrizeGroupStore()

const unsavedChangesAt = computed(() => {
  return 'Unsaved changes in data for ' + Array.from(hasChanges.value.values()).join(', ')
})

onMounted(async () => {
  inventoryStore.loadAsync()
  playerStore.loadAsync()
  prizeStore.loadAsync()
  tradeOfferStore.loadAsync()
  bountyPrizeGroupStore.loadAsync()
  appStore.setIsLoggedInAsync()
})

window.addEventListener('beforeunload', (e) => {
  if (hasChanges.value.size > 0) {
    e.preventDefault()
    e.returnValue = true
  }
})
</script>
<template>
  <header class="relative flex w-full justify-between bg-teal-800">
    <nav class="flex divide-x divide-teal-400">
      <NavbarButton to="/">Home</NavbarButton>
      <NavbarButton to="/players" :saving-at="playerStore.at">Players</NavbarButton>
      <NavbarButton to="/prizes" :saving-at="prizeStore.at">Prizes</NavbarButton>
      <NavbarButton to="/bounty-prize-groups" :saving-at="bountyPrizeGroupStore.at"
        >Bounty Prize Groups</NavbarButton
      >
      <NavbarButton to="/trade-offers">Trade Offers</NavbarButton>
    </nav>
    <div class="flex gap-2 px-2">
      <SendPrizesButton />
      <ReloadButton />
    </div>
    <div v-if="hasChanges.size > 0" class="pointer-events-none absolute top-2.5 w-full text-center">
      <span class="rounded-md bg-amber-100 px-2 py-1 font-medium text-amber-600">{{
        unsavedChangesAt
      }}</span>
    </div>
  </header>
  <main class="mb-6">
    <RouterView />
  </main>
  <LoginPopup />
</template>
