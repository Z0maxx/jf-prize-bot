import { Player } from "@jf-prize-bot/schema";
import { getListFromSheetAsync, saveListToSheetAsync } from "./sheets";

const sheetName = 'Players'
export async function savePlayersAsync(players: Player[]) {
  await saveListToSheetAsync(sheetName, 'A', players)
}

export async function getPlayersAsync(): Promise<Player[]> {
  return getListFromSheetAsync<Player>(sheetName, 'A')
}