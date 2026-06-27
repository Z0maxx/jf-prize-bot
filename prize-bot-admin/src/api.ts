import type { Inventory, Player, Prize } from '@jf-prize-bot/schema'

const url = 'http://localhost:6520'

async function get<T>(endpoint: string) {
  const resp = await fetch(url + endpoint)
  if (resp.status === 503) {
    throw new Error('Steam is having issues')
  }

  return (await resp.json()) as T
}

async function post(endpoint: string, value: any) {
  await fetch(url + endpoint, {
    method: 'POST',
    body: JSON.stringify(value),
    headers: {
      'Content-Type': 'application/json',
    },
  })
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
}
