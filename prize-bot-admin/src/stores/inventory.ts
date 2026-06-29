import { defineStore } from 'pinia'
import { reactive } from 'vue'

import { api } from '@/api'

import type { Inventory } from '@jf-prize-bot/schema'

export const useInventoryStore = defineStore('inventoryStore', () => {
  const inventory = reactive<Inventory>({
    keys: 0,
    items: [],
  })

  function setInventory(newInventory: Inventory) {
    inventory.items = newInventory.items
    inventory.keys = newInventory.keys
  }

  async function loadAsync() {
    setInventory(await api.getInventory())
  }

  return {
    inventory,
    setInventory,
    loadAsync,
  }
})
