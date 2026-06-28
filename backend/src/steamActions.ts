import SteamCommunity from 'steamcommunity'
import SteamUser from 'steam-user';
import TradeOfferManager, { EOfferFilter } from 'steam-tradeoffer-manager'
import { Prize, sendPrizesKnownError, SendPrizesResult, SteamAuthActionResult, SteamCredentials, tradeOfferStatus } from '@jf-prize-bot/schema';
import { keyClassId } from './inventory/inventory';
import CEconItem from 'steamcommunity/classes/CEconItem';
import TradeOffer from 'steam-tradeoffer-manager/lib/classes/TradeOffer';

const client = new SteamUser();
const community = new SteamCommunity()
const manager = new TradeOfferManager({
  "steam": client,
  "domain": "localhost",
  "language": "en"
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
  loggedIn = true;
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
  })

  community.setCookies(cookies)
  hasWebSession = true
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
  return new Promise(res => {
    const interval = setInterval(() => {
      if (loggedIn) {
        clearInterval(interval)
        res({
          success: true
        })
      }
      else if (error) {
        clearInterval(interval)
        res({
          success: false,
          error
        })
      }
      else if (needsSteamGuardCode) {
        clearInterval(interval)
        res({
          success: false,
          error: SteamUser.EResult.TwoFactorCodeMismatch
        })
      }
    }, 100)
  })
}

export async function logInAsync(credentials: SteamCredentials): Promise<SteamAuthActionResult> {
  return new Promise(res => {
    loggedIn = false
    error = null
    needsSteamGuardCode = false
    try {
      client.logOn(credentials)
      const interval = setInterval(() => {
        if (needsSteamGuardCode) {
          clearInterval(interval)
          res({
            success: true
          })
        }
        else if (error) {
          clearInterval(interval)
          res({
            success: false,
            error
          })
        }
      }, 100)
    }
    catch {
      res({
        success: true
      })
    }
  })
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

async function sendPrizesAsyncInternal(prizes: Prize[]): Promise<SendPrizesResult> {
  try {
    const inventory = await getInventoryAsync()
    const sentActiveOffers = await getSentActiveOffersAsync()
    const sentActiveOfferIds = sentActiveOffers.map(offer => offer.id!)
    const notAcceptedPrizes = prizes.filter(prize => !prize.tradeOffer?.id || sentActiveOfferIds.includes(prize.tradeOffer.id))
    const allKeysAssigned = notAcceptedPrizes
      .map(prize => prize.keys)
      .reduce((acc, curr) => acc + curr, 0)

    const keysInInventory = inventory.filter(item => item.classid.toString() === keyClassId)
    if (allKeysAssigned > keysInInventory.length) {
      return {
        success: false,
        error: sendPrizesKnownError.notEnoughKeys
      }
    }

    const inventoryAssetIds = inventory.map(item => item.assetid.toString())
    const itemsNotFound = notAcceptedPrizes
      .flatMap(prize => prize.assetIds)
      .filter(assetId => !inventoryAssetIds.includes(assetId))

    if (itemsNotFound.length > 0) {
      return {
        success: false,
        error: sendPrizesKnownError.itemsNotFound,
        itemsNotFound
      }
    }

    const errorsWithTradeOffer: string[] = []
    const offerPromises = notAcceptedPrizes.map(prize => new Promise<null>(offerRes => {
      console.log(prize.tradeOffer)
      if (prize.tradeOffer?.id) {
        const sentOffer = sentActiveOffers.find(offer => offer.id === prize.tradeOffer!.id)
        console.log(sentOffer?.id)
        sentOffer?.cancel((err) => console.log(err))
      }

      const offer = manager.createOffer(prize.player.tradeUrl)
      const items = inventory.filter(item => prize.assetIds.includes(item.assetid.toString()))
      const assignedKeys: CEconItem[] = []
      while (assignedKeys.length < prize.keys) {
        assignedKeys.push(keysInInventory.shift()!)
      }

      offer.addMyItems(items)
      offer.addMyItems(assignedKeys)
      offer.setMessage("Prize for " + prize.player.name)
      offer.send(err => {
        if (err) {
          const errorMessage = `Offer failed with: ${err.message}, ${err.cause ?? 'Wrong trade url or Steam is overloaded'}`
          errorsWithTradeOffer.push(errorMessage)
          console.log(errorMessage)
          prize.tradeOffer = {
            status: tradeOfferStatus.failed,
            error: errorMessage
          }
        }
        else {
          prize.tradeOffer = {
            id: offer.id!,
            status: tradeOfferStatus.unconfirmed
          }

          console.log(`Offer for '${prize.player.name}' with id #${offer.id} sent successfully`)
        }

        offerRes(null)
      })
    })
    )

    await Promise.all(offerPromises)
    if (errorsWithTradeOffer.length > 0) {
      return {
        success: false,
        error: sendPrizesKnownError.errorsWithTradeOffer,
        errorsWithTradeOffer,
        prizesWithTradeOffers: prizes
      }
    }

    return {
      success: true,
      prizesWithTradeOffers: prizes
    }
  }
  catch (err: any) {
    return {
      success: false,
      error: (err as string)
    }
  }
}

export async function sendPrizesAsync(prizes: Prize[]): Promise<SendPrizesResult> {
  return new Promise(res => {
    if (!loggedIn) {
      res({
        success: false,
        error: sendPrizesKnownError.notLoggedIn
      })

      return
    }

    const interval = setInterval(async () => {
      if (hasWebSession) {
        clearInterval(interval)
        res(await sendPrizesAsyncInternal(prizes))
      }
    }, 100)
  })
}