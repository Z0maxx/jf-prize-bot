import {
  prizeTradeOfferState,
  type DiscordRank,
  type Player,
  type PrizeTradeOffer,
} from '@jf-prize-bot/schema'

export function isActiveTradeOffer(tradeOffer: PrizeTradeOffer) {
  return (
    tradeOffer.state === prizeTradeOfferState.unconfirmed ||
    tradeOffer.state === prizeTradeOfferState.confirmed
  )
}

export function getRankColorHex(rank: DiscordRank) {
  return '#' + rank.color.toString(16).padStart(6, '0')
}

export function getRanksSpans(player: Player) {
  return player.discordRanks
    .map((rank) => {
      return `<span style="color: ${getRankColorHex(rank)}" class="text-white font-bold">${rank.name}</span>`
    })
    .join('')
}
