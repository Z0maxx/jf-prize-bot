<script setup lang="ts">
import DisplayItem from '@/components/DisplayItem.vue'
import KeyStock from '@/components/KeyStock.vue'
import Title from '@/components/Title.vue'
import { useAppStore } from '@/stores/app'
import { useInventoryStore } from '@/stores/inventory'
import { usePrizeStore } from '@/stores/prize'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'

const appStore = useAppStore()
const { hasChanges, isLoading } = storeToRefs(appStore)

const inventoryStore = useInventoryStore()
const { inventory } = storeToRefs(inventoryStore)

const prizeStore = usePrizeStore()
const { prizes } = storeToRefs(prizeStore)

const isPageReady = computed(() =>
  isLoading &&
  !isLoading.value.has(prizeStore.at))

const prizesWithItems = computed(() => prizes
  .value
  .filter(prize => prize.keys > 0 || prize.assetIds.length > 0)
  .map(prize => {
    const items = inventory.value.items.filter(item => prize.assetIds.includes(item.assetId))
    return {
      player: prize.player,
      keys: prize.keys,
      items
    }
  }))

</script>
<template>
  <Title :text-size="'2xl'">Overview of Prizes</Title>
  <div class="flex flex-col items-center" v-if="isPageReady">
    <KeyStock />
    <div v-for="prize in prizesWithItems" :key="prize.player.name">
      <Title :text-size="'xl'">Prizes for {{ prize.player.name }}</Title>
      <div class="text-center">Keys assigned to {{ prize.player.name }}: {{ prize.keys }}</div>
      <template v-if="prize.items.length > 0">
        <Title>Items assigned to {{ prize.player.name }}</Title>
        <DisplayItem v-for="item in prize.items" :key="item.assetId" :item="item" class="w-180" />
      </template>
    </div>
  </div>
</template>
