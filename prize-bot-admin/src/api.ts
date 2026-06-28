import type { Inventory, IsLoggedIn, Player, Prize, SendPrizesResult, SteamAuthActionResult, SteamCredentials, SteamGuardCode } from '@jf-prize-bot/schema'

const url = 'http://localhost:6520'

async function get<T>(endpoint: string) {
  const resp = await fetch(url + endpoint)
  if (resp.status === 503) {
    throw new Error('Steam is having issues')
  }
  else if (resp.status !== 200) {
    throw new Error(await resp.text())
  }

  return (await resp.json()) as T
}

async function post(endpoint: string, value: any) {
  await fetch(url + endpoint, {
    method: 'POST',
    body: value ? JSON.stringify(value) : undefined,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

async function postWithResult<T>(endpoint: string, value: any) {
  const resp = await fetch(url + endpoint, {
    method: 'POST',
    body: value ? JSON.stringify(value) : undefined,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (resp.status === 503) {
    throw new Error('Steam is having issues')
  }
  else if (resp.status !== 200) {
    throw new Error(await resp.text())
  }

  return (await resp.json()) as T
}

export const api = {
  async reloadBotInventory() {
    return get<Inventory>('/reload-bot-inventory')
  },

  async getBotInventory() {
    return get<Inventory>('/bot-inventory')
  },

  async getPlayers() {
    return get<Player[]>('/players')
  },

  async getPrizes() {
    return get<Prize[]>('/prizes')
  },

  async savePlayers(players: Player[]) {
    return post('/players', players)
  },

  async savePrizes(prizes: Prize[]) {
    return post('/prizes', prizes)
  },

  async login(credentails: SteamCredentials) {
    return postWithResult<SteamAuthActionResult>('/login', credentails)
  },

  async isLoggedIn() {
    return (await get<IsLoggedIn>('/is-logged-in')).isLoggedIn
  },

  async sendSteamGuardCode(steamGuardCode: SteamGuardCode) {
    return postWithResult<SteamAuthActionResult>('/steam-guard-code', steamGuardCode)
  },

  async sendPrizes() {
    return postWithResult<SendPrizesResult>('/send-prizes', null)
  }
}
