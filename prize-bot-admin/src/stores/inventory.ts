import { defineStore } from 'pinia'
import { reactive } from 'vue'

import { api } from '@/api'

import type { Inventory } from '@/types'

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
    setInventory(await api.getBotInventory())
  }

  return {
    inventory,
    setInventory,
    loadAsync,
  }
})
