import { defineStore } from 'pinia'
import { ref } from 'vue'

import { api } from '@/api'

import { useAppStore } from './app'
import { load, save } from './helpers'
import { useInventoryStore } from './inventory'

import type { Bounty, Player, Prize, UniqueItem } from '@jf-prize-bot/schema'

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
        completedBountyIds: [],
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

  function toggleBountyForPrize(prize: Prize, bounty: Bounty) {
    const idx = prize.completedBountyIds.indexOf(bounty.id)
    if (idx > -1) {
      prize.completedBountyIds.splice(idx, 1)
      const keys = prize.keys - bounty.keys
      prize.keys = keys < 0 ? 0 : keys
    } else {
      prize.completedBountyIds.push(bounty.id)
      prize.keys += bounty.keys
      const { addHasChanges } = useAppStore()
      addHasChanges(at)
    }
  }

  function removeAllBountiesFromPrizes() {
    const { addHasChanges } = useAppStore()
    prizes.value.forEach((prize) => {
      if (prize.completedBountyIds.length > 0) {
        addHasChanges(at)
        prize.completedBountyIds = []
      }
    })
  }

  function removeBountyFromPrizes(bounty: Bounty) {
    const { addHasChanges } = useAppStore()
    prizes.value.forEach((prize) => {
      const idx = prize.completedBountyIds.indexOf(bounty.id)
      if (idx > -1) {
        prize.completedBountyIds.splice(idx, 1)
        addHasChanges(at)
      }
    })
  }

  function removeAllBountiesFromPrize(prize: Prize) {
    const { addHasChanges } = useAppStore()
    const idx = prizes.value.findIndex((p) => p.discordId === prize.discordId)
    if (idx > -1) {
      prizes.value[idx]!.completedBountyIds = []
      addHasChanges(at)
    }
  }

  function loadAsync() {
    return load(at, prizes, api.getPrizes)
  }

  function saveAsync() {
    return save(at, () => {
      const { inventory } = useInventoryStore()
      const assetIds = inventory.items.map((item) => item.assetId)
      prizes.value.forEach((prize) => {
        prize.assetIds = prize.assetIds.filter((assetId) => assetIds.includes(assetId))
      })

      const filteredPrizes = prizes.value.filter(
        (prize) => prize.keys > 0 || prize.assetIds.length > 0,
      )

      return api.savePrizes(filteredPrizes)
    })
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
    toggleBountyForPrize,
    removeBountyFromPrizes,
    removeAllBountiesFromPrizes,
    removeAllBountiesFromPrize,
    loadAsync,
    saveAsync,
  }
})
