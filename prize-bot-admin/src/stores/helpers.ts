import { useAppStore } from './app'
import { useSnackbarStore } from './snackbar'

import type { DataResult, Result } from '@jf-prize-bot/schema'
import type { Ref } from 'vue'

export async function load<T>(at: string, ref: Ref<T>, callback: () => Promise<DataResult<T>>) {
  const { addIsLoading, removeIsLoading } = useAppStore()
  const { error } = useSnackbarStore()
  addIsLoading(at)
  const result = await callback()
  if (result.success) {
    ref.value = result.data!
  } else {
    error(`Failed to load ${at}: ${result.error}`)
  }

  removeIsLoading(at)
}

export async function save(at: string, callback: () => Promise<Result>) {
  const { addIsSaving, removeIsSaving, removeHasChanges } = useAppStore()
  const { error } = useSnackbarStore()
  addIsSaving(at)
  const result = await callback()
  if (result.success) {
    removeHasChanges(at)
  } else {
    error(`Failed to save ${at}: ${result.error}`)
  }

  removeIsSaving(at)
}
