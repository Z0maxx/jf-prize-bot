import type {
  BountyGroup,
  CancelAllTradeOffersResult,
  CancelTradeOfferResult,
  ClearTradeOfferHistoryResult,
  DataResult,
  Inventory,
  IsLoggedIn,
  Player,
  Prize,
  PrizeTradeOffer,
  ReloadResult,
  Result,
  SendPrizesResult,
  SteamAuthActionResult,
  SteamCredentials,
  SteamGuardCode,
} from '@jf-prize-bot/schema'

const url = 'http://localhost:6520'

async function get<T>(endpoint: string) {
  const resp = await fetch(url + endpoint)
  return (await resp.json()) as T
}

async function dataResultGet<T>(endpoint: string) {
  const resp = await fetch(url + endpoint)
  return (await resp.json()) as DataResult<T>
}

async function authPost(endpoint: string, value?: any) {
  const resp = await fetch(url + endpoint, {
    method: 'POST',
    body: value ? JSON.stringify(value) : undefined,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  return (await resp.json()) as SteamAuthActionResult
}

async function post<T>(endpoint: string, value?: any) {
  const resp = await fetch(url + endpoint, {
    method: 'POST',
    body: value ? JSON.stringify(value) : undefined,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  return (await resp.json()) as T
}

async function resultPost(endpoint: string, value?: any) {
  const resp = await fetch(url + endpoint, {
    method: 'POST',
    body: value ? JSON.stringify(value) : undefined,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  return (await resp.json()) as Result
}

async function dataResultPost<T>(endpoint: string, value?: any) {
  const resp = await fetch(url + endpoint, {
    method: 'POST',
    body: value ? JSON.stringify(value) : undefined,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  return (await resp.json()) as DataResult<T>
}

export const api = {
  reload() {
    return get<ReloadResult>('/reload')
  },

  getInventory() {
    return dataResultGet<Inventory>('/inventory')
  },

  getPlayers() {
    return dataResultGet<Player[]>('/players')
  },

  getPrizes() {
    return dataResultGet<Prize[]>('/prizes')
  },

  getTradeOffers() {
    return dataResultGet<PrizeTradeOffer[]>('/trade-offers')
  },

  getBountyGroups() {
    return dataResultGet<BountyGroup[]>('/bounty-groups')
  },

  savePlayers(players: Player[]) {
    return resultPost('/players', players)
  },

  savePrizes(prizes: Prize[]) {
    return resultPost('/prizes', prizes)
  },

  saveBountyGroups(bountyGroups: BountyGroup[]) {
    return resultPost('/bounty-groups', bountyGroups)
  },

  login(credentails: SteamCredentials) {
    return authPost('/login', credentails)
  },

  sendSteamGuardCode(steamGuardCode: SteamGuardCode) {
    return authPost('/steam-guard-code', steamGuardCode)
  },

  async isLoggedIn() {
    return (await get<IsLoggedIn>('/is-logged-in')).isLoggedIn
  },

  sendPrizes() {
    return post<SendPrizesResult>('/send-prizes')
  },

  cancelTradeOffer(tradeOffer: PrizeTradeOffer) {
    return post<CancelTradeOfferResult>('/cancel-trade-offer', {
      tradeOfferId: tradeOffer.tradeOfferId!,
    })
  },

  cancelAllTradeOffers(tradeOffers: PrizeTradeOffer[]) {
    return post<CancelAllTradeOffersResult>(
      '/cancel-all-trade-offers',
      tradeOffers.map((offer) => offer.tradeOfferId!),
    )
  },

  clearTradeOfferHistory() {
    return post<ClearTradeOfferHistoryResult>('/clear-trade-offer-history')
  },
}
