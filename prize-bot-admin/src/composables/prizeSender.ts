import { sendPrizesKnownError } from '@jf-prize-bot/schema'

import { api } from '@/api'
import { useAppStore } from '@/stores/app'
import { usePrizeStore } from '@/stores/prize'
import { useSnackbarStore } from '@/stores/snackbar'
import { useTradeOfferStore } from '@/stores/tradeOffer'

export function usePrizeSender() {
  const appStore = useAppStore()
  const { setIsSendingPrizes } = appStore

  const prizeStore = usePrizeStore()
  const tradeOfferStore = useTradeOfferStore()

  const { success, error } = useSnackbarStore()

  async function sendPrizesAsync() {
    setIsSendingPrizes(true)
    const result = await api.sendPrizes()
    setIsSendingPrizes(false)
    if (result.success) {
      prizeStore.setPrizes([])
      tradeOfferStore.setTradeOffers(result.tradeOffers!)
      success('Prizes sent')
    } else if (result.error === sendPrizesKnownError.notEnoughAvailableKeys) {
      error('There are not enough keys available')
    } else if (result.error === sendPrizesKnownError.itemsNotFound) {
      error('Items not found with asset ids:\n' + result.itemsNotFound?.join('\n'))
    } else if (result.error === sendPrizesKnownError.playersNotFound) {
      error('Players not found:\n' + result.playersNotFound?.join('\n'))
    } else if (result.error === sendPrizesKnownError.itemsInTradeOffer) {
      error(
        'Items are in trade offers already with asset ids:\n' +
          result.itemsInTradeOffer?.join('\n'),
      )
    } else if (result.error === sendPrizesKnownError.hasFailedTradeOffers) {
      prizeStore.setPrizes(result.failedToSendPrizes!)
      tradeOfferStore.setTradeOffers(result.tradeOffers!)
      error('There are failed trade offers')
    } else {
      error(result.error!)
    }
  }

  return {
    sendPrizesAsync,
  }
}
