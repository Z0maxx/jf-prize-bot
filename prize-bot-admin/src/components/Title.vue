<script setup lang="ts">
defineProps<{ textSize?: 'lg' | 'xl' | '2xl' }>()
</script>
<template>
  <h2 :class="'text-center font-medium my-2 text-' + (textSize ? textSize : 'lg')"><slot></slot></h2>
</template>