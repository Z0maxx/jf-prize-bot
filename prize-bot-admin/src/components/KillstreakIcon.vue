<script setup lang="ts">
import { killstreakColors, killstreakRanks } from '@/constants/killstreakIconConstants'

import type { UniqueItem } from '@jf-prize-bot/schema';

const { item } = defineProps<{ item: UniqueItem }>()
const attributes = item.nameParts.map((parts) => parts[0]!)
const killstreak = attributes.find((attr) => killstreakRanks.includes(attr))
let color
let rank = 0
if (killstreak) {
  color = killstreakColors[killstreak]
  rank = killstreakRanks.indexOf(killstreak) + 1
}

const style = `width: calc(0.3rem + ${rank} * 0.3rem)`
</script>

<template>
  <div class="absolute right-1 bottom-1 font-semibold" v-if="killstreak">
    <div class="relative h-4 rounded-md bg-pink-950" v-bind:style="style">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1024 1024"
        class="absolute bottom-0.5 -left-0.25 size-3"
        v-bind:style="'fill:' + color"
        v-if="rank > 0"
      >
        <path
          d="M338.752 104.704a64 64 0 000 90.496l316.8 316.8-316.8 316.8a64 64 0 0090.496 90.496l362.048-362.048a64 64 0 000-90.496L429.248 104.704a64 64 0 00-90.496 0z"
        />
      </svg>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1024 1024"
        class="absolute bottom-0.5 left-0.75 size-3"
        v-bind:style="'fill:' + color"
        v-if="rank > 1"
      >
        <path
          d="M338.752 104.704a64 64 0 000 90.496l316.8 316.8-316.8 316.8a64 64 0 0090.496 90.496l362.048-362.048a64 64 0 000-90.496L429.248 104.704a64 64 0 00-90.496 0z"
        />
      </svg>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1024 1024"
        class="absolute bottom-0.5 left-1.75 size-3"
        v-bind:style="'fill:' + color"
        v-if="rank > 2"
      >
        <path
          d="M338.752 104.704a64 64 0 000 90.496l316.8 316.8-316.8 316.8a64 64 0 0090.496 90.496l362.048-362.048a64 64 0 000-90.496L429.248 104.704a64 64 0 00-90.496 0z"
        />
      </svg>
    </div>
  </div>
</template>
