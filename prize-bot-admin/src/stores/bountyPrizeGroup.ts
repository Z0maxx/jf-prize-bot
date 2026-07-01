import { defineStore } from 'pinia'
import { ref } from 'vue'

import { api } from '@/api'

import { useAppStore } from './app'

import type { BountyPrizeGroup } from '@jf-prize-bot/schema'

export const useBountyPrizeGroupStore = defineStore('bountyPrizeGroupStore', () => {
  const at = 'Bounty Prize Groups'
  const bountyPrizeGroups = ref<BountyPrizeGroup[]>([])

  async function loadAsync() {
    const { addIsLoading, removeIsLoading } = useAppStore()
    addIsLoading(at)
    bountyPrizeGroups.value = await api.getBountyPrizeGroups()
    removeIsLoading(at)
  }

  async function saveAsync() {
    const { addIsSaving, removeIsSaving, removeHasChanges } = useAppStore()
    addIsSaving(at)
    await api.saveBountyPrizeGroups(bountyPrizeGroups.value)
    removeHasChanges(at)
    removeIsSaving(at)
  }

  return {
    at,
    bountyPrizeGroups,
    loadAsync,
    saveAsync,
  }
})
