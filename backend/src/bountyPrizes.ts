import { BountyPrizeGroup } from '@jf-prize-bot/schema'

import { getDiscordRanksAsync } from './discordInfo'
import { getListFromSheetAsync, saveListToSheetAsync } from './sheets'

const sheetName = 'BountyPrizeGroups'
export async function saveBountyPrizeGroupsAsync(bountyPrizeGroups: BountyPrizeGroup[]) {
  saveListToSheetAsync(sheetName, 'A', bountyPrizeGroups)
}

export async function getBountyPrizeGroupsAsync(): Promise<BountyPrizeGroup[]> {
  const savedBountyPrizeGroups = await getListFromSheetAsync<BountyPrizeGroup>(sheetName, 'A')
  const ranks = await getDiscordRanksAsync()
  return ranks.map((rank) => ({
    discordRank: rank,
    bountyPrizes: savedBountyPrizeGroups.find((prize) => prize.discordRank.name === rank.name)?.bountyPrizes ?? [],
  }))
}
