import { Player } from '@jf-prize-bot/schema'

import { getPlayersFromDiscordAsync } from './discordInfo'
import { getListFromSheetAsync, saveListToSheetAsync } from './sheets'

const sheetName = 'Players'

export async function savePlayersAsync(players: Player[]) {
  await saveListToSheetAsync(sheetName, 'A', players)
}

export async function getPlayersAsync() {
  const savedPlayers = await getListFromSheetAsync<Player>(sheetName, 'A')
  const players = await getPlayersFromDiscordAsync(savedPlayers)
  const playerIds = new Set(players.map((player) => player.discordId))
  const playersNotOnServer = savedPlayers.filter(
    (savedPlayer) => !playerIds.has(savedPlayer.discordId),
  )
  return players.concat(playersNotOnServer)
}
