<script setup lang="ts">
import { computed, onMounted } from 'vue';
import NavbarButton from './components/NavbarButton.vue';
import { api } from './api.ts';
import { useInventoryStore } from './stores/inventory.ts';
import { usePlayerStore } from './stores/player.ts';
import { usePrizeStore } from './stores/prize.ts';
import { useAppStore } from './stores/app.ts';
import { storeToRefs } from 'pinia';

const appStore = useAppStore()
const { hasChanges, isSaving, isLoading } = storeToRefs(appStore)

const inventoryStore = useInventoryStore()
const { setInventory } = inventoryStore

const playerStore = usePlayerStore()
const prizeStore = usePrizeStore()

const unsavedChangesAt = computed(() => {
  return 'Unsaved changes in data for ' + Array.from(hasChanges.value.values()).join(', ')
})

async function reloadBotInventory() {
  try {
    setInventory(await api.reloadBotInventory())
  }
  catch (e) {
    alert((e as Error).message)
  }
}

onMounted(async () => {
  inventoryStore.loadAsync()
  playerStore.loadAsync()
  prizeStore.loadAsync()
})

window.addEventListener('beforeunload', (e) => {
  if (hasChanges.value.size > 0) {
    e.preventDefault()
    e.returnValue = true
  }
})
</script>
<template>
  <header class="w-full bg-teal-800 flex justify-between relative">
    <nav class="divide-x divide-teal-400 flex">
      <NavbarButton to="/">Home</NavbarButton>
      <NavbarButton to="/players" :savingAt="playerStore.at">Players</NavbarButton>
      <NavbarButton to="/prizes" :savingAt="prizeStore.at">Prizes</NavbarButton>
    </nav>
    <button @click="reloadBotInventory" class="text-xl font-medium min-w-65 bg-blue-900 text-white cursor-pointer flex justify-center gap-2 items-center text-white hover:text-blue-200 fill-white hover:fill-blue-200">
      <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="0 0 342.5 342.5" xml:space="preserve" class="size-6 ">
        <path d="M254.37,22.255c-1.161-0.642-2.53-0.795-3.803-0.428c-1.274,0.367-2.35,1.226-2.992,2.387l-21.758,39.391  c-1.335,2.417-0.458,5.459,1.96,6.794C264.616,90.748,287.5,129.495,287.5,171.52c0,63.649-51.782,115.431-115.431,115.431  S56.638,235.169,56.638,171.52c0-23.888,7.557-47.427,21.382-66.897l34.478,34.478c1.338,1.337,3.315,1.806,5.109,1.21  c1.795-0.596,3.101-2.152,3.374-4.024L139.963,6.271c0.228-1.563-0.295-3.141-1.412-4.258c-1.117-1.117-2.7-1.639-4.258-1.412  L4.278,19.584c-1.872,0.273-3.428,1.579-4.023,3.374c-0.596,1.795-0.127,3.772,1.21,5.109l37.292,37.292  C14.788,95.484,1.638,133,1.638,171.52c0,93.976,76.455,170.431,170.431,170.431c93.976,0,170.431-76.455,170.431-170.431  C342.5,109.478,308.731,52.283,254.37,22.255z" />
      </svg>
      <span>Reload Bot Inventory</span>
    </button>
    <div v-if="hasChanges.size > 0" class="absolute top-2.5 pointer-events-none w-full text-center"><span class="text-amber-600 bg-amber-100 font-medium py-1 px-2 rounded-md">{{ unsavedChangesAt }}</span></div>
  </header>
  <main>
    <RouterView />
  </main>
</template>
