<script setup lang="ts">
import {
  prizeTradeOfferState,
  type CancelTradeOfferResult,
  type PrizeTradeOffer,
  type PrizeTradeOfferState,
} from '@jf-prize-bot/schema'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref, watch } from 'vue'

import { api } from '@/api'
import { useAppStore } from '@/stores/app'
import { usePlayerStore } from '@/stores/player'
import { useTradeOfferStore } from '@/stores/tradeOffer'
import { isActiveTradeOffer } from '@/utils'

import DisplayItem from '@/components/DisplayItem.vue'
import SubmitButton from '@/components/SubmitButton.vue'

const appStore = useAppStore()
const { isLoggedIn } = storeToRefs(appStore)

const tradeOfferStore = useTradeOfferStore()
const { tradeOffers } = storeToRefs(tradeOfferStore)

const playerStore = usePlayerStore()
const { players } = storeToRefs(playerStore)

const cancellingAll = ref(false)
const cancellingRefs = computed(
  () =>
    new Map(
      tradeOffers.value
        .filter((offer) => canBeCanceled(offer))
        .map((offer) => [offer.id!, ref(false)]),
    ),
)

const cancelableStates: PrizeTradeOfferState[] = [
  prizeTradeOfferState.confirmed,
  prizeTradeOfferState.unconfirmed,
]

const stateColors: Record<PrizeTradeOfferState, string> = {
  accepted: 'bg-green-200',
  canceled: 'bg-gray-200',
  confirmed: 'bg-lime-200',
  unconfirmed: 'bg-yellow-200',
  declined: 'bg-purple-200',
  expired: 'bg-pink-200',
  failed: 'bg-red-200',
  unknown: 'bg-white',
}

let cancelAfterLogin: PrizeTradeOffer | null = null
let cancelAllAfterLogin = false

function getPlayerName(offer: PrizeTradeOffer) {
  return players.value.find((player) => player.discordId === offer.discordId)!.discordFullName
}

function canBeCanceled(offer: PrizeTradeOffer) {
  return cancelableStates.includes(offer.state)
}

function setState(result: CancelTradeOfferResult) {
  tradeOffers.value.find((offer) => offer.tradeOfferId === result.tradeOfferId)!.state = result.state
}

async function cancel(offer: PrizeTradeOffer) {
  const cancelling = cancellingRefs.value.get(offer.id!)!
  cancelling.value = true
  const result = await api.cancelTradeOffer(offer)
  cancelling.value = false
  setState(result)
  if (!result.success) {
    alert('Failed to cancel trade offer: ' + result.error)
    return
  }
}

async function tryCancel(offer: PrizeTradeOffer) {
  if (confirm('Are you sure you want to cancel this trade offer?')) {
    await appStore.setIsLoggedInAsync()
    if (!isLoggedIn.value) {
      appStore.setIsLoginPopupOpened(true)
      cancelAfterLogin = offer
    } else {
      cancel(offer)
    }
  }
}

async function cancelAll() {
  cancellingAll.value = true
  const activeTradeOffers = tradeOffers.value.filter((offer) => isActiveTradeOffer(offer))
  const results = await api.cancelAllTradeOffers(activeTradeOffers)
  cancellingAll.value = false
  results.forEach((result) => setState(result))
  const failed = results
    .filter((result) => !result.success)
    .map((result) => `${result.tradeOfferId}: ${result.error}`)

  if (failed.length > 0) {
    alert('Failed to cancel trade offers:\n' + failed.join('\n'))
  }
}

async function tryCancelAll() {
  if (confirm('Are you sure you want to cancel all trade offers?')) {
    await appStore.setIsLoggedInAsync()
    if (!isLoggedIn.value) {
      appStore.setIsLoginPopupOpened(true)
      cancelAllAfterLogin = true
    } else {
      cancelAll()
    }
  }
}

onMounted(() => {
  tradeOfferStore.loadAsync()
})

watch(isLoggedIn, (newIsLoggedIn) => {
  if (newIsLoggedIn) {
    if (cancelAfterLogin) {
      cancel(cancelAfterLogin)
      cancelAfterLogin = null
    }

    if (cancelAllAfterLogin) {
      cancelAllAfterLogin = false
      cancelAll()
    }
  }
})
</script>
<template>
  <div class="mt-4 flex justify-center">
    <SubmitButton @click="tryCancelAll" :is-submitting="cancellingAll" class="w-70"
      >Cancel All Trade Offers</SubmitButton
    >
  </div>
  <div v-for="offer in tradeOffers" :key="offer.id">
    <h2>Trade Offer for {{ getPlayerName(offer) }}</h2>
    <div class="flex flex-col items-center gap-2">
      <span class="text-xs text-gray-500" v-if="offer.tradeOfferId"
        >Id: {{ offer.tradeOfferId }}</span
      >
      <SubmitButton
        v-if="canBeCanceled(offer)"
        @click="tryCancel(offer)"
        :is-submitting="cancellingRefs.get(offer.id!)!.value"
        class="w-40"
        >Cancel</SubmitButton
      >
      <span :class="[stateColors[offer.state]]" class="rounded-md px-2 py-1"
        >Status: {{ offer.state }}</span
      >
      <div v-if="offer.error">{{ offer.error }}</div>
    </div>
    <h3 v-if="offer.keys">Keys: {{ offer.keys }}</h3>
    <template v-if="offer.items">
      <div class="flex flex-col items-center">
        <h3>Sent Items</h3>
        <div
          v-for="item in offer.items"
          :key="item.assetId"
          class="relative flex w-180 cursor-pointer items-center"
        >
          <DisplayItem :item="item" />
          <div class="absolute top-1 right-0 text-xs text-gray-500">
            Asset id: {{ item.assetId }}
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
