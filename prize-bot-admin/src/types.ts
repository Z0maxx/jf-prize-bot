export type Item = {
  assetId: string
  nameParts: string[][]
  iconUrl: string
  unusualIconUrl?: string
}

export type Inventory = {
  keys: number
  items: Item[]
}

export type Player = {
  tradeUrl: string
  name: string
}

export type Prize = {
  player: Player
  assetIds: string[]
  keys: number
}
