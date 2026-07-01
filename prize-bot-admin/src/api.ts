import type {
  BountyPrize,
  BountyPrizeGroup,
  CancelAllTradeOffersResult,
  CancelTradeOfferResult,
  ClearTradeOfferHistoryResult,
  Inventory,
  IsLoggedIn,
  Player,
  Prize,
  PrizeTradeOffer,
  ReloadResult,
  SendPrizesResult,
  SteamAuthActionResult,
  SteamCredentials,
  SteamGuardCode,
} from '@jf-prize-bot/schema'

const url = 'http://localhost:6520'

async function get<T>(endpoint: string) {
  const resp = await fetch(url + endpoint)
  if (resp.status === 503) {
    throw new Error('Steam is having issues')
  } else if (resp.status !== 200) {
    throw new Error(await resp.text())
  }

  return (await resp.json()) as T
}

async function post(endpoint: string, value?: any) {
  await fetch(url + endpoint, {
    method: 'POST',
    body: value ? JSON.stringify(value) : undefined,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

async function postWithResult<T>(endpoint: string, value?: any) {
  const resp = await fetch(url + endpoint, {
    method: 'POST',
    body: value ? JSON.stringify(value) : undefined,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  return (await resp.json()) as T
}

export const api = {
  reload() {
    return get<ReloadResult>('/reload')
  },

  getInventory() {
    return get<Inventory>('/inventory')
  },

  getPlayers() {
    return get<Player[]>('/players')
  },

  getPrizes() {
    return get<Prize[]>('/prizes')
  },

  getTradeOffers() {
    return get<PrizeTradeOffer[]>('/trade-offers')
  },

  getBountyPrizeGroups() {
    return get<BountyPrizeGroup[]>('/bounty-prize-groups')
  },

  savePlayers(players: Player[]) {
    return post('/players', players)
  },

  savePrizes(prizes: Prize[]) {
    return post('/prizes', prizes)
  },

  saveBountyPrizeGroups(bountyPrizeGroups: BountyPrizeGroup[]) {
    return post('/bounty-prize-groups', bountyPrizeGroups)
  },

  login(credentails: SteamCredentials) {
    return postWithResult<SteamAuthActionResult>('/login', credentails)
  },

  async isLoggedIn() {
    return (await get<IsLoggedIn>('/is-logged-in')).isLoggedIn
  },

  sendSteamGuardCode(steamGuardCode: SteamGuardCode) {
    return postWithResult<SteamAuthActionResult>('/steam-guard-code', steamGuardCode)
  },

  sendPrizes() {
    return postWithResult<SendPrizesResult>('/send-prizes')
  },

  cancelTradeOffer(tradeOffer: PrizeTradeOffer) {
    return postWithResult<CancelTradeOfferResult>('/cancel-trade-offer', {
      tradeOfferId: tradeOffer.tradeOfferId!,
    })
  },

  cancelAllTradeOffers(tradeOffers: PrizeTradeOffer[]) {
    return postWithResult<CancelAllTradeOffersResult>('/cancel-all-trade-offers', {
      tradeOfferIds: tradeOffers.map((offer) => offer.tradeOfferId!),
    })
  },

  clearTradeOfferHistory() {
    return postWithResult<ClearTradeOfferHistoryResult>('/clear-trade-offer-history')
  },
}
