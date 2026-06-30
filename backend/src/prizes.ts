import { Prize } from '@jf-prize-bot/schema'

import { getListFromSheetAsync, saveListToSheetAsync } from './sheets'

const sheetName = 'Prizes'
export async function savePrizesAsync(prizes: Prize[]) {
  saveListToSheetAsync(sheetName, 'A', prizes)
}

export async function getPrizesAsync(): Promise<Prize[]> {
  return getListFromSheetAsync<Prize>(sheetName, 'A')
}
