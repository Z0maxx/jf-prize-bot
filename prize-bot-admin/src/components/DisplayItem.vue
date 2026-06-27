<script setup lang="ts">
import type { UniqueItem } from '@jf-prize-bot/schema'

import ItemIcon from './ItemIcon.vue'
import ItemName from './ItemName.vue'
import KillstreakIcon from './KillstreakIcon.vue'

defineProps<{ item: UniqueItem }>()
</script>
<template>
  <div class="flex items-center gap-2 py-1">
    <div class="relative">
      <ItemIcon :item="item" />
      <KillstreakIcon :item="item" />
    </div>
    <ItemName :item="item" />
  </div>
</template>
