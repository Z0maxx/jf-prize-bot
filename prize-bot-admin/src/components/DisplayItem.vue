<script setup lang="ts">
import type { Item } from '@/types';
import ItemIcon from './ItemIcon.vue';
import KillstreakIcon from './KillstreakIcon.vue';
import ItemName from './ItemName.vue';

defineProps<{ item: Item }>()
</script>
<template>
  <div class="py-1 flex gap-2 items-center">
    <div class="relative">
      <ItemIcon :item="item" />
      <KillstreakIcon :item="item" />
    </div>
    <ItemName :item="item" />
  </div>
</template>