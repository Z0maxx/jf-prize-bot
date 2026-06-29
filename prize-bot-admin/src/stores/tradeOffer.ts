import { defineStore } from 'pinia'
import { ref } from 'vue'

import { api } from '@/api'

import type { PrizeTradeOffer } from '@jf-prize-bot/schema'

export const useTradeOfferStore = defineStore('tradeOffer', () => {
  const tradeOffers = ref<PrizeTradeOffer[]>([])

  function setTradeOffers(newTradeOffers: PrizeTradeOffer[]) {
    tradeOffers.value = newTradeOffers
  }

  async function loadAsync() {
    tradeOffers.value = await api.getTradeOffers()
  }

  return {
    tradeOffers,
    setTradeOffers,
    loadAsync,
  }
})
