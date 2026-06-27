import { z } from "zod"

export const tradeUrlRegex = /https?:\/\/steamcommunity\.com\/tradeoffer\/new\/\?partner=(\d+)&token=([a-zA-Z0-9_-]+)/
export const PlayerSchema = z.object({
  name: z.string().min(1),
  tradeUrl: z.string().regex(tradeUrlRegex)
})

export type Player = z.infer<typeof PlayerSchema>

export const PrizeSchema = z.object({
  player: PlayerSchema,
  keys: z.number().min(0),
  assetIds: z.array(z.string())
})

export type Prize = z.infer<typeof PrizeSchema>

export const UniqueItemSchema = z.object({
  assetId: z.string(),
  nameParts: z.array(z.array(z.string())),
  iconUrl: z.httpUrl(),
  unusualIconUrl: z.httpUrl().optional()
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