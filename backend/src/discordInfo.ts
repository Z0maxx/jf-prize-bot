import { DiscordRank, Player } from '@jf-prize-bot/schema'

import { DiscordMember, DiscordRole } from './types'

const botToken = process.env.DISCORD_BOT_TOKEN
const apiUrl = `https://discord.com/api/v9/guilds/${process.env.DISCORD_GUILD_ID}/`
let ranksCache: DiscordRole[] | undefined
let lastFetchedRanks: number | undefined

export async function getDiscordRanksAsync() {
  const now = new Date()
  if (lastFetchedRanks && (now.valueOf() - lastFetchedRanks) / 1000 < 60) {
    return ranksCache!
  }

  const response = await fetch(apiUrl + '/roles', {
    headers: { Authorization: 'Bot ' + botToken },
  })

  if (!response.ok) {
    return []
  }

  const roles = (await response.json()) as DiscordRole[]
  const ranks = roles.filter((role) => role.name.endsWith('Soldier') || role.name.endsWith('Demo'))
  lastFetchedRanks = now.valueOf()
  ranksCache = ranks
  return ranks
}

export async function getPlayersFromDiscordAsync(savedPlayers: Player[]) {
  const ranks = await getDiscordRanksAsync()
  const ranksMap = new Map<string, DiscordRank>(
    ranks.map((rank) => [
      rank.id,
      {
        name: rank.name,
        color: rank.color,
      },
    ]),
  )

  let hasMore = false
  let lastId: string | null = null
  const players: Player[] = []
  do {
    const currentUrl = `${apiUrl}/members?limit=1000${lastId ? '&after=' + lastId : ''}`
    const response = await fetch(currentUrl, {
      headers: { Authorization: 'Bot ' + botToken },
    })

    if (!response.ok) {
      break
    }

    const newMembers = (await response.json()) as DiscordMember[]
    const newPlayers = newMembers
      .filter((member) => member.roles.some((roleId) => ranksMap.has(roleId)))
      .map((member) => {
        const discordRanks = member.roles
          .filter((roleId) => ranksMap.has(roleId))
          .map((roleId) => ranksMap.get(roleId)!)

        return {
          discordId: member.user.id,
          discordFullName: `${member.user.global_name} (${member.user.username})`,
          tradeUrl: savedPlayers.find((player) => player.discordId === member.user.id)?.tradeUrl,
          discordRanks,
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
