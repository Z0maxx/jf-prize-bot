import { defineStore } from 'pinia'
import { reactive, readonly, ref } from 'vue'

export const useAppStore = defineStore('appStore', () => {
  const isLoggedIn = ref(false)
  const isLoginPopupOpened = ref(false)
  const isSendingPrizes = ref(false)
  const isLoading = reactive(new Set<string>())
  const isSaving = reactive(new Set<string>())
  const hasChanges = reactive(new Set<string>())

  function setIsLoggedIn(state: boolean) {
    isLoggedIn.value = state
  }

  function setIsLoginPopupOpened(state: boolean) {
    isLoginPopupOpened.value = state
  }

  function setIsSendingPrizes(state: boolean) {
    isSendingPrizes.value = state
  }

  function addIsLoading(at: string) {
    isLoading.add(at)
  }

  function removeIsLoading(at: string) {
    isLoading.delete(at)
  }

  function addIsSaving(at: string) {
    isSaving.add(at)
  }

  function removeIsSaving(at: string) {
    isSaving.delete(at)
  }

  function addHasChanges(at: string) {
    hasChanges.add(at)
  }

  function removeHasChanges(at: string) {
    hasChanges.delete(at)
  }

  return {
    isLoggedIn,
    isLoginPopupOpened,
    isSendingPrizes,
    isLoading,
    isSaving,
    hasChanges,
    setIsLoggedIn,
    setIsLoginPopupOpened,
    setIsSendingPrizes,
    addIsLoading,
    removeIsLoading,
    addIsSaving,
    removeIsSaving,
    addHasChanges,
    removeHasChanges
  }
})
