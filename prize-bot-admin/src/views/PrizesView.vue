<script setup lang="ts">
import {
  prizeTradeOfferState,
  type Player,
  type Prize,
  type UniqueItem,
} from '@jf-prize-bot/schema'
import { storeToRefs } from 'pinia'
import { computed, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

import { useAppStore } from '@/stores/app.ts'
import { useInventoryStore } from '@/stores/inventory'
import { usePlayerStore } from '@/stores/player'
import { usePrizeStore } from '@/stores/prize'
import { useTradeOfferStore } from '@/stores/tradeOffer'
import { isActiveTradeOffer } from '@/utils'

import DisplayItem from '@/components/DisplayItem.vue'
import KeyStock from '@/components/KeyStock.vue'
import LoadingPage from '@/components/LoadingPage.vue'
import SubmitButton from '@/components/SubmitButton.vue'

const appStore = useAppStore()
const { hasChanges, isLoading, isSaving, isReloading } = storeToRefs(appStore)

const inventoryStore = useInventoryStore()
const { inventory } = storeToRefs(inventoryStore)

const playerStore = usePlayerStore()
const { players } = storeToRefs(playerStore)

const prizeStore = usePrizeStore()
const { getPrizeForPlayer, setKeysForPrize, addItemToPrize, removeItemFromPrize } = prizeStore
const { prizes } = storeToRefs(prizeStore)

const tradeOfferStore = useTradeOfferStore()
const { tradeOffers } = storeToRefs(tradeOfferStore)

const keys = ref(0)
const selectedDiscordId = ref('')

const sortedItems = reactive<{ assignedItems: UniqueItem[]; unassignedItems: UniqueItem[] }>({
  assignedItems: [],
  unassignedItems: [],
})

const playersWithTradeUrls = computed(() => players.value.filter((player) => !!player.tradeUrl))
const isPageLoading = computed(
  () =>
    !isLoading ||
    isLoading.value.has(playerStore.at) ||
    isLoading.value.has(prizeStore.at) ||
    isReloading.value,
)

let selectedPrize: Prize | null
let selectedPlayer: Player | null

function tryAddItemToPrize(item: UniqueItem) {
  if (!selectedPlayer || !selectedPrize) return

  addItemToPrize(selectedPrize, item)
  sortedItems.assignedItems.splice(0, 0, item)
  const idx = sortedItems.unassignedItems.findIndex((i) => i.assetId === item.assetId)
  sortedItems.unassignedItems.splice(idx, 1)
}

function tryRemoveItemFromPrize(item: UniqueItem) {
  if (!selectedPlayer || !selectedPrize || isSaving.value.has(prizeStore.at)) return

  removeItemFromPrize(selectedPrize, item)
  const idx = sortedItems.assignedItems.findIndex((i) => i.assetId === item.assetId)
  sortedItems.assignedItems.splice(idx, 1)
  sortedItems.unassignedItems.splice(0, 0, item)
}

watch(
  [() => inventory.value.items, prizes, tradeOffers, selectedDiscordId],
  ([newItems, newPrizes, newTradeOffers, newDiscordId]) => {
    selectedPlayer = players.value.find((player) => player.discordId === newDiscordId)!
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
    const itemsInLimboAssetIds = new Set(
      newTradeOffers
        .filter((offer) => !!offer.items && isActiveTradeOffer(offer))
        .flatMap((offer) => offer.items!.map((item) => item.assetId)),
    )

    newItems.forEach((item) => {
      const assignedItem = newPrizes.find((prize) => prize.assetIds.includes(item.assetId))
      if (assignedItem) {
        if (assignedItem.discordId === newDiscordId) {
          sortedItems.assignedItems.push(item)
        }
      } else if (!itemsInLimboAssetIds.has(item.assetId)) {
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
  <LoadingPage v-if="isPageLoading" :name="prizeStore.at" />
  <div class="flex flex-col items-center" v-else>
    <h1 v-if="playersWithTradeUrls.length === 0">There are no players with Trade Urls</h1>
    <div
      v-else
      class="sticky top-0 z-50 flex w-full flex-col items-center border-b-2 border-blue-500 bg-blue-300 py-4"
    >
      <div class="flex w-180 gap-4">
        <SubmitButton
          @click="prizeStore.saveAsync"
          :disabled="!hasChanges.has(prizeStore.at)"
          :is-submitting="isSaving.has(prizeStore.at)"
          class="w-full button-green"
          >Save Prizes</SubmitButton
        >
      </div>
      <select v-model="selectedDiscordId" class="mt-4">
        <option value="" disabled hidden>Select a Player</option>
        <option v-for="player in playersWithTradeUrls" :value="player.discordId">
          {{ player.discordFullName }}
        </option>
      </select>
    </div>
    <template v-if="selectedPlayer">
      <h2>Keys</h2>
      <KeyStock />
      <div class="mt-2">
        <label for="keys" class="mr-2"
          >Keys assigned to {{ selectedPlayer.discordFullName }}:</label
        >
        <input v-model="keys" type="number" id="keys" class="w-15" />
      </div>
      <template v-if="sortedItems.assignedItems.length > 0">
        <h3>Items assigned to {{ selectedPlayer.discordFullName }}</h3>
        <div
          v-for="item in sortedItems.assignedItems"
          :key="item.assetId"
          @click="tryRemoveItemFromPrize(item)"
          class="relative flex w-180 cursor-pointer items-center hover:bg-rose-200"
        >
          <DisplayItem :item="item" />
          <div class="absolute top-1 right-0 text-xs text-gray-500">
            Asset id: {{ item.assetId }}
          </div>
        </div>
      </template>
      <h3>Unassigned Items</h3>
      <div
        v-for="item in sortedItems.unassignedItems"
        :key="item.assetId"
        @click="tryAddItemToPrize(item)"
        class="relative flex w-180 cursor-pointer items-center hover:bg-emerald-200"
      >
        <DisplayItem :item="item" />
        <div class="absolute top-1 right-0 text-xs text-gray-500">Asset id: {{ item.assetId }}</div>
      </div>
    </template>
  </div>
</template>
