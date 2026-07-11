import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'

import { api } from '@/api'

export const useAppStore = defineStore('appStore', () => {
  const isLoggedIn = ref(false)
  const isLoginPopupOpened = ref(false)
  const isReloading = ref(false)
  const isSendingPrizes = ref(false)
  const isLoading = reactive(new Set<string>())
  const isSaving = reactive(new Set<string>())
  const hasChanges = reactive(new Set<string>())
  const actionAfterLogin = ref<(() => void) | null>(null)

  async function setIsLoggedInAsync() {
    isLoggedIn.value = await api.isLoggedIn()
    return isLoggedIn.value
  }

  function setIsLoginPopupOpened(state: boolean) {
    isLoginPopupOpened.value = state
  }

  function setIsReloading(state: boolean) {
    isReloading.value = state
  }

  function setIsSendingPrizes(state: boolean) {
    isSendingPrizes.value = state
  }

  function setActionAfterLogin(action: (() => void) | null) {
    actionAfterLogin.value = action
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
    isReloading,
    isSendingPrizes,
    isLoading,
    isSaving,
    hasChanges,
    actionAfterLogin,
    setIsLoggedInAsync,
    setIsLoginPopupOpened,
    setIsReloading,
    setIsSendingPrizes,
    addIsLoading,
    removeIsLoading,
    addIsSaving,
    removeIsSaving,
    addHasChanges,
    removeHasChanges,
    setActionAfterLogin,
  }
})
