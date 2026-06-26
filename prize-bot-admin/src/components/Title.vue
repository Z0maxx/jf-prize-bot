<script setup lang="ts">
defineProps<{ textSize?: 'lg' | 'xl' | '2xl' }>()
</script>
<template>
  <h2 :class="'text- my-2 text-center font-medium' + (textSize ? textSize : 'lg')">
    <slot></slot>
  </h2>
</template>
