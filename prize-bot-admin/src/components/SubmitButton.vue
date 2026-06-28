<script setup lang="ts">
defineProps<{ isSubmitting: boolean }>()
</script>

<template>
  <button
    class="flex justify-center rounded-md border-2 border-green-600 bg-green-200 px-2 py-1 text-lg font-medium transition-colors hover:bg-green-300 disabled:cursor-not-allowed disabled:border-slate-600 disabled:bg-slate-200 disabled:text-gray-600"
  >
    <span class="relative">
      <span><slot></slot></span>
      <svg
        v-if="isSubmitting"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        class="absolute top-0 -right-10 size-7 animate-spin"
      >
        <g fill="#000000" fill-rule="evenodd" clip-rule="evenodd">
          <path
            d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8z"
            opacity=".2"
          />
          <path
            d="M7.25.75A.75.75 0 018 0a8 8 0 018 8 .75.75 0 01-1.5 0A6.5 6.5 0 008 1.5a.75.75 0 01-.75-.75z"
          />
        </g>
      </svg>
    </span>
  </button>
</template>
