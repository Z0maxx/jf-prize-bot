import { BountyGroup, DataResult } from '@jf-prize-bot/schema'

import { getDiscordRanksAsync } from './discordInfo'
import { getListFromSheetAsync, saveListToSheetWithResultAsync } from './sheets'
import { getDataResult, getErrorResult } from './utils'

const sheetName = 'BountyGroups'

export function saveBountyGroupsWithResultAsync(bountyGroups: BountyGroup[]) {
  return saveListToSheetWithResultAsync(sheetName, bountyGroups)
}

export async function getBountyGroupsAsResultAsync(): Promise<DataResult<BountyGroup[]>> {
  try {
    const savedBountyGroups = await getListFromSheetAsync<BountyGroup>(sheetName)
    const ranks = await getDiscordRanksAsync()
    const bountyGrops = ranks.map((rank) => ({
      discordRank: rank,
      bounties:
        savedBountyGroups.find((prize) => prize.discordRank.name === rank.name)?.bounties ?? [],
    }))

    return getDataResult(bountyGrops)
  } catch (err) {
    return getErrorResult(err)
  }
}
