import {
  BountyGroup,
  BountyGroupSchema,
  Player,
  PlayerSchema,
  Prize,
  PrizeSchema,
  Result,
  sendPrizesKnownError,
  SteamAuthActionResult,
  SteamCredentials,
  SteamCredentialsSchema,
  SteamGuardCode,
  SteamGuardCodeSchema,
  TradeOfferIdSchema,
} from '@jf-prize-bot/schema'
import express from 'express'
import 'dotenv/config'
import { z } from 'zod'

import { getBountyGroupsAsResultAsync, saveBountyGroupsWithResultAsync } from './bounties'
import {
  getInventoryAsResultAsync,
  getInventoryAsync,
  reloadInventoryAsync,
} from './inventory/inventory'
import { getPlayersAsResultAsync, getPlayersAsync, savePlayersWithResultAsync } from './players'
import {
  getPrizesAsResultAsync,
  getPrizesAsync,
  savePrizesAsync,
  savePrizesWithResultAsync,
} from './prizes'
import {
  cancelAllPrizeTradeOffersAsync,
  cancelPrizeTradeOfferAsync,
  clearTradeOfferHistoryAsync,
  isLoggedIn,
  logInAsync,
  sendPrizesAsync,
  setSteamGuardCodeAsync,
  updatePrizeTradeOfferStatesAsync,
} from './steamActions'
import {
  getTradeOffersAsResultAsync,
  getTradeOffersAsync,
  saveTradeOffersAsync,
} from './tradeOffers'
import { getErrorResult } from './utils'

import type { Request, Response } from 'express'
import type { ParsedQs } from 'qs'

const PrizesSchema = z.array(PrizeSchema)
const PlayersSchema = z.array(PlayerSchema)
const BountyGroupsSchema = z.array(BountyGroupSchema)
const TradeOfferIdsSchema = z.array(TradeOfferIdSchema.shape.tradeOfferId)

const app = express()
app.use(express.json({ limit: '1000mb' }))

app.use(function (_, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})

app.get('/inventory', async (_, res) => {
  res.status(200).json(await getInventoryAsResultAsync())
})

app.get('/reload', async (_, res) => {
  if (!isLoggedIn()) {
    res.status(401).send()
    return
  }

  resWithTryCatch(res, async () => {
    const inventory = await reloadInventoryAsync()
    const tradeOffers = await getTradeOffersAsync()
    const result = await updatePrizeTradeOfferStatesAsync(tradeOffers)
    if (!result.success) {
      return result
    }

    await saveTradeOffersAsync(tradeOffers)
    return {
      success: true,
      inventory,
      tradeOffers,
    }
  })
})

app.get('/players', async (_, res) => {
  res.status(200).json(await getPlayersAsResultAsync())
})

app.get('/prizes', async (_, res) => {
  res.status(200).json(await getPrizesAsResultAsync())
})

app.get('/trade-offers', async (_, res) => {
  res.status(200).json(await getTradeOffersAsResultAsync())
})

app.get('/bounty-groups', async (_, res) => {
  res.status(200).json(await getBountyGroupsAsResultAsync())
})

app.get('/is-logged-in', async (_, res) => {
  res.status(200).json({ isLoggedIn: isLoggedIn() })
})

app.post('/players', async (req, res) => {
  resWithParse<Player[]>(req, res, PlayersSchema, (players) => {
    return savePlayersWithResultAsync(players)
  })
})

app.post('/prizes', async (req, res) => {
  resWithParse<Prize[]>(req, res, PrizesSchema, (prizes) => {
    return savePrizesWithResultAsync(prizes)
  })
})

app.post('/bounty-groups', async (req, res) => {
  resWithParse<BountyGroup[]>(req, res, BountyGroupsSchema, (groups) => {
    return saveBountyGroupsWithResultAsync(groups)
  })
})

