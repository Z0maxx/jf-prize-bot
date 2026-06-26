import { categoryNames } from "./inventory/categoryNames"
import { descriptionValues } from "./inventory/descriptionValues"
import { tagNames } from "./inventory/tagNames"

export type UniqueItem = {
  nameParts: string[][]
  assetId: number | string
  iconUrl: string
  unusualIconUrl?: string
}

export type CommonItem = {
  name: string
}

export type Tag = {
  localized_category_name: string
  localized_tag_name: string
}

export type Description = {
  value: string
  color: string
}

export type Item = {
  assetId: string
  classId: string
  name: string
  iconUrl: string
  market_hash_name: string
  tradable: boolean
  commodity: boolean
  tags: Tag[]
  descriptions?: Description[]
  fraudWarnings?: string[]
}

export type SkinName = {
  isWarPaint: boolean
  name: string
}

export type InventoryAsset = {
  assetid: string
  classid: string
}

export type InventoryDescription = {
  tradable: number
  commodity: number
  classid: string
  name: string
  icon_url: string
  market_hash_name: string
  tags: Tag[]
  descriptions?: Description[]
  fraudwarnings?: string[]
}

export type InventoryResponse = {
  assets: InventoryAsset[]
  descriptions: InventoryDescription[]
  more_items?: number
  last_assetid?: string
}

export type Inventory = {
  keys: number,
  items: UniqueItem[]
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

export type TournamentInfo = {
  players: Player[]
  prizes: Prize[]
}

export type CategoryName = (typeof categoryNames)[keyof typeof categoryNames]

export type TagName = (typeof tagNames)[keyof typeof tagNames]

export type DescriptionValue = (typeof descriptionValues)[keyof typeof descriptionValues]