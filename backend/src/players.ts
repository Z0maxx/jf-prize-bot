import { DiscordRank, Player } from "@jf-prize-bot/schema";
import { getListFromSheetAsync, saveListToSheetAsync } from "./sheets";
import { DiscordMember, DiscordRanks, DiscordRole } from "./types";

const sheetName = 'Players'
const botToken = process.env.DISCORD_BOT_TOKEN
const apiUrl = `https://discord.com/api/v9/guilds/${process.env.DISCORD_GUILD_ID}/`

export async function savePlayersAsync(players: Player[]) {
  await saveListToSheetAsync(sheetName, 'A', players)
}

export async function getSavedPlayersAsync() {
  return await getListFromSheetAsync<Player>(sheetName, 'A')
}

export async function getPlayersAsync() {
  const savedPlayers = await getListFromSheetAsync<Player>(sheetName, 'A')
  const ranks = await getDiscordRanksAsync()
  const players = await getPlayersFromDiscordAsync(ranks, savedPlayers)
  const playerIds = new Set(players.map(player => player.discordId))
  const playersNotOnServer = savedPlayers.filter(savedPlayer => !playerIds.has(savedPlayer.discordId))
  return players.concat(playersNotOnServer)
}

async function getPlayersFromDiscordAsync(ranks: DiscordRanks, savedPlayers: Player[]) {
  let hasMore = false
  let lastId: string | null = null
  const players: Player[] = []
  do {
    const currentUrl = `${apiUrl}/members?limit=1000${lastId ? '&after=' + lastId : ''}`
    const response = await fetch(currentUrl, {
      headers: { Authorization: 'Bot ' + botToken }
    })

    if (!response.ok) {
      break
    }

    const newMembers = await response.json() as DiscordMember[]
    const newPlayers = newMembers.filter(member => member.roles
      .some(roleId => ranks.has(roleId)))
      .map(member => {
        const discordRanks = member.roles
          .filter(roleId => ranks.has(roleId))
          .map(roleId => ranks.get(roleId)!)

        return {
          discordId: member.user.id,
          discordFullName: `${member.user.global_name} (${member.user.username})`,
          tradeUrl: savedPlayers.find(player => player.discordId === member.user.id)?.tradeUrl,
          discordRanks
        } as Player
      })

    players.push(...newPlayers)

    lastId = newMembers[newMembers.length - 1]!.user.id

    if (newMembers.length < 1000) {
      hasMore = false
    }
  } while (hasMore)

  return players.toSorted((a, b) => a.discordFullName.localeCompare(b.discordFullName))
}

async function getDiscordRanksAsync() {
  const response = await fetch(apiUrl + '/roles', {
    headers: { Authorization: 'Bot ' + botToken }
  })

  if (!response.ok) {
    return new Map<string, DiscordRank>([])
  }

  const roles = await response.json() as DiscordRole[]
  return new Map<string, DiscordRank>(roles
    .filter(role => role.name.endsWith('Soldier') || role.name.endsWith('Demo'))
    .map(role => [role.id, { name: role.name, color: role.color }])
  )
}