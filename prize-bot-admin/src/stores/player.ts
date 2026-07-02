import { defineStore } from 'pinia'
import { ref } from 'vue'

import { api } from '@/api'

import { useAppStore } from './app'
import { load, save } from './helpers'

import type { Player } from '@jf-prize-bot/schema'

export const usePlayerStore = defineStore('playerStore', () => {
  const players = ref<Player[]>([])
  const at = 'Players'

  function addPlayer(player: Player) {
    players.value.push(player)
    const { addHasChanges } = useAppStore()
    addHasChanges(at)
  }

  function removePlayer(player: Player) {
    const idx = players.value.indexOf(player)
    if (idx > -1) {
      players.value.splice(idx, 1)
      const { addHasChanges } = useAppStore()
      addHasChanges(at)
    }
  }

  function loadAsync() {
    return load(at, players, api.getPlayers)
  }

  function saveAsync() {
    return save(at, () => api.savePlayers(players.value.filter((player) => !!player.tradeUrl)))
  }

  return {
    at,
    players,
    addPlayer,
    removePlayer,
    loadAsync,
    saveAsync,
  }
})
