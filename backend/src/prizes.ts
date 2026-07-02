import { DataResult, Prize } from '@jf-prize-bot/schema'

import {
  getListFromSheetAsResultAsync,
  getListFromSheetAsync,
  saveListToSheetAsync,
  saveListToSheetWithResultAsync,
} from './sheets'

const sheetName = 'Prizes'

export async function savePrizesAsync(prizes: Prize[]) {
  return saveListToSheetAsync(sheetName, prizes)
}

export async function savePrizesWithResultAsync(prizes: Prize[]) {
  return saveListToSheetWithResultAsync(sheetName, prizes)
}

export function getPrizesAsync(): Promise<Prize[]> {
  return getListFromSheetAsync(sheetName)
}

export function getPrizesAsResultAsync(): Promise<DataResult<Prize[]>> {
  return getListFromSheetAsResultAsync<Prize>(sheetName)
}
