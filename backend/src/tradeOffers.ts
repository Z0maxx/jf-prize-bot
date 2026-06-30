import { PrizeTradeOffer } from '@jf-prize-bot/schema'

import { getListFromSheetAsync, saveListToSheetAsync } from './sheets'

const sheetName = 'TradeOffers'
export async function saveTradeOffersAsync(tradeOffers: PrizeTradeOffer[]) {
  saveListToSheetAsync(sheetName, 'A', tradeOffers)
}

export async function getTradeOffersAsync(): Promise<PrizeTradeOffer[]> {
  return getListFromSheetAsync<PrizeTradeOffer>(sheetName, 'A')
}
