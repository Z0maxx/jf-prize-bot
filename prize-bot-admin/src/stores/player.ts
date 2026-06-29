import { defineStore } from 'pinia'
import { ref } from 'vue'

import { api } from '@/api'

import { useAppStore } from './app'

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

  async function loadAsync() {
    const { addIsLoading, removeIsLoading } = useAppStore()
    addIsLoading(at)
    players.value = await api.getPlayers()
    removeIsLoading(at)
  }

  async function saveAsync() {
    const { addIsSaving, removeIsSaving, removeHasChanges } = useAppStore()
    addIsSaving(at)
    await api.savePlayers(players.value.filter(player => !!player.tradeUrl))
    removeHasChanges(at)
    removeIsSaving(at)
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
