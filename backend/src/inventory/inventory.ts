import { categoryNames } from "./categoryNames"
import { descriptionValues } from "./descriptionValues"
import { grades } from "./grades"
import { getListFromSheetAsync, saveListToSheetAsync } from "../sheets"
import { tagNames } from "./tagNames"
import type { CategoryName, DescriptionValue, Inventory, InventoryResponse, Item, SkinName, TagName } from "../types"
import "dotenv/config"
import { UniqueItem } from "@jf-prize-bot/schema"

export const keyClassId = process.env.USE_SCRAP_AS_KEY ? '2675' : '101785959'
const botUserId = process.env.BOT_USER_ID

export async function getInventoryAsync(): Promise<Inventory> {
  return {
    items: await getListFromSheetAsync<UniqueItem>('Inventory', 'A'),
    keys: (await getListFromSheetAsync<{ keys: number }>('Inventory', 'B'))[0]!.keys
  }
}

export async function reloadInventoryAsync(): Promise<Inventory> {
  const items = await getItemsAsync()
  const keys = items.filter(item => item.classId === keyClassId).length
  const uniqueItems = await getUniqueItemsAsync(items)
  await saveListToSheetAsync('Inventory', 'A', uniqueItems)
  await saveListToSheetAsync('Inventory', 'B', [{ keys }])
  return {
    items: uniqueItems,
    keys
  }
}

async function getUniqueItemsAsync(items: Item[]) {
  const filteredItems = items.filter(item =>
    item.tradable &&
    item.classId !== keyClassId &&
    !item.commodity &&
    !isNormalWeapon(item))

  const effects = await getSchemaAsync('effects')
  return filteredItems.map(item => {
    let originalName = getItemName(item)
    let nameParts: string[][] = [[originalName]]
    let unusualIconUrl
    const skin = isSkin(item)
    if (skin) {
      const grade = getItemGrade(item)!
      const skinName = getSkinName(item)
      nameParts = [[`(${getSkinWear(item)})`], [grade, skinName.name]]
      if (skinName.isWarPaint) {
        nameParts[1]!.push(originalName)
      }
    }
    else {
      const grade = getItemGrade(item)
      if (grade) {
        nameParts[0] = [grade, originalName]
      }
    }

    if (isKillstreak(item)) {
      nameParts.push([getKillstreak(item)])
    }

    if (isUnusualWithEffect(item)) {
      const unusualName = getUnusualEffectName(item)
      unusualIconUrl = `https://raw.githubusercontent.com/Z0maxx/particles/refs/heads/main/${effects[unusualName]}_94x94.png`
      nameParts.push(['Unusual', unusualName])
    }

    const quality = getQuality(item)
    const notNeededQualities = [tagNames.unusual, tagNames.unique, tagNames.strange, tagNames.skin] as string[]
    if (!notNeededQualities.includes(quality)) {
      nameParts.push([quality])
    }

    if (isFestivized(item)) {
      nameParts.push(['Festivized'])
    }

    if (isStrange(item)) {
      nameParts.push(['Strange'])
    }

    return {
      assetId: item.assetId,
      nameParts: nameParts.reverse(),
      iconUrl: 'https://community.fastly.steamstatic.com/economy/image/' + item.iconUrl,
      unusualIconUrl
    } as UniqueItem
  })
}

function isSkin(item: Item) {
  return hasTagName(item, tagNames.skin)
}

function isUnusualWithEffect(item: Item) {
  return hasDescriptionValue(item, descriptionValues.unusualEffect)
}

function isKillstreak(item: Item) {
  return hasDescriptionValue(item, descriptionValues.killstreak)
}

function isStrange(item: Item) {
  return hasDescriptionValue(item, descriptionValues.strange)
}

function isFestivized(item: Item) {
  return hasDescriptionValue(item, descriptionValues.festivized)
}

function isNormalWeapon(item: Item) {
  const weaponTagNames = [tagNames.primaryWeapon, tagNames.secondaryWeapon, tagNames.meleeWeapon]
  return getTagNameForCategoryName(item, categoryNames.quality) === tagNames.unique &&
    weaponTagNames.some(tagName => hasTagName(item, tagName)) &&
    !hasDescriptionValue(item, descriptionValues.gifted) &&
    !hasDescriptionValue(item, descriptionValues.crafted)
}

