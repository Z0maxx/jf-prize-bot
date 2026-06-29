import { defineStore } from 'pinia'
import { ref } from 'vue'

import { api } from '@/api'

import { useAppStore } from './app'
import { useInventoryStore } from './inventory'

import type { Player, Prize, UniqueItem } from '@jf-prize-bot/schema'

export const usePrizeStore = defineStore('prizeStore', () => {
  const prizes = ref<Prize[]>([])
  const at = 'Prizes'

  function setPrizes(newPrizes: Prize[]) {
    prizes.value = newPrizes
  }

  function getPrizeForPlayer(player: Player) {
    let prize = prizes.value.find((prize) => prize.discordId === player.discordId)
    if (!prize) {
      prize = {
        discordId: player.discordId,
        assetIds: [],
        keys: 0,
      }

      prizes.value.push(prize)
      return prize
    }

    return prize
  }

  function removePrizeForPlayer(player: Player) {
    const idx = prizes.value.findIndex((prize) => prize.discordId === player.discordId)
    if (idx > -1) {
      prizes.value.splice(idx, 1)
      const { addHasChanges } = useAppStore()
      addHasChanges(at)
    }
  }

  function setKeysForPrize(prize: ReturnType<typeof getPrizeForPlayer>, keys: number) {
    prize.keys = keys
    const { addHasChanges } = useAppStore()
    addHasChanges(at)
  }

  function addItemToPrize(prize: Prize, item: UniqueItem) {
    prize.assetIds.push(item.assetId)
    const { addHasChanges } = useAppStore()
    addHasChanges(at)
  }

  function removeItemFromPrize(prize: Prize, item: UniqueItem) {
    const idx = prize.assetIds.indexOf(item.assetId)
    if (idx > -1) {
      prize.assetIds.splice(idx, 1)
      const { addHasChanges } = useAppStore()
      addHasChanges(at)
    }
  }

  async function loadAsync() {
    const { addIsLoading, removeIsLoading } = useAppStore()
    addIsLoading(at)
    prizes.value = await api.getPrizes()
    removeIsLoading(at)
  }

  async function saveAsync() {
    const { addIsSaving, removeIsSaving, removeHasChanges } = useAppStore()
    addIsSaving(at)
    const { inventory } = useInventoryStore()
    const assetIds = inventory.items.map((item) => item.assetId)
    prizes.value.forEach((prize) => {
      prize.assetIds = prize.assetIds.filter((assetId) => assetIds.includes(assetId))
    })

    const filteredPrizes = prizes.value.filter(
      (prize) => prize.keys > 0 || prize.assetIds.length > 0,
    )

    await api.savePrizes(filteredPrizes)
    removeHasChanges(at)
    removeIsSaving(at)
  }

  return {
    at,
    prizes,
    setPrizes,
    getPrizeForPlayer,
    setKeysForPrize,
    addItemToPrize,
    removeItemFromPrize,
    removePrizeForPlayer,
    loadAsync,
    saveAsync,
  }
})
