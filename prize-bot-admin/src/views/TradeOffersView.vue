<script setup lang="ts">
import {
  type CancelTradeOfferResult,
  type PrizeTradeOffer,
  type PrizeTradeOfferState,
} from '@jf-prize-bot/schema'
import { storeToRefs } from 'pinia'
import { computed, watch } from 'vue'

import { useAppStore } from '@/stores/app'
import { usePlayerStore } from '@/stores/player'
import { useTradeOfferStore } from '@/stores/tradeOffer'
import { isActiveTradeOffer } from '@/utils'

import DisplayItem from '@/components/DisplayItem.vue'
import LoadingPage from '@/components/LoadingPage.vue'
import SubmitButton from '@/components/SubmitButton.vue'

const appStore = useAppStore()
const { isLoggedIn, isLoading } = storeToRefs(appStore)

const tradeOfferStore = useTradeOfferStore()
const { tradeOffers, isDeletingAll, isCancellingAll, isCancelling, cancellingRefs, activeTradeOffers } =
  storeToRefs(tradeOfferStore)

const playerStore = usePlayerStore()
const { players } = storeToRefs(playerStore)

const isPageLoading = computed(
  () =>
    !isLoading || isLoading.value.has(playerStore.at) || isLoading.value.has(tradeOfferStore.at),
)

const isButtonDisabled = computed(
  () => isDeletingAll.value || isCancellingAll.value || isCancelling.value,
)

const anyCanBeCanceled = computed(() =>
  activeTradeOffers.value.length > 0,
)

const stateColors: Record<PrizeTradeOfferState, string> = {
  accepted: 'bg-lime-300',
  canceled: 'bg-gray-300',
  confirmed: 'bg-green-300',
  unconfirmed: 'bg-yellow-300',
  declined: 'bg-fuchsia-300',
  expired: 'bg-pink-300',
  failed: 'bg-red-300',
  unknown: 'bg-white',
}

let cancelAfterLogin: PrizeTradeOffer | null = null
let cancelAllAfterLogin = false

function getPlayerName(offer: PrizeTradeOffer) {
  return players.value.find((player) => player.discordId === offer.discordId)!.discordFullName
}

function setState(result: CancelTradeOfferResult) {
  tradeOffers.value.find((offer) => offer.tradeOfferId === result.tradeOfferId)!.state =
    result.state
}

async function cancel(offer: PrizeTradeOffer) {
  const result = await tradeOfferStore.cancelAsync(offer)
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
  const results = await tradeOfferStore.cancelAllAsync()
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
  <LoadingPage v-if="isPageLoading" :name="tradeOfferStore.at" />
  <template v-else>
    <div v-if="anyCanBeCanceled || tradeOffers.length > 0" class="mt-4 flex justify-center">
      <div class="flex w-180 gap-4">
        <SubmitButton
          @click="tryCancelAll"
          :is-submitting="isCancellingAll"
          :disabled="isButtonDisabled"
          class="w-full button-amber"
          >Cancel All Trade Offers</SubmitButton
        >
        <SubmitButton
          @click="tradeOfferStore.deleteHistoryAsync"
          :is-submitting="isDeletingAll"
          :disabled="isButtonDisabled"
          class="w-full button-rose"
          >Clear Inactive History</SubmitButton
        >
      </div>
    </div>
    <h1 v-if="tradeOffers.length === 0">There are no Trade Offers</h1>
    <div v-for="offer in tradeOffers" :key="offer.id">
      <h2>Trade Offer for {{ getPlayerName(offer) }}</h2>
      <div class="flex flex-col items-center gap-2">
        <span class="text-xs text-gray-500" v-if="offer.tradeOfferId"
          >Id: {{ offer.tradeOfferId }}</span
        >
        <SubmitButton
          v-if="isActiveTradeOffer(offer)"
          @click="tryCancel(offer)"
          :is-submitting="cancellingRefs.get(offer.id!)!.value"
          :disabled="isButtonDisabled"
          class="button-amber"
          >Cancel</SubmitButton
        >
        <span
          :class="[stateColors[offer.state]]"
          class="rounded-md border-2 border-black px-2 py-1 font-medium"
          >{{ offer.state }}</span
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
</template>
