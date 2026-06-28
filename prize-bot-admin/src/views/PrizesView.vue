<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

import { useAppStore } from '@/stores/app.ts'
import { useInventoryStore } from '@/stores/inventory'
import { usePlayerStore } from '@/stores/player'
import { usePrizeStore } from '@/stores/prize'

import type { Player, Prize, UniqueItem } from '@jf-prize-bot/schema'

import DisplayItem from '@/components/DisplayItem.vue'
import KeyStock from '@/components/KeyStock.vue'
import SubmitButton from '@/components/SubmitButton.vue'
import TradeOfferDetails from '@/components/TradeOfferDetails.vue'

const appStore = useAppStore()
const { hasChanges, isLoading, isSaving } = storeToRefs(appStore)

const inventoryStore = useInventoryStore()
const { inventory } = storeToRefs(inventoryStore)

const prizeStore = usePrizeStore()
const { getPrizeForPlayer, setKeysForPrize, addItemToPrize, removeItemFromPrize } = prizeStore
const { prizes } = storeToRefs(prizeStore)

const playerStore = usePlayerStore()
const { players } = storeToRefs(playerStore)

let selectedPrize: Prize | null
let selectedPlayer: Player | null

const keys = ref(0)
const selectedPlayerName = ref('')

const sortedItems = reactive<{ assignedItems: UniqueItem[]; unassignedItems: UniqueItem[] }>({
  assignedItems: [],
  unassignedItems: [],
})

const isPageReady = computed(
  () => isLoading && !isLoading.value.has(playerStore.at) && !isLoading.value.has(prizeStore.at),
)

function tryAddItemToPrize(item: UniqueItem) {
  if (!selectedPlayer || !selectedPrize) return

  addItemToPrize(selectedPrize, item)
  sortedItems.assignedItems.splice(0, 0, item)
  const idx = sortedItems.unassignedItems.findIndex((i) => i.assetId === item.assetId)
  sortedItems.unassignedItems.splice(idx, 1)
}

function tryRemoveItemFromPrize(item: UniqueItem) {
  if (!selectedPlayer || !selectedPrize) return

  removeItemFromPrize(selectedPrize, item)
  const idx = sortedItems.assignedItems.findIndex((i) => i.assetId === item.assetId)
  sortedItems.assignedItems.splice(idx, 1)
  sortedItems.unassignedItems.splice(0, 0, item)
}

function tryClearPrizes() {
  if (confirm('Are you sure you want to clear all prizes?')) {
    prizeStore.clearAsync()
  }
}

watch(
  [() => inventory.value.items, prizes, selectedPlayerName],
  ([newItems, newPrizes, newPlayerName]) => {
    selectedPlayer = players.value.find((player) => player.name === newPlayerName)!
    if (!selectedPlayer) {
      selectedPrize = null
      sortedItems.assignedItems = []
      sortedItems.unassignedItems = []
      return
    }

    selectedPrize = getPrizeForPlayer(selectedPlayer)
    keys.value = selectedPrize.keys
    sortedItems.assignedItems = []
    sortedItems.unassignedItems = []
    newItems.forEach((item) => {
      const assignedItem = newPrizes.find((prize) => prize.assetIds.includes(item.assetId))
      if (assignedItem) {
        if (assignedItem.player.name === newPlayerName) {
          sortedItems.assignedItems.push(item)
        }
      } else {
        sortedItems.unassignedItems.push(item)
      }
    })
  },
  { deep: true },
)

watch(keys, newKeys => {
  if (!selectedPrize) {
    return
  }

  if (newKeys.toString() !== '' && newKeys < 0) {
    keys.value = 0
  }

  if (selectedPrize.keys !== newKeys) {
    setKeysForPrize(selectedPrize, newKeys.toString() === '' ? 0 : newKeys)
  }
})

onBeforeRouteLeave(() => {
  if (hasChanges.value.has(prizeStore.at)) {
    prizeStore.saveAsync()
  }
})
</script>
<template>
  <div class="flex flex-col items-center" v-if="isPageReady">
    <h1 v-if="players.length === 0">There are no players</h1>
    <div
      v-else
      class="sticky top-0 z-50 flex w-full flex-col items-center border-b-2 border-blue-500 bg-blue-300 py-4"
    >
      <div class="flex w-180 gap-4">
        <SubmitButton
          @click="prizeStore.saveAsync"
          :disabled="!hasChanges.has(prizeStore.at)"
          :is-submitting="isSaving.has(prizeStore.at)"
          class="w-full"
          >Save Prizes</SubmitButton
        >
        <button
          @click="tryClearPrizes"
          :disabled="!prizes.length"
          class="w-full rounded-md border-2 border-rose-600 bg-rose-200 px-2 py-1 text-lg font-medium transition-colors hover:bg-rose-300 disabled:cursor-not-allowed disabled:border-slate-600 disabled:bg-slate-200 disabled:text-gray-600"
        >
          Clear Prizes
        </button>
      </div>
      <select
        v-model="selectedPlayerName"
        class="mt-4"
      >
        <option value="" disabled hidden>Select a Player</option>
        <option v-for="player in players" :value="player.name">{{ player.name }}</option>
      </select>
    </div>
    <template v-if="selectedPlayerName">
      <TradeOfferDetails v-if="selectedPrize" :trade-offer="selectedPrize.tradeOffer"></TradeOfferDetails>
      <h2>Keys</h2>
      <KeyStock />
      <div class="mt-2">
        <label for="keys" class="mr-2">Keys assigned to {{ selectedPlayerName }}:</label>
        <input
          v-model="keys"
          type="number"
          id="keys"
          class="w-15"
        />
      </div>
      <template v-if="sortedItems.assignedItems.length > 0">
        <h3>Items assigned to {{ selectedPlayerName }}</h3>
        <div
          v-for="item in sortedItems.assignedItems"
          :key="item.assetId"
          @click="tryRemoveItemFromPrize(item)"
          class="flex w-180 cursor-pointer items-center justify-between hover:bg-rose-200 relative"
        >
          <DisplayItem :item="item" />
          <div class="text-xs absolute right-0 top-1 text-gray-500">Asset id: {{ item.assetId }}</div>
        </div>
      </template>
      <h3>Unassigned Items</h3>
      <div
        v-for="item in sortedItems.unassignedItems"
        :key="item.assetId"
        @click="tryAddItemToPrize(item)"
        class="flex w-180 cursor-pointer items-center justify-between hover:bg-emerald-200 relative"
      >
        <DisplayItem :item="item" />
        <div class="text-xs absolute right-0 top-1 text-gray-500">Asset id: {{ item.assetId }}</div>
      </div>
    </template>
  </div>
</template>
