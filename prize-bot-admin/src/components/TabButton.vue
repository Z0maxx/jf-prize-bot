<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps<{ to: string }>()
const route = useRoute()
const isActive = computed(() => {
  return route.path === props.to
})
</script>
<template>
  <RouterLink
    :to="to"
    class="flex w-full justify-center bg-cyan-700 p-1 text-xl font-semibold hover:bg-cyan-600"
    :class="{ 'text-amber-300': isActive, 'text-white': !isActive }"
  >
    <slot>NavbarButton</slot>
  </RouterLink>
</template>
