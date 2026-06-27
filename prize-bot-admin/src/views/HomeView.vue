<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed } from 'vue'

import { useAppStore } from '@/stores/app'
import { useInventoryStore } from '@/stores/inventory'
import { usePrizeStore } from '@/stores/prize'

import DisplayItem from '@/components/DisplayItem.vue'
import KeyStock from '@/components/KeyStock.vue'

const appStore = useAppStore()
const { hasChanges, isLoading } = storeToRefs(appStore)

const inventoryStore = useInventoryStore()
const { inventory } = storeToRefs(inventoryStore)

const prizeStore = usePrizeStore()
const { prizes } = storeToRefs(prizeStore)

const isPageReady = computed(() => isLoading && !isLoading.value.has(prizeStore.at))

const prizesWithItems = computed(() =>
  prizes.value
    .filter((prize) => prize.keys > 0 || prize.assetIds.length > 0)
    .map((prize) => {
      const items = inventory.value.items.filter((item) => prize.assetIds.includes(item.assetId))
      return {
        player: prize.player,
        keys: prize.keys,
        items,
      }
    }),
)
</script>
<template>
  <h1>Overview of Prizes</h1>
  <div class="flex flex-col items-center" v-if="isPageReady">
    <KeyStock />
    <div v-for="prize in prizesWithItems" :key="prize.player.name">
      <h2>Prizes for {{ prize.player.name }}</h2>
      <div class="text-center">Keys assigned to {{ prize.player.name }}: {{ prize.keys }}</div>
      <template v-if="prize.items.length > 0">
        <h3>Items assigned to {{ prize.player.name }}</h3>
        <DisplayItem v-for="item in prize.items" :key="item.assetId" :item="item" class="w-180" />
      </template>
    </div>
  </div>
</template>
