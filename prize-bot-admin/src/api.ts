import { useSnackbarStore } from './stores/snackbar'

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

let url = ''
let hadNetworkError = false

async function fetchWithError<T>(...args: Parameters<typeof fetch>): Promise<T> {
  const resp = await fetch(...args)
  if (!resp.ok) {
    const err = new Error(await resp.text())
    throw err
  } else {
    return (await resp.json()) as T
  }
}

async function fetchWithAlert<T>(...args: Parameters<typeof fetch>) {
  const { error } = useSnackbarStore()
  try {
    return await fetchWithError<T>(...args)
  } catch (err) {
    const message = (err as Error).message
    if (message !== 'Failed to fetch') {
      error(message)
    } else if (!hadNetworkError) {
      error('Network error')
      hadNetworkError = true
    }

    throw err
  }
}

async function get<T>(endpoint: string) {
  return await fetchWithAlert<T>(url + endpoint)
}

async function dataResultGet<T>(endpoint: string) {
  return fetchWithAlert<DataResult<T>>(url + endpoint)
}

async function authPost(endpoint: string, value?: any) {
  return post<SteamAuthActionResult>(endpoint, value)
}

async function post<T>(endpoint: string, value?: any) {
  return fetchWithAlert<T>(url + endpoint, {
    method: 'POST',
    body: value ? JSON.stringify(value) : undefined,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

async function resultPost(endpoint: string, value?: any) {
  return post<Result>(endpoint, value)
}

export const api = {
  useUrl(newUrl: string) {
    url = newUrl
  },

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
