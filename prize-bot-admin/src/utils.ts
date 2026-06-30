import { prizeTradeOfferState, type Player, type PrizeTradeOffer } from '@jf-prize-bot/schema'

export function isActiveTradeOffer(tradeOffer: PrizeTradeOffer) {
  return (
    tradeOffer.state === prizeTradeOfferState.unconfirmed ||
    tradeOffer.state === prizeTradeOfferState.confirmed
  )
}

export function getRanksSpans(player: Player) {
  return player.discordRanks
    .map((rank) => {
      const color = '#' + rank.color.toString(16).padStart(6, '0')
      return `<span style="color: ${color}" class="text-white font-bold">${rank.name}</span>`
    })
    .join('')
}
