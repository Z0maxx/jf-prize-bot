import {
  CancelTradeOfferResult,
  Player,
  Prize,
  PrizeTradeOffer,
  sendPrizesKnownError,
  SteamAuthActionResult,
  SteamCredentials,
  prizeTradeOfferState,
  UniqueItem,
  SendPrizesResult,
} from '@jf-prize-bot/schema'
import TradeOfferManager, { EOfferFilter, ETradeOfferState } from 'steam-tradeoffer-manager'
import TradeOffer from 'steam-tradeoffer-manager/lib/classes/TradeOffer'
import SteamUser from 'steam-user'
import SteamCommunity from 'steamcommunity'
import CEconItem from 'steamcommunity/classes/CEconItem'

import { keyClassId } from './inventory/inventory'

const client = new SteamUser()
const community = new SteamCommunity()
const manager = new TradeOfferManager({
  steam: client,
  domain: 'localhost',
  language: 'en',
})

let loggedIn = false
let hasWebSession = false
let error: SteamUser.EResult | null = null
let needsSteamGuardCode = false
let steamGuardCode: string | null = null

client.on('steamGuard', (_, callback) => {
  error = null
  steamGuardCode = null
  needsSteamGuardCode = true
  const interval = setInterval(() => {
    if (steamGuardCode) {
      clearInterval(interval)
      callback(steamGuardCode)
    }
  }, 1000)
})

client.on('loggedOn', function () {
  loggedIn = true
})

client.on('error', (err) => {
  error = err.eresult
})

client.on('webSession', function (_, cookies) {
  manager.setCookies(cookies, function (err) {
    if (err) {
      console.log(err)
      process.exit(1)
    }

    hasWebSession = true
  })

  community.setCookies(cookies)
})

manager.on('sessionExpired', () => {
  loggedIn = false
})

export function isLoggedIn() {
  return loggedIn
}

export async function setSteamGuardCodeAsync(code: string): Promise<SteamAuthActionResult> {
  needsSteamGuardCode = false
  steamGuardCode = code
  return new Promise((res) => {
    const interval = setInterval(() => {
      if (loggedIn) {
        clearInterval(interval)
        res({
          success: true,
        })
      } else if (error) {
        clearInterval(interval)
        res({
          success: false,
          error,
        })
      } else if (needsSteamGuardCode) {
        clearInterval(interval)
        res({
          success: false,
          error: SteamUser.EResult.TwoFactorCodeMismatch,
        })
      }
    }, 100)
  })
}

export async function logInAsync(credentials: SteamCredentials): Promise<SteamAuthActionResult> {
  return new Promise((res) => {
    loggedIn = false
    error = null
    needsSteamGuardCode = false
    try {
      client.logOn(credentials)
      const interval = setInterval(() => {
        if (needsSteamGuardCode) {
          clearInterval(interval)
          res({
            success: true,
          })
        } else if (error) {
          clearInterval(interval)
          res({
            success: false,
            error,
          })
        }
      }, 100)
    } catch {
      res({
        success: true,
      })
    }
  })
}

export async function sendPrizesAsync(
  players: Player[],
  prizes: Prize[],
  uniqueItems: UniqueItem[],
): Promise<SendPrizesResult> {
  await waitForWebSession()
  return sendPrizesAsyncInternal(players, prizes, uniqueItems)
}

export async function cancelPrizeTradeOfferAsync(
  tradeOfferId: string,
  offers?: TradeOffer[],
): Promise<CancelTradeOfferResult> {
  await waitForWebSession()
  offers = offers ?? (await getAllSentOffersAsync())
  const offer = offers.find((offer) => offer.id === tradeOfferId)
  if (offer) {
    return await cancelTradeOfferAsync(offer)
  }

  return {
    success: false,
    tradeOfferId,
    error: 'Trade offer not found',
    state: prizeTradeOfferState.unknown,
  }
}

export async function cancelAllPrizeTradeOffersAsync(
  tradeOfferIds: string[],
): Promise<CancelTradeOfferResult[]> {
  await waitForWebSession()
  const offers = await getAllSentOffersAsync()
  const offerPromises = tradeOfferIds.map((tradeOfferId) =>
    cancelPrizeTradeOfferAsync(tradeOfferId, offers),
  )
  return Promise.all(offerPromises)
}

export async function updatePrizeTradeOfferStatesAsync(prizeOffers: PrizeTradeOffer[]) {
  await waitForWebSession()
  await updatePrizeTradeOfferStatesAsyncInternal(prizeOffers)
}

function waitForWebSession() {
  return new Promise<null>((res) => {
    const interval = setInterval(() => {
      if (hasWebSession) {
        clearInterval(interval)
        res(null)
      }
    }, 100)
  })
}

async function updatePrizeTradeOfferStatesAsyncInternal(prizeOffers: PrizeTradeOffer[]) {
  const offers = await getAllSentOffersAsync()
  prizeOffers.forEach((prizeOffer) => {
    const offer = offers.find((offer) => offer.id === prizeOffer.tradeOfferId)
    if (offer) {
      prizeOffer.state = getPrizeOfferState(offer)
    } else {
      prizeOffer.state = prizeTradeOfferState.unknown
    }
  })
}

function getPrizeOfferState(offer: TradeOffer) {
  switch (offer.state) {
    case ETradeOfferState.Active:
      return prizeTradeOfferState.confirmed
    case ETradeOfferState.Accepted:
      return prizeTradeOfferState.accepted
    case ETradeOfferState.Canceled:
    case ETradeOfferState.CanceledBySecondFactor:
      return prizeTradeOfferState.canceled
    case ETradeOfferState.Declined:
      return prizeTradeOfferState.declined
    case ETradeOfferState.Expired:
      return prizeTradeOfferState.expired
    default:
      return prizeTradeOfferState.unconfirmed
  }
}

