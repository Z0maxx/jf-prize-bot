import type { EResult } from "steam-user"
import { z } from "zod"

export const tradeUrlRegex = /https?:\/\/steamcommunity\.com\/tradeoffer\/new\/\?partner=(\d+)&token=([a-zA-Z0-9_-]+)/

export const DiscordRankSchema = z.object({
  name: z.string().min(1),
  color: z.number()
})

export type DiscordRank = z.infer<typeof DiscordRankSchema>

export const PlayerSchema = z.object({
  tradeUrl: z.string().regex(tradeUrlRegex).optional().or(z.literal('')),
  discordId: z.string().min(1),
  discordFullName: z.string().min(1),
  discordRanks: z.array(DiscordRankSchema),
})

export type Player = z.infer<typeof PlayerSchema>

export const UniqueItemSchema = z.object({
  assetId: z.string(),
  nameParts: z.array(z.array(z.string())),
  iconUrl: z.httpUrl(),
  unusualIconUrl: z.httpUrl().optional(),
})

export type UniqueItem = z.infer<typeof UniqueItemSchema>

export const prizeTradeOfferState = {
  failed: 'failed',
  unconfirmed: 'unconfirmed',
  confirmed: 'confirmed',
  accepted: 'accepted',
  canceled: 'canceled',
  declined: 'declined',
  expired: 'expired',
  unknown: 'unknown'
} as const

export type PrizeTradeOfferState = keyof typeof prizeTradeOfferState

export const PrizeTradeOfferSchema = z.object({
  id: z.uuidv4(),
  tradeOfferId: z.string().optional(),
  discordId: PlayerSchema.shape.discordId,
  state: z.enum(Object.values(prizeTradeOfferState)),
  error: z.string().optional(),
  keys: z.number().optional(),
  items: z.array(UniqueItemSchema).optional()
})

export type PrizeTradeOffer = z.infer<typeof PrizeTradeOfferSchema>

export const PrizeSchema = z.object({
  discordId: PlayerSchema.shape.discordId,
  assetIds: z.array(z.string()),
  completedBountyIds: z.array(z.uuidv4()),
  keys: z.number().min(0),
})

export type Prize = z.infer<typeof PrizeSchema>

export const InventorySchema = z.object({
  keys: z.number().min(0),
  items: z.array(UniqueItemSchema)
})

export type Inventory = z.infer<typeof InventorySchema>

export const SteamCredentialsSchema = z.object({
  accountName: z.string().min(1),
  password: z.string().min(1)
})

export type SteamCredentials = z.infer<typeof SteamCredentialsSchema>

export const SteamGuardCodeSchema = z.object({
  steamGuardCode: z.string().length(5)
})

export type SteamGuardCode = z.infer<typeof SteamGuardCodeSchema>

export type SteamAuthActionResult = {
  success: boolean,
  error?: EResult | undefined
}

export type IsLoggedIn = {
  isLoggedIn: boolean
}

export const sendPrizesKnownError = {
  notEnoughAvailableKeys: 'notEnoughAvailableKeys',
  itemsNotFound: 'itemsNotFound',
  itemsInTradeOffer: 'itemsInTradeOffer',
  playersNotFound: 'playersNotFound',
  hasFailedTradeOffers: 'hasFailedTradeOffers',
} as const

export type Result = {
  success: boolean
  error?: string | undefined
}

export type SendPrizesResult = Result & {
  itemsNotFound?: string[] | undefined
  itemsInTradeOffer?: string[] | undefined
  playersNotFound?: string[] | undefined
  tradeOffers?: PrizeTradeOffer[] | undefined
  failedToSendPrizes?: Prize[] | undefined
}

export type ReloadResult = Result & {
  inventory?: Inventory | undefined
  tradeOffers?: PrizeTradeOffer[] | undefined
}

export const TradeOfferIdSchema = z.object({
  tradeOfferId: z.string().min(1)
})

export type TradeOfferId = z.infer<typeof TradeOfferIdSchema>

export const TradeOfferIdsSchema = z.object({
  tradeOfferIds: z.array(TradeOfferIdSchema.shape.tradeOfferId)
})

export type CancelTradeOfferResult = Result & {
  tradeOfferId?: string
  state?: PrizeTradeOfferState
}

export type CancelAllTradeOffersResult = Result & {
  cancelTradeOfferResults?: CancelTradeOfferResult[]
}

export type ClearTradeOfferHistoryResult = Result & {
  activeTradeOffers?: PrizeTradeOffer[] | undefined
}

export const BountyPrizeSchema = z.object({
  id: z.uuidv4(),
  name: z.string().min(1),
  keys: z.number().min(0)
})

export type BountyPrize = z.infer<typeof BountyPrizeSchema>

export const BountyPrizeGroupSchema = z.object({
  discordRank: DiscordRankSchema,
  bountyPrizes: z.array(BountyPrizeSchema)
})

export type BountyPrizeGroup = z.infer<typeof BountyPrizeGroupSchema>