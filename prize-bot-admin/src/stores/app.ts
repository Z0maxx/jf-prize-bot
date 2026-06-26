import { defineStore } from "pinia";
import { reactive, readonly } from "vue";

export const useAppStore = defineStore('appStore', () => {
  const isLoading = reactive(new Set<string>())
  const isSaving = reactive(new Set<string>())
  const hasChanges = reactive(new Set<string>())

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
    isLoading: readonly(isLoading),
    isSaving: readonly(isSaving),
    hasChanges: readonly(hasChanges),
    addIsLoading,
    removeIsLoading,
    addIsSaving,
    removeIsSaving,
    addHasChanges,
    removeHasChanges
  }
})