function hasTagName(item: Item, tagName: TagName) {
  return item.tags.some(tag => tag.localized_tag_name === tagName)
}

function getTagNameForCategoryName(item: Item, categoryName: CategoryName) {
  return item.tags.find(tag => tag.localized_category_name === categoryName)!.localized_tag_name
}

function hasDescriptionValue(item: Item, descriptionValue: DescriptionValue) {
  return item.descriptions?.some(desc => desc.value.startsWith(descriptionValue))
}

function getQuality(item: Item) {
  return getTagNameForCategoryName(item, categoryNames.quality)
}

function getUnusualEffectName(item: Item) {
  return item.descriptions!
    .find(desc => desc.value.startsWith(descriptionValues.unusualEffect))!
    .value!
    .split(':')[1]!
    .trimStart()
}

function getSkinWear(item: Item) {
  return getTagNameForCategoryName(item, categoryNames.wear)
}

function getItemGrade(item: Item) {
  if (!item.descriptions) {
    return undefined
  }

  return grades.find(grade => item.descriptions?.some(desc => desc.value.includes(grade)))
}

function getSkinName(item: Item): SkinName {
  let value = item.descriptions!.find(desc => {
    const val = desc.value
    return val.startsWith('✔') || val.startsWith('★') && !val.includes('Unusual')
  })?.value

  if (!value) {
    let i = 0
    while (!item.descriptions![i]!.value.endsWith('Collection')) {
      i++
    }

    i++
    while (!value) {
      const val = item.descriptions![i]!.value.trim()
      if (item.market_hash_name.includes(val)) {
        value = val
      }

      i++
    }
  }

  let name = value
  const replaced = ['✔', '★', 'War Paint']
  replaced.forEach(r => name = name.replace(r, ''))
  return {
    isWarPaint: value.includes('War Paint'),
    name: name.trim()
  }
}

function getItemName(item: Item) {
  const originalName = item
    .fraudWarnings
    ?.find(warning => warning.includes('Original name:'))
    ?.split(':')[1]
    ?.replaceAll('\\', '')
    ?.replaceAll('"', '')
    ?.trim()

  let name = originalName ?? item.name
  const replaced = [getQuality(item), getKillstreak(item), tagNames.strange, descriptionValues.festivized, 'The']
  replaced.forEach(r => name = name.replace(r, ''))
  if (isSkin(item)) {
    name = name.replace(getSkinName(item).name, '')
  }

  return name.trim()
}

function getKillstreak(item: Item) {
  if (hasDescriptionValue(item, descriptionValues.professionalKillstreak)) {
    return 'Professional Killstreak'
  }
  else if (hasDescriptionValue(item, descriptionValues.specializedKillstreak)) {
    return 'Specialized Killstreak'
  }
  else if (hasDescriptionValue(item, descriptionValues.killstreak)) {
    return 'Killstreak'
  }

  return ''
}

async function getSchemaAsync(schema: string) {
  const resp = await fetch(`https://raw.githubusercontent.com/danocmx/node-tf2-static-schema/refs/heads/master/static/${schema}.json`)
  return await resp.json() as Record<string, string>
}

async function getItemsAsync() {
  const url = `https://steamcommunity.com/inventory/${botUserId}/440/2`
  const items: Array<Item> = []
  let moreItems = false
  let startAssetId = ''
  do {
    const resp = await fetch(url + startAssetId)
    if (resp.status === 500) {
      throw new Error('Steam is having issues')
    }

    const invResp = await resp.json() as InventoryResponse
    const invDescs = new Map(invResp.descriptions.map(desc => [desc.classid, desc]))
    const newItems = invResp.assets.map(asset => {
      const invDesc = invDescs.get(asset.classid)!
      return {
        assetId: asset.assetid,
        classId: asset.classid,
        name: invDesc.name,
        iconUrl: invDesc.icon_url,
        tradable: !!invDesc.tradable,
        commodity: !!invDesc.commodity,
        descriptions: invDesc.descriptions,
        market_hash_name: invDesc.market_hash_name,
        tags: invDesc.tags,
        fraudWarnings: invDesc.fraudwarnings
      } as Item
    })

    items.push(...newItems)
    moreItems = !!invResp.more_items
    if (moreItems) {
      startAssetId = '?start_assetid=' + invResp.last_assetid
    }
  } while (moreItems)

  return items
}