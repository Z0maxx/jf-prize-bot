<script setup lang="ts">
import { type Bounty, type Player, type Prize, type UniqueItem } from '@jf-prize-bot/schema'
import { storeToRefs } from 'pinia'
import { computed, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

import { useAppStore } from '@/stores/app.ts'
import { useBountyGroupStore } from '@/stores/bountyGroup'
import { useInventoryStore } from '@/stores/inventory'
import { usePlayerStore } from '@/stores/player'
import { usePrizeStore } from '@/stores/prize'
import { useTradeOfferStore } from '@/stores/tradeOffer'
import { getRankColorHex } from '@/utils'

import DisplayItem from '@/components/DisplayItem.vue'
import DropdownSearch from '@/components/DropdownSearch.vue'
import KeyStock from '@/components/KeyStock.vue'
import LoadingPage from '@/components/LoadingPage.vue'
import SubmitButton from '@/components/SubmitButton.vue'

const appStore = useAppStore()
const { hasChanges, isLoading, isSaving, isReloading, isSendingPrizes } = storeToRefs(appStore)

const inventoryStore = useInventoryStore()
const { inventory } = storeToRefs(inventoryStore)

const playerStore = usePlayerStore()
const { players } = storeToRefs(playerStore)

const prizeStore = usePrizeStore()
const { getPrizeForPlayer, setKeysForPrize, addItemToPrize, removeItemFromPrize } = prizeStore
const { prizes } = storeToRefs(prizeStore)

const bountyGroupStore = useBountyGroupStore()
const { bountyGroups } = storeToRefs(bountyGroupStore)

const tradeOfferStore = useTradeOfferStore()
const { activeTradeOffers } = storeToRefs(tradeOfferStore)

const keys = ref(0)
const selectedDiscordId = ref('')
const selectedPrize = ref<Prize | undefined>()
const selectedPlayer = ref<Player | undefined>()

const sortedItems = reactive<{ assignedItems: UniqueItem[]; unassignedItems: UniqueItem[] }>({
  assignedItems: [],
  unassignedItems: [],
})

const playersWithTradeUrls = computed(() => players.value.filter((player) => !!player.tradeUrl))
const selectablePlayers = computed(() =>
  playersWithTradeUrls.value.reduce(
    (players, player) => ({ ...players, [player.discordId]: player.discordFullName }),
    {} as Record<string, string>,
  ),
)

const isPageLoading = computed(
  () =>
    !isLoading ||
    isLoading.value.has(playerStore.at) ||
    isLoading.value.has(prizeStore.at) ||
    isReloading.value,
)

const isSaveButtonDisabled = computed(
  () =>
    !hasChanges.value.has(prizeStore.at) ||
    isSaving.value.has(prizeStore.at) ||
    isSendingPrizes.value,
)

function selectPlayer(discordId: string) {
  const player = players.value.find((player) => player.discordId === discordId)!
  selectedDiscordId.value = player.discordId
}

function tryAddItemToPrize(item: UniqueItem) {
  if (!selectedPlayer.value || !selectedPrize.value) return

  addItemToPrize(selectedPrize.value, item)
  sortedItems.assignedItems.splice(0, 0, item)
  const idx = sortedItems.unassignedItems.findIndex((i) => i.assetId === item.assetId)
  sortedItems.unassignedItems.splice(idx, 1)
}

function tryRemoveItemFromPrize(item: UniqueItem) {
  if (!selectedPlayer.value || !selectedPrize.value || isSaving.value.has(prizeStore.at)) return

  removeItemFromPrize(selectedPrize.value, item)
  const idx = sortedItems.assignedItems.findIndex((i) => i.assetId === item.assetId)
  sortedItems.assignedItems.splice(idx, 1)
  sortedItems.unassignedItems.splice(0, 0, item)
}

function getBountyGroup() {
  if (!selectedPlayer.value) return []

  return selectedPlayer.value.discordRanks.map(
    (rank) => bountyGroups.value.find((prize) => prize.discordRank.name === rank.name)!,
  )
}

function hasCompletedBounty(bounty: Bounty) {
  if (!selectedPrize.value) return false

  return selectedPrize.value.completedBountyIds.includes(bounty.id)
}

watch(
  [() => inventory.value.items, prizes, activeTradeOffers, selectedDiscordId],
  ([newItems, newPrizes, newActiveTradeOffers, newDiscordId]) => {
    selectedPlayer.value = players.value.find((player) => player.discordId === newDiscordId)
    if (!selectedPlayer.value) {
      selectedPrize.value = undefined
      sortedItems.assignedItems = []
      sortedItems.unassignedItems = []
      return
    }

    selectedPrize.value = getPrizeForPlayer(selectedPlayer.value)
    keys.value = selectedPrize.value.keys
    sortedItems.assignedItems = []
    sortedItems.unassignedItems = []
    const itemsInTradeOfferIds = new Set(
      newActiveTradeOffers
        .filter((offer) => !!offer.items)
        .flatMap((offer) => offer.items!.map((item) => item.assetId)),
    )

    newItems.forEach((item) => {
      const assignedItem = newPrizes.find((prize) => prize.assetIds.includes(item.assetId))
      if (assignedItem) {
        if (assignedItem.discordId === newDiscordId) {
          sortedItems.assignedItems.push(item)
        }
      } else if (!itemsInTradeOfferIds.has(item.assetId)) {
        sortedItems.unassignedItems.push(item)
      }
    })
  },
  { deep: true },
)

watch(keys, (newKeys) => {
  if (!selectedPrize.value) {
    return
  }

  if (newKeys.toString() === '' || newKeys < 0) {
    keys.value = 0
  }

  if (newKeys.toFixed(0) !== newKeys.toString()) {
    keys.value = parseInt(newKeys.toFixed(0))
  }

  if (selectedPrize.value.keys !== keys.value) {
    setKeysForPrize(selectedPrize.value, keys.value)
  }

  const completedBountyIds = selectedPrize.value.completedBountyIds
  if (completedBountyIds.length > 0) {
    const completedBountyKeys = getBountyGroup()
      .flatMap((group) =>
        group.bounties
          .filter((bounty) => completedBountyIds.includes(bounty.id))
          .reduce((keys, bounty) => keys + bounty.keys, 0),
      )
      .reduce((keys, key) => keys + key)

    if (keys.value < completedBountyKeys) {
      prizeStore.removeAllBountiesFromPrize(selectedPrize.value)
    }
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
      class="sticky top-0 z-50 flex w-full flex-col items-center gap-4 border-b-2 border-blue-500 bg-blue-300 py-4"
    >
      <div class="w-180">
        <SubmitButton
          @click="prizeStore.saveAsync"
          :disabled="isSaveButtonDisabled"
          :is-submitting="isSaving.has(prizeStore.at)"
          class="w-full button-green"
          >Save Prizes</SubmitButton
        >
      </div>

      <DropdownSearch
        :values="selectablePlayers"
        :placeholder="'Select a Player'"
        @selected="selectPlayer"
        class="w-180"
      />
    </div>
    <template v-if="selectedPlayer && selectedPrize">
      <h2>Keys</h2>
      <KeyStock />
      <h3>Completed Bounties</h3>
      <div class="flex gap-8 rounded-md bg-slate-700 px-2 py-1">
        <div
          v-for="group in getBountyGroup()"
          :style="'color:' + getRankColorHex(group.discordRank)"
        >
          <div class="font-bold">{{ group.discordRank.name }}</div>
          <div class="flex flex-col">
            <button
              v-for="bounty in group.bounties"
              @click="prizeStore.toggleBountyForPrize(selectedPrize, bounty)"
              class="flex justify-between text-left after:content-['✔'] hover:bg-slate-600"
              :class="{
                'after:opacity-100': hasCompletedBounty(bounty),
                'after:opacity-0': !hasCompletedBounty(bounty),
              }"
            >
              {{ bounty.name }} ({{ bounty.keys }} {{ bounty.keys > 1 ? 'keys' : 'key' }})
            </button>
          </div>
        </div>
      </div>
      <div class="mt-2">
        <label for="keys" class="mr-2"
          >Keys assigned to {{ selectedPlayer.discordFullName }}:</label
        >
        <input v-model.lazy="keys" type="number" id="keys" class="w-15" />
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
