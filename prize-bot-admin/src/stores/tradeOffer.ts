import { defineStore } from 'pinia'
import { ref } from 'vue'

import { api } from '@/api'

import { useAppStore } from './app'

import type { PrizeTradeOffer } from '@jf-prize-bot/schema'

const at = 'Trade Offers'
export const useTradeOfferStore = defineStore('tradeOffer', () => {
  const tradeOffers = ref<PrizeTradeOffer[]>([])

  function setTradeOffers(newTradeOffers: PrizeTradeOffer[]) {
    tradeOffers.value = newTradeOffers
  }

  async function loadAsync() {
    const { addIsLoading, removeIsLoading } = useAppStore()
    addIsLoading(at)
    tradeOffers.value = await api.getTradeOffers()
    removeIsLoading(at)
  }

  return {
    at,
    tradeOffers,
    setTradeOffers,
    loadAsync,
  }
})
