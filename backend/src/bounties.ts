import { BountyGroup } from '@jf-prize-bot/schema'

import { getDiscordRanksAsync } from './discordInfo'
import { getListFromSheetAsync, saveListToSheetAsync } from './sheets'

const sheetName = 'BountyGroups'
export async function saveBountyGroupsAsync(bountyGroups: BountyGroup[]) {
  saveListToSheetAsync(sheetName, 'A', bountyGroups)
}

export async function getBountyGroupsAsync(): Promise<BountyGroup[]> {
  const savedBountyGroups = await getListFromSheetAsync<BountyGroup>(sheetName, 'A')
  const ranks = await getDiscordRanksAsync()
  return ranks.map((rank) => ({
    discordRank: rank,
    bounties:
      savedBountyGroups.find((prize) => prize.discordRank.name === rank.name)?.bounties ?? [],
  }))
}
