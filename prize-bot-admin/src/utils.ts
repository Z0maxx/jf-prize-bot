import { prizeTradeOfferState, type PrizeTradeOffer } from '@jf-prize-bot/schema'

export function isActiveTradeOffer(tradeOffer: PrizeTradeOffer) {
  return (
    tradeOffer.state === prizeTradeOfferState.unconfirmed ||
    tradeOffer.state === prizeTradeOfferState.confirmed
  )
}
