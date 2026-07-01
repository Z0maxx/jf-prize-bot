<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps<{ values: Record<string, string>; placeholder: string }>()
const emit = defineEmits(['selected', 'deselected'])

const selected = ref<string>('')

const selectables = computed(() =>
  Object.entries(props.values).filter(
    ([_, value]) => !selected.value || value.toLowerCase().includes(selected.value.toLowerCase()),
  ),
)

function select(entry: [string | number, string]) {
  selected.value = entry[1]
  emit('selected', entry[0])
}

watch(selected, () => {
  if (selected.value === '') {
    emit('deselected')
  }
})
</script>
<template>
  <div class="relative">
    <input
      v-model="selected"
      :placeholder="placeholder"
      class="w-full text-center focus:[&_+_div]:scale-y-100"
    />
    <div
      class="absolute flex w-full origin-top translate-y-[0rem] scale-y-0 flex-col divide-y-2 divide-sky-600 overflow-hidden rounded-md border-2 border-sky-700 shadow-lg/50 shadow-black transition-transform delay-100"
    >
      <button
        v-for="entry in selectables"
        @click="select(entry)"
        class="bg-sky-200 py-0.5 hover:bg-sky-300"
      >
        {{ entry[1] }}
      </button>
    </div>
  </div>
</template>
