import { DataResult, Player } from '@jf-prize-bot/schema'

import { getPlayersFromDiscordAsync } from './discordInfo'
import {
  getListFromSheetAsync,
  saveListToSheetAsync,
  saveListToSheetWithResultAsync,
} from './sheets'
import { getDataResult, getErrorResult } from './utils'

const sheetName = 'Players'

export function savePlayersAsync(players: Player[]) {
  return saveListToSheetAsync(sheetName, players)
}

export function savePlayersWithResultAsync(players: Player[]) {
  return saveListToSheetWithResultAsync(sheetName, players)
}

export async function getPlayersAsync(): Promise<Player[]> {
  const savedPlayers = await getListFromSheetAsync<Player>(sheetName)
  const players = await getPlayersFromDiscordAsync(savedPlayers)
  const playerIds = new Set(players.map((player) => player.discordId))
  const playersNotOnServer = savedPlayers.filter(
    (savedPlayer) => !playerIds.has(savedPlayer.discordId),
  )

  return players.concat(playersNotOnServer)
}

export async function getPlayersAsResultAsync(): Promise<DataResult<Player[]>> {
  try {
    return getDataResult(await getPlayersAsync())
  } catch (err) {
    return getErrorResult(err)
  }
}
