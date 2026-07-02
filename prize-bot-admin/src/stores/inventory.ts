import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'

import { api } from '@/api'

import { load } from './helpers'

import type { Inventory } from '@jf-prize-bot/schema'

export const useInventoryStore = defineStore('inventoryStore', () => {
  const inventory = ref<Inventory>({
    keys: 0,
    items: [],
  })

  function setInventory(newInventory: Inventory) {
    inventory.value = newInventory
  }

  function loadAsync() {
    return load('Inventory', inventory, api.getInventory)
  }

  return {
    inventory,
    setInventory,
    loadAsync,
  }
})
