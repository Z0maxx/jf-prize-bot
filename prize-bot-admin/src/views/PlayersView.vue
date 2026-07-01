<script setup lang="ts">
import { tradeUrlRegex, type Player } from '@jf-prize-bot/schema'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

import { useAppStore } from '@/stores/app'
import { usePlayerStore } from '@/stores/player'
import { usePrizeStore } from '@/stores/prize'
import { getRanksSpans } from '@/utils'

import LoadingPage from '@/components/LoadingPage.vue'
import SubmitButton from '@/components/SubmitButton.vue'

const appStore = useAppStore()
const { addHasChanges, removeHasChanges } = appStore
const { hasChanges, isSaving, isLoading } = storeToRefs(appStore)

const playerStore = usePlayerStore()
const { players } = storeToRefs(playerStore)

const prizeStore = usePrizeStore()

const searchedPlayerName = ref('')
const foundPlayers = ref<Player[]>([])

const isPageLoading = computed(() => !isLoading || isLoading.value.has(playerStore.at))
const isSaveButtonDisabled = computed(
  () =>
    !hasChanges.value.has(playerStore.at) ||
    isSaving.value.has(playerStore.at) ||
    isSaving.value.has(prizeStore.at),
)

let originalTradeUrls = new Map<string, string | undefined>()

function getTradeUrlError(player: Player) {
  const tradeUrl = player.tradeUrl
  if (!tradeUrl) {
    return ''
  }

  const sameTradeUrl = players.value.find(
    (p) => p.discordId !== player.discordId && p.tradeUrl === tradeUrl,
  )
  if (sameTradeUrl) {
    return `Player '${sameTradeUrl.discordFullName}' already has this Trade Url`
  }

  if (tradeUrl && !tradeUrl.match(tradeUrlRegex)) {
    return 'Trade Url must be in the following format: https://steamcommunity.com/tradeoffer/new/?partner=<partner>&token=<token>'
  }

  return ''
}

async function save() {
  if (hasChanges.value.has(playerStore.at)) {
    players.value
      .filter((player) => !player.tradeUrl && !!originalTradeUrls.get(player.discordId))
      .forEach((player) => prizeStore.removePrizeForPlayer(player))

    if (hasChanges.value.has(prizeStore.at)) {
      prizeStore.saveAsync()
    }

    setOriginalTradeUrls()
    playerStore.saveAsync()
  }
}

function setOriginalTradeUrls() {
  originalTradeUrls = new Map(players.value.map((player) => [player.discordId, player.tradeUrl]))
}

function trim(e: InputEvent) {
  const target = e.target! as HTMLInputElement
  target.value = target.value.trim()
}

watch(isPageLoading, () => {
  if (!isPageLoading.value) {
    setOriginalTradeUrls()
  }
})

watch(
  players,
  (newPlayers) => {
    const hasDifferentTradeUrl = newPlayers.filter(
      (player) => (player.tradeUrl ?? '') !== (originalTradeUrls.get(player.discordId) ?? ''),
    )
    if (
      newPlayers.some((player) => !!getTradeUrlError(player)) ||
      hasDifferentTradeUrl.length === 0
    ) {
      removeHasChanges(playerStore.at)
    } else if (originalTradeUrls.size > 0 && hasDifferentTradeUrl.length > 0) {
      addHasChanges(playerStore.at)
    }
  },
  { deep: true },
)

watch(searchedPlayerName, () => {
  foundPlayers.value = players.value.filter((player) =>
    player.discordFullName
      .toLocaleLowerCase()
      .includes(searchedPlayerName.value.toLocaleLowerCase()),
  )
})

onBeforeRouteLeave(() => {
  save()
})

onMounted(() => {
  if (!isPageLoading.value) {
    setOriginalTradeUrls()
    foundPlayers.value = players.value
  }
})
</script>
<template>
  <LoadingPage v-if="isPageLoading" :name="playerStore.at" />
  <div class="flex flex-col items-center" v-else>
    <div
      class="sticky top-0 z-50 flex w-full flex-col items-center border-b-2 border-blue-500 bg-blue-300 py-4"
    >
      <SubmitButton
        @click="save"
        :disabled="isSaveButtonDisabled"
        :is-submitting="isSaving.has(playerStore.at)"
        class="w-236 button-green"
        >Save Players</SubmitButton
      >
    </div>
    <h3>Players</h3>
    <div>
      <input
        v-model="searchedPlayerName"
        placeholder="Search for a Player"
        class="w-full text-center"
      />
      <table class="mt-2 w-352 table-fixed bg-slate-700 text-white">
        <thead>
          <tr>
            <th class="w-80">Ranks</th>
            <th class="w-100">Full discord name</th>
            <th class="w-172">Trade Url</th>
          </tr>
        </thead>
        <tbody class="divide-y-2 divide-gray-400">
          <tr v-for="player in foundPlayers" :key="player.discordId">
            <td class="w-80 px-2 [&_span]:px-2" v-html="getRanksSpans(player)"></td>
            <td class="w-100 px-2">{{ player.discordFullName }}</td>
            <td class="w-172 py-1 pr-2">
              <input
                v-model="player.tradeUrl"
                @input="trim"
                class="custom-input w-full rounded-md border-2 border-sky-800 bg-sky-950 px-1 py-0.5 focus:outline-sky-700"
              />
              <span class="text-fuchsia-400">{{ getTradeUrlError(player) }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
