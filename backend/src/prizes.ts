import { getListFromSheetAsync, saveListToSheetAsync, sheets, spreadsheetId } from "./sheets";
import { Prize } from "./types";

export async function savePrizesAsync(prizes: Prize[]) {
  saveListToSheetAsync('Prizes', 'A', prizes)
}

export async function getPrizesAsync(): Promise<Prize[]> {
  return getListFromSheetAsync<Prize>('Prizes', 'A')
}