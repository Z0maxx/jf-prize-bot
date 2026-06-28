<script setup lang="ts">
import type { Prize, PrizeTradeOffer } from '@jf-prize-bot/schema';

defineProps<{ tradeOffer?: PrizeTradeOffer }>()

const statusColors: Record<string, string> = {
  'unconfirmed': 'bg-yellow-200',
  'accepted': 'bg-green-200',
  'confirmed': 'bg-violet-200',
  'failed': 'bg-red-200'
}
</script>
<template>
  <div v-if="tradeOffer">
    <h3>Trade Offer</h3>
    <div class="flex justify-center"><span :class="[statusColors[tradeOffer.status]]" class="py-1 px-2 rounded-md">Status: {{ tradeOffer.status }}</span></div>
    <div v-if="tradeOffer.error">{{ tradeOffer.error }}</div>
  </div>
</template>