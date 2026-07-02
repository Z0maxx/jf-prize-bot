import { DataResult, PrizeTradeOffer } from '@jf-prize-bot/schema'

import {
  getListFromSheetAsResultAsync,
  getListFromSheetAsync,
  saveListToSheetAsync,
  saveListToSheetWithResultAsync,
} from './sheets'

const sheetName = 'TradeOffers'

export async function saveTradeOffersAsync(tradeOffers: PrizeTradeOffer[]) {
  return saveListToSheetAsync(sheetName, tradeOffers)
}

export async function saveTradeOffersWithResultAsync(tradeOffers: PrizeTradeOffer[]) {
  return saveListToSheetWithResultAsync(sheetName, tradeOffers)
}

export async function getTradeOffersAsync(): Promise<PrizeTradeOffer[]> {
  return getListFromSheetAsync<PrizeTradeOffer>(sheetName)
}

export async function getTradeOffersAsResultAsync(): Promise<DataResult<PrizeTradeOffer[]>> {
  return getListFromSheetAsResultAsync<PrizeTradeOffer>(sheetName)
}
