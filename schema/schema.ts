//@ts-ignore
import EResult from "steam-user/enums/EResult"
import { z } from "zod"

export const tradeUrlRegex = /https?:\/\/steamcommunity\.com\/tradeoffer\/new\/\?partner=(\d+)&token=([a-zA-Z0-9_-]+)/
export const PlayerSchema = z.object({
  name: z.string().min(1),
  tradeUrl: z.string().regex(tradeUrlRegex)
})

export type Player = z.infer<typeof PlayerSchema>

export const tradeOfferStatus = {
  failed: 'failed',
  unconfirmed: 'unconfirmed',
  confirmed: 'confirmed',
  accepted: 'accepted'
}

export type TradeOfferStatus = keyof typeof tradeOfferStatus

export const PrizeTradeOfferSchema = z.object({
  id: z.string().optional(),
  status: z.enum(Object.values(tradeOfferStatus)),
  error: z.string().optional()
})

export type PrizeTradeOffer = z.infer<typeof PrizeTradeOfferSchema>

export const PrizeSchema = z.object({
  player: PlayerSchema,
  keys: z.number().min(0),
  assetIds: z.array(z.string()),
  tradeOffer: PrizeTradeOfferSchema.optional()
})

export type Prize = z.infer<typeof PrizeSchema>

export const UniqueItemSchema = z.object({
  assetId: z.string(),
  nameParts: z.array(z.array(z.string())),
  iconUrl: z.httpUrl(),
  unusualIconUrl: z.httpUrl().optional(),
})

export type UniqueItem = z.infer<typeof UniqueItemSchema>

export const InventorySchema = z.object({
  keys: z.number().min(0),
  items: z.array(UniqueItemSchema)
})

export type Inventory = z.infer<typeof InventorySchema>

export const DiscordUserSchema = z.object({
  discordid: z.string()
})

export const SteamCredentialsSchema = z.object({
  accountName: z.string().min(1),
  password: z.string().min(1)
})

export type SteamCredentials = z.infer<typeof SteamCredentialsSchema>

export const SteamGuardCodeSchema = z.object({
  steamGuardCode: z.string().min(5)
})

export type SteamGuardCode = z.infer<typeof SteamGuardCodeSchema>

export const SteamAuthActionResultSchema = z.object({
  success: z.boolean(),
  error: z.enum(EResult).optional()
})

export type SteamAuthActionResult = z.infer<typeof SteamAuthActionResultSchema>

export type IsLoggedIn = {
  isLoggedIn: boolean
}

export const sendPrizesKnownError = {
  notEnoughKeys: 'notEnoughKeys',
  itemsNotFound: 'itemsNotFound',
  errorsWithTradeOffer: 'errorsWithTradeOffer',
  notLoggedIn: 'notLoggedIn'
} as const

export const SendPrizesResultSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  itemsNotFound: z.array(z.string()).optional(),
  errorsWithTradeOffer: z.array(z.string()).optional(),
  prizesWithTradeOffers: z.array(PrizeSchema).optional()
})

export type SendPrizesResult = z.infer<typeof SendPrizesResultSchema>