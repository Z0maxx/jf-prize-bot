<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { ref, watch } from 'vue'

import { snackbarMessageTypes } from '@/constants/snackbarMessageTypes'
import { useSnackbarStore } from '@/stores/snackbar'

import type { SnackbarMessage, SnackbarMessageType } from '@/types'

const snackbarStore = useSnackbarStore()
const { message } = storeToRefs(snackbarStore)

const currentMessage = ref<SnackbarMessage | null>(null)

const colors: Record<SnackbarMessageType, string> = {
  success: 'text-green-600',
  warning: 'text-amber-600',
  error: 'text-rose-600',
}

function close() {
  snackbarStore.setMessage(null)
}

watch(message, (newMessage) => {
  if (newMessage) {
    currentMessage.value = newMessage
    if (newMessage.type === snackbarMessageTypes.success) {
      setTimeout(() => {
        close()
      }, 3000)
    }
  }
})
</script>
<template>
  <div
    class="fixed right-2 rounded-md border-2 border-stone-600 bg-white px-2 py-1 text-lg transition-all duration-500"
    :class="{
      'bottom-2 opacity-100': !!message,
      'pointer-events-none bottom-5 opacity-0': !message,
    }"
  >
    <div v-if="currentMessage" class="items-top flex gap-4" :class="colors[currentMessage.type]">
      <span class="font-medium" v-html="currentMessage.text.replace(/\n/g, '<br>')"></span>
      <button
        class="flex size-6 items-center justify-center rounded-full bg-mist-600 hover:bg-mist-700"
        @click="close"
      >
        <svg
          class="size-3 fill-white"
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
          version="1.1"
          id="Capa_1"
          viewBox="0 0 460.775 460.775"
          xml:space="preserve"
        >
          <path
            d="M285.08,230.397L456.218,59.27c6.076-6.077,6.076-15.911,0-21.986L423.511,4.565c-2.913-2.911-6.866-4.55-10.992-4.55   c-4.127,0-8.08,1.639-10.993,4.55l-171.138,171.14L59.25,4.565c-2.913-2.911-6.866-4.55-10.993-4.55   c-4.126,0-8.08,1.639-10.992,4.55L4.558,37.284c-6.077,6.075-6.077,15.909,0,21.986l171.138,171.128L4.575,401.505   c-6.074,6.077-6.074,15.911,0,21.986l32.709,32.719c2.911,2.911,6.865,4.55,10.992,4.55c4.127,0,8.08-1.639,10.994-4.55   l171.117-171.12l171.118,171.12c2.913,2.911,6.866,4.55,10.993,4.55c4.128,0,8.081-1.639,10.992-4.55l32.709-32.719   c6.074-6.075,6.074-15.909,0-21.986L285.08,230.397z"
          />
        </svg>
      </button>
    </div>
  </div>
</template>
