<script setup lang="ts">
import { itemNameColors } from '@/constants/itemNameConstants'

import type { Item } from '@/types'

const { item } = defineProps<{ item: Item }>()
const itemName = item.nameParts
  .map((parts) => {
    const attributeColor = itemNameColors[parts[0]!]
    if (attributeColor) {
      const style = `color: ${attributeColor}`
      const name = parts.length === 1 ? parts[0] : parts.slice(1).join(' ')
      return `<span class="rounded-md font-semibold" style="${style}">${name}</span>`
    }

    return parts[0]
  })
  .join(' ')
</script>

<template>
  <div v-html="itemName"></div>
</template>
