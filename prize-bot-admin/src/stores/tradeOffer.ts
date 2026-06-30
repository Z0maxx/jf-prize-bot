import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { api } from '@/api'
import { isActiveTradeOffer } from '@/utils'

import { useAppStore } from './app'

import type { PrizeTradeOffer } from '@jf-prize-bot/schema'

const at = 'Trade Offers'
export const useTradeOfferStore = defineStore('tradeOffer', () => {
  const tradeOffers = ref<PrizeTradeOffer[]>([])
  const activeTradeOffers = computed(() => tradeOffers.value.filter((offer) => isActiveTradeOffer(offer)))
  const isDeletingAll = ref(false)
  const isCancellingAll = ref(false)
  const isCancelling = ref(false)
  const cancellingRefs = computed(
    () =>
      new Map(
        tradeOffers.value
          .filter((offer) => isActiveTradeOffer(offer))
          .map((offer) => [offer.id!, ref(false)]),
      ),
  )

  function setTradeOffers(newTradeOffers: PrizeTradeOffer[]) {
    tradeOffers.value = newTradeOffers
  }

  async function loadAsync() {
    const { addIsLoading, removeIsLoading } = useAppStore()
    addIsLoading(at)
    tradeOffers.value = await api.getTradeOffers()
    removeIsLoading(at)
  }

  async function deleteHistoryAsync() {
    /*isDeletingAll.value = true
    await api.deleteTradeOfferHistoryAsync()
    setTradeOffers(activeTradeOffers.value)
    isDeletingAll.value = false*/
  }

  async function cancelAllAsync() {
    isCancellingAll.value = true
    const results = await api.cancelAllTradeOffers(activeTradeOffers.value)
    isCancellingAll.value = false
    return results
  }

  async function cancelAsync(tradeOffer: PrizeTradeOffer) {
    const cancelling = cancellingRefs.value.get(tradeOffer.id!)!
    cancelling.value = true
    isCancelling.value = true
    const result = await api.cancelTradeOffer(tradeOffer)
    cancelling.value = false
    isCancelling.value = false
    return result
  }

  return {
    at,
    tradeOffers,
    activeTradeOffers,
    isDeletingAll,
    isCancellingAll,
    isCancelling,
    cancellingRefs,
    setTradeOffers,
    loadAsync,
    deleteHistoryAsync,
    cancelAllAsync,
    cancelAsync,
  }
})
