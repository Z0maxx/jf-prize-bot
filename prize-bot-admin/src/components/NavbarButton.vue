<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { useAppStore } from '@/stores/app'

const route = useRoute()

const appStore = useAppStore()
const { isSaving } = storeToRefs(appStore)

const props = defineProps<{ to: string; savingAt?: string }>()
const isActive = computed(() => {
  return props.to === '/' ? route.path === props.to : route.path.startsWith(props.to)
})
</script>
<template>
  <div class="relative">
    <svg
      v-if="savingAt && isSaving.has(savingAt)"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      class="absolute top-0.5 left-0.5 size-4 animate-spin"
    >
      <g fill-rule="evenodd" clip-rule="evenodd" class="fill-green-200 stroke-green-400">
        <path
          d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8z"
          opacity=".2"
        />
        <path
          d="M7.25.75A.75.75 0 018 0a8 8 0 018 8 .75.75 0 01-1.5 0A6.5 6.5 0 008 1.5a.75.75 0 01-.75-.75z"
        />
      </g>
    </svg>
    <RouterLink
      :to="to"
      class="flex justify-center px-4 py-2 text-2xl font-semibold text-white hover:text-lime-300"
      :class="{ 'bg-teal-700': isActive, 'bg-teal-800': !isActive }"
    >
      <slot>NavbarButton</slot>
    </RouterLink>
  </div>
</template>
