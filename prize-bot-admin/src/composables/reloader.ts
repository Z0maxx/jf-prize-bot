import { api } from '@/api'
import { useAppStore } from '@/stores/app'
import { useInventoryStore } from '@/stores/inventory'
import { useSnackbarStore } from '@/stores/snackbar'
import { useTradeOfferStore } from '@/stores/tradeOffer'

export function useReloader() {
  const appStore = useAppStore()
  const { setIsReloading } = appStore

  const { setInventory } = useInventoryStore()
  const { setTradeOffers } = useTradeOfferStore()
  const { success, error } = useSnackbarStore()

  async function reloadAsync() {
    setIsReloading(true)
    const result = await api.reload()
    setIsReloading(false)
    if (result.success) {
      setInventory(result.inventory!)
      setTradeOffers(result.tradeOffers!)
      success('Reloaded')
    } else {
      error(result.error!)
    }
  }

  return {
    reloadAsync,
  }
}
