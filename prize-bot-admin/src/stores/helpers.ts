import { useAppStore } from './app'

import type { DataResult, Result } from '@jf-prize-bot/schema'
import type { Ref } from 'vue'

export async function load<T>(at: string, ref: Ref<T>, callback: () => Promise<DataResult<T>>) {
  const { addIsLoading, removeIsLoading } = useAppStore()
  addIsLoading(at)
  const result = await callback()
  if (result.success) {
    ref.value = result.data!
  } else {
    alert(`Failed to load ${at}: ${result.error}`)
  }

  removeIsLoading(at)
}

export async function save(at: string, callback: () => Promise<Result>) {
  const { addIsSaving, removeIsSaving, removeHasChanges } = useAppStore()
  addIsSaving(at)
  const result = await callback()
  if (result.success) {
    removeHasChanges(at)
  } else {
    alert(`Failed to save ${at}: ${result.error}`)
  }

  removeIsSaving(at)
}