app.post('/login', async (req, res) => {
  resWithParse<SteamCredentials>(req, res, SteamCredentialsSchema, (creds) => {
    return logInAsync(creds)
  })
})

app.post('/steam-guard-code', async (req, res) => {
  resWithParse<SteamGuardCode>(req, res, SteamGuardCodeSchema, ({ steamGuardCode }) => {
    return setSteamGuardCodeAsync(steamGuardCode)
  })
})

app.post('/send-prizes', async (_, res) => {
  if (!isLoggedIn()) {
    res.status(401).json()
    return
  }

  resWithTryCatch(res, async () => {
    const players = await getPlayersAsync()
    const prizes = await getPrizesAsync()
    const inventory = await getInventoryAsync()
    const result = await sendPrizesAsync(players, prizes, inventory.items)
    if (result.success) {
      await savePrizesAsync([])
    } else if (result.error === sendPrizesKnownError.hasFailedTradeOffers) {
      await savePrizesAsync(result.failedToSendPrizes!)
    }

    if (result.tradeOffers) {
      const storedOffers = await getTradeOffersAsync()
      result.tradeOffers = storedOffers.concat(result.tradeOffers)
      await saveTradeOffersAsync(result.tradeOffers)
    }

    return result
  })
})

app.post('/cancel-trade-offer', async (req, res) => {
  if (!isLoggedIn()) {
    res.status(401).send()
    return
  }

  resWithParse<{ tradeOfferId: string }>(req, res, TradeOfferIdSchema, async ({ tradeOfferId }) =>
    withTryCatch(async () => {
      const result = await cancelPrizeTradeOfferAsync(tradeOfferId)
      if (result.success) {
        const tradeOffers = await getTradeOffersAsync()
        tradeOffers.find((offer) => offer.tradeOfferId === tradeOfferId)!.state = result.state!
        await saveTradeOffersAsync(tradeOffers)
      }

      return result
    }),
  )
})

app.post('/cancel-all-trade-offers', async (req, res) => {
  if (!isLoggedIn()) {
    res.status(401).send()
    return
  }

  resWithParse<string[]>(req, res, TradeOfferIdsSchema, async (tradeOfferIds) =>
    withTryCatch(async () => {
      const result = await cancelAllPrizeTradeOffersAsync(tradeOfferIds)
      if (result.success) {
        const tradeOffers = await getTradeOffersAsync()
        result.cancelTradeOfferResults!.forEach((result) => {
          tradeOffers.find((offer) => offer.tradeOfferId === result.tradeOfferId)!.state =
            result.state!
        })

        await saveTradeOffersAsync(tradeOffers)
      }

      return result
    }),
  )
})

app.post('/clear-trade-offer-history', async (_, res) => {
  resWithTryCatch(res, async () => {
    const tradeOffers = await getTradeOffersAsync()
    const result = await clearTradeOfferHistoryAsync(tradeOffers)
    if (result.success) {
      await saveTradeOffersAsync(result.activeTradeOffers!)
    }

    return result
  })
})

app.listen(6520, (err) => console.log(err ?? 'Running'))

async function resWithParse<T>(
  req: Request<{}, any, any, ParsedQs, Record<string, any>>,
  res: Response<any, Record<string, any>>,
  schema: z.ZodArray | z.ZodObject,
  callback: (data: T) => Promise<Result | SteamAuthActionResult>,
) {
  const parsed = schema.safeParse(req.body)
  if (parsed.success) {
    res.status(200).json(await callback(parsed.data as T))
  } else {
    res.status(400).json(parsed.error)
  }
}

async function withTryCatch(callback: () => Promise<Result>) {
  try {
    return await callback()
  } catch (err) {
    return getErrorResult(err)
  }
}

async function resWithTryCatch(
  res: Response<any, Record<string, any>>,
  callback: () => Promise<Result>,
) {
  try {
    res.status(200).json(await callback())
  } catch (err) {
    res.status(200).send(getErrorResult(err))
  }
}
