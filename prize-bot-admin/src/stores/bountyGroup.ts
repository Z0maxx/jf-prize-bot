import { defineStore } from 'pinia'
import { ref } from 'vue'

import { api } from '@/api'

import { useAppStore } from './app'

import type { BountyGroup } from '@jf-prize-bot/schema'

export const useBountyGroupStore = defineStore('bountyGroupStore', () => {
  const at = 'Bounty Groups'
  const bountyGroups = ref<BountyGroup[]>([])
  const isDeletingBounties = ref(false)

  async function loadAsync() {
    const { addIsLoading, removeIsLoading } = useAppStore()
    addIsLoading(at)
    bountyGroups.value = await api.getBountyGroups()
    removeIsLoading(at)
  }

  async function saveAsync() {
    const { addIsSaving, removeIsSaving, removeHasChanges } = useAppStore()
    addIsSaving(at)
    await api.saveBountyGroups(bountyGroups.value)
    removeHasChanges(at)
    removeIsSaving(at)
  }

  async function deleteBountiesAsync() {
    const { removeHasChanges } = useAppStore()
    isDeletingBounties.value = true
    bountyGroups.value.forEach((group) => {
      group.bounties = []
    })

    await api.saveBountyGroups(bountyGroups.value)
    isDeletingBounties.value = false
    removeHasChanges(at)
  }

  return {
    at,
    bountyGroups,
    isDeletingBounties,
    loadAsync,
    saveAsync,
    deleteBountiesAsync,
  }
})
