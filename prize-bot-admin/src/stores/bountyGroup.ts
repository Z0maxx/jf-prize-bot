import { defineStore } from 'pinia'
import { ref } from 'vue'

import { api } from '@/api'

import { useAppStore } from './app'
import { load, save } from './helpers'

import type { BountyGroup } from '@jf-prize-bot/schema'

export const useBountyGroupStore = defineStore('bountyGroupStore', () => {
  const at = 'Bounty Groups'
  const bountyGroups = ref<BountyGroup[]>([])
  const isDeletingBounties = ref(false)

  function loadAsync() {
    return load(at, bountyGroups, api.getBountyGroups)
  }

  function saveAsync() {
    return save(at, () => api.saveBountyGroups(bountyGroups.value))
  }

  async function deleteBountiesAsync() {
    const { removeHasChanges } = useAppStore()
    isDeletingBounties.value = true
    bountyGroups.value.forEach((group) => {
      group.bounties = []
    })

    const result = await api.saveBountyGroups(bountyGroups.value)
    if (result.success) {
      removeHasChanges(at)
    }

    isDeletingBounties.value = false
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
