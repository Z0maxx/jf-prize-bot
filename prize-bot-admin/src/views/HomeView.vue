<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed } from 'vue'

import { useAppStore } from '@/stores/app'
import { useBountyGroupStore } from '@/stores/bountyGroup'
import { useInventoryStore } from '@/stores/inventory'
import { usePlayerStore } from '@/stores/player'
import { usePrizeStore } from '@/stores/prize'
import { getRankColorHex } from '@/utils'

import type { DiscordRank, Prize } from '@jf-prize-bot/schema'

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

const bountyGroupStore = useBountyGroupStore()
const { bountyGroups } = storeToRefs(bountyGroupStore)

const isPageLoading = computed(
  () => !isLoading || isLoading.value.has(prizeStore.at) || isLoading.value.has(playerStore.at),
)

const prizesWithItems = computed(() =>
  prizes.value
    .filter((prize) => prize.keys > 0 || prize.assetIds.length > 0)
    .map((prize) => {
      const items = inventory.value.items.filter((item) => prize.assetIds.includes(item.assetId))
      return {
        discordId: prize.discordId,
        discordFullName: getPlayerName(prize),
        completedBountyGroups: getCompletedBountyGroups(prize),
        keys: prize.keys,
        items,
      }
    }),
)

function getPlayerName(prize: Prize) {
  return players.value.find((player) => player.discordId === prize.discordId)!.discordFullName
}

function getCompletedBountyGroups(prize: Prize) {
  const completedBountyGroups = new Map<
    string,
    { discordRank: DiscordRank; completedBounties: string[] }
  >()

  prize.completedBountyIds.forEach((bountyId) => {
    const { discordRank, bounties } = bountyGroups.value.find((group) =>
      group.bounties.some((p) => p.id === bountyId),
    )!
    let completedBountyGroup = completedBountyGroups.get(discordRank.name)
    const { name, keys } = bounties.find((p) => p.id === bountyId)!
    if (!completedBountyGroup) {
      completedBountyGroup = {
        discordRank,
        completedBounties: [],
      }

      completedBountyGroups.set(discordRank.name, completedBountyGroup)
    }

    completedBountyGroup.completedBounties.push(`${name} (${keys} ${keys > 1 ? 'keys' : 'key'})`)
  })

  return Array.from(completedBountyGroups.values())
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
          <template v-if="prize.completedBountyGroups.length > 0">
            <h3>Completed Bounties</h3>
            <div class="flex gap-8 rounded-md bg-slate-700 px-2 py-1">
              <div
                v-for="group in prize.completedBountyGroups"
                :style="'color:' + getRankColorHex(group.discordRank)"
              >
                <div class="font-bold">{{ group.discordRank.name }}</div>
                <div class="flex flex-col">
                  <span
                    v-for="bounty in group.completedBounties"
                    class="flex justify-between after:content-['✔'] hover:bg-slate-600"
                  >
                    {{ bounty }}
                  </span>
                </div>
              </div>
            </div>
          </template>
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
