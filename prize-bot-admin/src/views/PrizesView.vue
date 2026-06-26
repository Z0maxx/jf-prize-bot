<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

import { useAppStore } from '@/stores/app.ts'
import { useInventoryStore } from '@/stores/inventory'
import { usePlayerStore } from '@/stores/player'
import { usePrizeStore } from '@/stores/prize'

import type { Item, Player, Prize } from '@/types.ts'

import DisplayItem from '@/components/DisplayItem.vue'
import KeyStock from '@/components/KeyStock.vue'
import SaveButton from '@/components/SaveButton.vue'
import Title from '@/components/Title.vue'

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

const sortedItems = reactive<{ assignedItems: Item[]; unassignedItems: Item[] }>({
  assignedItems: [],
  unassignedItems: [],
})

const isPageReady = computed(
  () => isLoading && !isLoading.value.has(playerStore.at) && !isLoading.value.has(prizeStore.at),
)

function tryAddItemToPrize(item: Item) {
  if (!selectedPlayer || !selectedPrize) return

  addItemToPrize(selectedPrize, item)
  sortedItems.assignedItems.splice(0, 0, item)
  const idx = sortedItems.unassignedItems.findIndex((i) => i.assetId === item.assetId)
  sortedItems.unassignedItems.splice(idx, 1)
}

function tryRemoveItemFromPrize(item: Item) {
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

watch(keys, (newKeys) => {
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
    <Title v-if="players.length === 0">There are no players</Title>
    <div
      v-else
      class="sticky top-0 z-50 flex w-full flex-col items-center border-b-2 border-blue-500 bg-blue-300 py-4"
    >
      <div class="flex w-180 gap-4">
        <SaveButton
          @click="prizeStore.saveAsync"
          :disabled="!hasChanges.has(prizeStore.at)"
          :is-saving="isSaving.has(prizeStore.at)"
          class="w-full"
          >Save Prizes</SaveButton
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
        class="mt-4 rounded-md border-2 border-sky-400 bg-sky-200 py-0.5 focus:outline-sky-700"
      >
        <option value="" disabled hidden>Select a Player</option>
        <option v-for="player in players" :value="player.name">{{ player.name }}</option>
      </select>
    </div>
    <template v-if="selectedPlayerName">
      <Title>Keys</Title>
      <KeyStock />
      <div class="mt-2">
        <label for="keys" class="mr-2">Keys assigned to {{ selectedPlayerName }}:</label>
        <input
          v-model="keys"
          type="number"
          id="keys"
          class="w-15 rounded-md border-2 border-sky-400 bg-sky-200 py-0.5 pl-1 focus:outline-sky-700"
        />
      </div>
      <template v-if="sortedItems.assignedItems.length > 0">
        <Title>Items assigned to {{ selectedPlayerName }}</Title>
        <div
          v-for="item in sortedItems.assignedItems"
          :key="item.assetId"
          @click="tryRemoveItemFromPrize(item)"
          class="flex w-180 cursor-pointer items-center justify-between hover:bg-rose-200"
        >
          <DisplayItem :item="item" />
        </div>
      </template>
      <Title>Unassigned Items</Title>
      <div
        v-for="item in sortedItems.unassignedItems"
        :key="item.assetId"
        @click="tryAddItemToPrize(item)"
        class="flex w-180 cursor-pointer items-center justify-between hover:bg-emerald-200"
      >
        <DisplayItem :item="item" />
      </div>
    </template>
  </div>
</template>
