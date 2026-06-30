<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed } from 'vue'

import { useAppStore } from '@/stores/app'
import { useInventoryStore } from '@/stores/inventory'
import { usePlayerStore } from '@/stores/player'
import { usePrizeStore } from '@/stores/prize'

import type { Prize } from '@jf-prize-bot/schema'

import DisplayItem from '@/components/DisplayItem.vue'
import KeyStock from '@/components/KeyStock.vue'
import LoadingPage from '@/components/LoadingPage.vue'

const appStore = useAppStore()
const { isLoading } = storeToRefs(appStore)

const inventoryStore = useInventoryStore()
const { inventory } = storeToRefs(inventoryStore)

const playerStore = usePlayerStore()
const { players } = storeToRefs(playerStore)

const prizeStore = usePrizeStore()
const { prizes } = storeToRefs(prizeStore)

const isPageLoading = computed(() => !isLoading || isLoading.value.has(prizeStore.at))

const prizesWithItems = computed(() =>
  prizes.value
    .filter((prize) => prize.keys > 0 || prize.assetIds.length > 0)
    .map((prize) => {
      const items = inventory.value.items.filter((item) => prize.assetIds.includes(item.assetId))
      return {
        discordId: prize.discordId,
        discordFullName: getPlayerName(prize),
        keys: prize.keys,
        items,
      }
    }),
)

function getPlayerName(prize: Prize) {
  return players.value.find((player) => player.discordId === prize.discordId)!.discordFullName
}
</script>
<template>
  <LoadingPage v-if="isPageLoading" :name="'Overview of Prizes'" />
  <template v-else>
    <h1 v-if="prizesWithItems.length === 0">There are no Prizes</h1>
    <template v-else>
      <h1>Overview of Prizes</h1>
      <div class="flex flex-col items-center">
        <KeyStock />
        <div v-for="prize in prizesWithItems" :key="prize.discordId">
          <h2>Prizes for {{ prize.discordFullName }}</h2>
          <div class="text-center">
            Keys assigned to {{ prize.discordFullName }}: {{ prize.keys }}
          </div>
          <template v-if="prize.items.length > 0">
            <h3>Items assigned to {{ prize.discordFullName }}</h3>
            <div v-for="item in prize.items" :key="item.assetId" class="relative w-180">
              <DisplayItem :item="item" class="w-180" />
              <div class="absolute top-1 right-0 text-xs text-gray-500">
                Asset id: {{ item.assetId }}
              </div>
            </div>
          </template>
        </div>
      </div>
    </template>
  </template>
</template>
