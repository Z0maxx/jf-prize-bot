<script setup lang="ts">
import {
  defaultItemIconBdrColor,
  defaultItemIconBgColor,
  itemIconBdrColors,
  itemIconBgColors,
} from '@/constants/itemIconConstants'

import type { UniqueItem } from '@jf-prize-bot/schema'

const { item } = defineProps<{ item: UniqueItem }>()
const attributes: string[] = []
item.nameParts.forEach((parts) => {
  const attribute = parts[0]!
  if ((itemIconBgColors as Record<string, string>)[attribute]) {
    attributes.push(attribute)
  }
})

let bgColor = defaultItemIconBgColor
let bdrColor = defaultItemIconBdrColor

if (attributes.length > 0) {
  bdrColor = itemIconBdrColors[attributes[0]!]!

  if (attributes[0] === 'Strange') {
    bgColor = itemIconBgColors.Strange!
    bdrColor = itemIconBdrColors.Strange!
    if (attributes.length > 1) {
      bgColor = itemIconBgColors[attributes[1]!]!
    }
  } else {
    bgColor = itemIconBgColors[attributes[0]!]!
  }
}

const colorStyle = `background-color: ${bgColor}; border-color: ${bdrColor}`
const backgroundStyle = `background-image:url(${item.iconUrl?.replace(' ', '%20')}), url(${item.unusualIconUrl})`
</script>

<template>
  <div
    class="relative flex h-14 w-17 items-center justify-center border-4"
    v-bind:style="colorStyle"
  >
    <div class="size-full bg-cover bg-center" v-bind:style="backgroundStyle"></div>
  </div>
</template>
