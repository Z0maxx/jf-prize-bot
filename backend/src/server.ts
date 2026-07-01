import {
  BountyPrizeGroupSchema,
  PlayerSchema,
  PrizeSchema,
  sendPrizesKnownError,
  SteamCredentialsSchema,
  SteamGuardCodeSchema,
  TradeOfferIdSchema,
  TradeOfferIdsSchema,
} from '@jf-prize-bot/schema'
import express from 'express'
import 'dotenv/config'
import { z } from 'zod'

import { getInventoryAsync, reloadInventoryAsync } from './inventory/inventory'
import { getPlayersAsync, savePlayersAsync } from './players'
import { getPrizesAsync, savePrizesAsync } from './prizes'
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
import { getTradeOffersAsync, saveTradeOffersAsync } from './tradeOffers'
import { getBountyPrizeGroupsAsync, saveBountyPrizeGroupsAsync } from './bountyPrizes'

const PrizesSchema = z.array(PrizeSchema)
const PlayersSchema = z.array(PlayerSchema)
const BountyPrizeGroupsSchema = z.array(BountyPrizeGroupSchema)

const app = express()
app.use(express.json({ limit: '1000mb' }))

app.use(function (_, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})

app.get('/inventory', async (_, res) => {
  res.status(200).json(await getInventoryAsync())
})

app.get('/reload', async (_, res) => {
  if (!isLoggedIn()) {
    res.status(401).send()
    return
  }

  try {
    const inventory = await reloadInventoryAsync()
    const tradeOffers = await getTradeOffersAsync()
    const result = await updatePrizeTradeOfferStatesAsync(tradeOffers)
    if (!result.success) {
      res.status(200).send(result)
      return
    }

    await saveTradeOffersAsync(tradeOffers)
    res.status(200).json({
      success: true,
      inventory,
      tradeOffers,
    })
  } catch {
    res.status(200).send({
      success: false,
      error: 'Steam is overloaded',
    })
  }
})

app.get('/players', async (_, res) => {
  res.status(200).json(await getPlayersAsync())
})

app.get('/prizes', async (_, res) => {
  res.status(200).json(await getPrizesAsync())
})

app.get('/trade-offers', async (_, res) => {
  res.status(200).send(await getTradeOffersAsync())
})

app.get('/bounty-prize-groups', async (_, res) => {
  res.status(200).send(await getBountyPrizeGroupsAsync())
})

app.get('/is-logged-in', async (_, res) => {
  res.status(200).json({ isLoggedIn: isLoggedIn() })
})

app.post('/players', async (req, res) => {
  const parsed = PlayersSchema.safeParse(req.body)
  if (parsed.success) {
    await savePlayersAsync(parsed.data)
    res.status(201).send()
  } else {
    res.status(400).send(parsed.error)
  }
})

app.post('/prizes', async (req, res) => {
  const parsed = PrizesSchema.safeParse(req.body)
  if (parsed.success) {
    await savePrizesAsync(parsed.data)
    res.status(201).send()
  } else {
    res.status(400).send(parsed.error)
  }
})

app.post('/bounty-prize-groups', async (req, res) => {
  const parsed = BountyPrizeGroupsSchema.safeParse(req.body)
  if (parsed.success) {
    await saveBountyPrizeGroupsAsync(parsed.data)
    res.status(201).send()
  } else {
    res.status(400).send(parsed.error)
  }
})

app.post('/login', async (req, res) => {
  const parsed = SteamCredentialsSchema.safeParse(req.body)
  if (parsed.success) {
    res.status(200).send(await logInAsync(parsed.data))
  } else {
    res.status(400).send(parsed.error)
  }
})

app.post('/steam-guard-code', async (req, res) => {
  const parsed = SteamGuardCodeSchema.safeParse(req.body)
  if (parsed.success) {
    res.status(200).send(await setSteamGuardCodeAsync(parsed.data.steamGuardCode))
  } else {
    res.status(400).send(parsed.error)
  }
})

app.post('/send-prizes', async (_, res) => {
  if (!isLoggedIn()) {
    res.status(401).send()
    return
  }

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

  res.status(200).send(result)
})

app.post('/cancel-trade-offer', async (req, res) => {
  if (!isLoggedIn()) {
    res.status(401).send()
    return
  }

  const parsed = TradeOfferIdSchema.safeParse(req.body)
  if (parsed.success) {
    const tradeOfferId = parsed.data.tradeOfferId
    const result = await cancelPrizeTradeOfferAsync(tradeOfferId)
    if (result.success) {
      const tradeOffers = await getTradeOffersAsync()
      tradeOffers.find((offer) => offer.tradeOfferId === tradeOfferId)!.state = result.state!
      await saveTradeOffersAsync(tradeOffers)
    }

    res.status(200).send(result)
  } else {
    res.status(400).send(parsed.error)
  }
})

app.post('/cancel-all-trade-offers', async (req, res) => {
  if (!isLoggedIn()) {
    res.status(401).send()
    return
  }

  const parsed = TradeOfferIdsSchema.safeParse(req.body)
  if (parsed.success) {
    const result = await cancelAllPrizeTradeOffersAsync(parsed.data.tradeOfferIds)
    if (result.success) {
      const tradeOffers = await getTradeOffersAsync()
      result.cancelTradeOfferResults!.forEach((result) => {
        tradeOffers.find((offer) => offer.tradeOfferId === result.tradeOfferId)!.state =
          result.state!
      })

      await saveTradeOffersAsync(tradeOffers)
    }

    res.status(200).send(result)
  } else {
    res.status(400).send(parsed.error)
  }
})

app.post('/clear-trade-offer-history', async (_, res) => {
  const tradeOffers = await getTradeOffersAsync()
  const result = await clearTradeOfferHistoryAsync(tradeOffers)
  if (result.success) {
    await saveTradeOffersAsync(result.activeTradeOffers!)
  }

  res.status(200).send(result)
})

app.listen(6520, (err) => console.log(err ?? 'Running'))
