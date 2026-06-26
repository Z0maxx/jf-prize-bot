<script setup lang="ts">
defineProps<{ isSaving: boolean }>()
</script>

<template>
  <button class="px-2 py-1 border-2 border-green-600 bg-green-200 hover:bg-green-300 disabled:bg-slate-200 disabled:border-slate-600 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors text-lg font-medium rounded-md flex justify-center">
    <span class="relative">
        <span><slot></slot></span>
        <svg v-if="isSaving" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" class="size-7 absolute top-0 -right-10 animate-spin">
          <g fill="#000000" fill-rule="evenodd" clip-rule="evenodd">
            <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8z" opacity=".2" />
            <path d="M7.25.75A.75.75 0 018 0a8 8 0 018 8 .75.75 0 01-1.5 0A6.5 6.5 0 008 1.5a.75.75 0 01-.75-.75z" />
          </g>
        </svg>
      </span>
  </button>
</template>