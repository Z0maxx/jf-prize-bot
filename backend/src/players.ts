import { getListFromSheetAsync, saveListToSheetAsync, sheets, spreadsheetId } from "./sheets";
import { Player } from "./types";

export async function savePlayersAsync(players: Player[]) {
  await saveListToSheetAsync('Players', 'A', players)
}

export async function getPlayersAsync(): Promise<Player[]> {
  return getListFromSheetAsync<Player>('Players', 'A')
}