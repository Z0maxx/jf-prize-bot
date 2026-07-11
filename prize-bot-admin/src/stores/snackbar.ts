import { defineStore } from 'pinia'
import { ref } from 'vue'

import { snackbarMessageTypes } from '@/constants/snackbarMessageTypes'

import type { SnackbarMessage } from '@/types'

export const useSnackbarStore = defineStore('snackbarStore', () => {
  const message = ref<SnackbarMessage | null>(null)

  function setMessage(newMessage: SnackbarMessage | null) {
    message.value = newMessage
  }

  function success(text: string) {
    message.value = { text, type: snackbarMessageTypes.success }
  }

  function warning(text: string) {
    message.value = { text, type: snackbarMessageTypes.warning }
  }

  function error(text: string) {
    message.value = { text, type: snackbarMessageTypes.error }
  }

  return {
    message,
    setMessage,
    success,
    warning,
    error,
  }
})