function getInventoryAsync() {
  return new Promise<CEconItem[]>((res, rej) => {
    manager.getInventoryContents(440, 2, true, (err, inventory) => {
      if (err) {
        rej(err)
        return
      }

      res(inventory)
    })
  })
}

function getSentActiveOffersAsync() {
  return new Promise<TradeOffer[]>((res, rej) => {
    manager.getOffers(EOfferFilter.ActiveOnly, (err, sent, _) => {
      if (err) {
        rej(err)
        return
      }

      res(sent)
    })
  })
}

function getAllSentOffersAsync() {
  return new Promise<TradeOffer[]>((res, rej) => {
    manager.getOffers(EOfferFilter.All, (err, sent, _) => {
      if (err) {
        rej(err)
        return
      }

      res(sent)
    })
  })
}

function cancelTradeOfferAsync(offer: TradeOffer): Promise<CancelTradeOfferResult> {
  return new Promise((res) => {
    offer.cancel((err) => {
      if (err) {
        res({
          success: false,
          tradeOfferId: offer.id!,
          state: getPrizeOfferState(offer),
          error: err.message,
        })

        return
      }

      res({
        success: true,
        state: prizeTradeOfferState.canceled,
        tradeOfferId: offer.id!,
      })
    })
  })
}

async function sendPrizesAsyncInternal(
  players: Player[],
  prizes: Prize[],
  uniqueItems: UniqueItem[],
): Promise<SendPrizesResult> {
  try {
    const inventory = await getInventoryAsync()
    const allKeysAssigned = prizes.map((prize) => prize.keys).reduce((acc, curr) => acc + curr, 0)

    const assetIdsInOffers = new Set(
      (await getSentActiveOffersAsync())
        .flatMap((offer) => offer.itemsToGive)
        .map((item) => item.assetid),
    )

    const availableKeysInInventory = inventory.filter(
      (item) => item.classid.toString() === keyClassId && !assetIdsInOffers.has(item.assetid),
    )
    if (allKeysAssigned > availableKeysInInventory.length) {
      return {
        success: false,
        error: sendPrizesKnownError.notEnoughAvailableKeys,
      }
    }

    const inventoryAssetIds = inventory.map((item) => item.assetid.toString())
    const prizeAssetIds = prizes.flatMap((prize) => prize.assetIds)
    const itemsNotFound = prizeAssetIds.filter((assetId) => !inventoryAssetIds.includes(assetId))
    if (itemsNotFound.length > 0) {
      return {
        success: false,
        error: sendPrizesKnownError.itemsNotFound,
        itemsNotFound,
      }
    }

    const itemsInTradeOffer = prizeAssetIds.filter((assetId) => assetIdsInOffers.has(assetId))
    if (itemsInTradeOffer.length > 0) {
      return {
        success: false,
        error: sendPrizesKnownError.itemsInTradeOffer,
        itemsInTradeOffer,
      }
    }

    const playerIds = players.map((player) => player.discordId)
    const playersNotFound = prizes
      .flatMap((prize) => prize.discordId)
      .filter((id) => !playerIds.includes(id))

    if (playersNotFound.length > 0) {
      return {
        success: false,
        error: sendPrizesKnownError.playersNotFound,
        playersNotFound,
      }
    }

    let errorsWithTradeOffer = false
    const offerPromises = prizes.map(
      (prize) =>
        new Promise<PrizeTradeOffer>((offerRes) => {
          const player = players.find((player) => player.discordId === prize.discordId)!
          const offer = manager.createOffer(player.tradeUrl!)
          const items = inventory.filter((item) => prize.assetIds.includes(item.assetid.toString()))
          const assignedKeys: CEconItem[] = []
          while (assignedKeys.length < prize.keys) {
            assignedKeys.push(availableKeysInInventory.shift()!)
          }

          offer.addMyItems(items)
          offer.addMyItems(assignedKeys)
          offer.setMessage('Prize for ' + player.discordFullName)
          offer.send((err) => {
            if (err) {
              const errorMessage = `Offer failed with: ${err.message}, ${err.cause ?? 'Wrong trade url or Steam is overloaded'}`
              errorsWithTradeOffer = true
              console.log(`'${player.discordFullName}': ${errorMessage}`)
              offerRes({
                id: crypto.randomUUID(),
                state: prizeTradeOfferState.failed,
                discordId: player.discordId,
                error: errorMessage,
              })
            } else {
              offerRes({
                id: crypto.randomUUID(),
                tradeOfferId: offer.id!,
                state: prizeTradeOfferState.unconfirmed,
                discordId: player.discordId,
                keys: prize.keys,
                items: uniqueItems.filter((item) => prize.assetIds.includes(item.assetId)),
              })

              console.log(
                `Offer for '${player.discordFullName}' with id #${offer.id} sent successfully`,
              )
            }
          })
        }),
    )

    const tradeOffers = await Promise.all(offerPromises)
    if (errorsWithTradeOffer) {
      const failedToSendPrizesTo = tradeOffers
        .filter((offer) => offer.state === prizeTradeOfferState.failed)
        .map((offer) => offer.discordId)

      return {
        success: false,
        error: sendPrizesKnownError.hasFailedTradeOffers,
        tradeOffers,
        failedToSendPrizes: prizes.filter((prize) =>
          failedToSendPrizesTo.includes(prize.discordId),
        ),
      }
    }

    return {
      success: true,
      tradeOffers,
    }
  } catch (err: any) {
    return {
      success: false,
      error: err as string,
    }
  }
}
