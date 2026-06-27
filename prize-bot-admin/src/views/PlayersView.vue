<script setup lang="ts">
import { tradeUrlRegex, type Player } from '@jf-prize-bot/schema'
import { storeToRefs } from 'pinia'
import { computed, reactive, ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

import { useAppStore } from '@/stores/app'
import { usePlayerStore } from '@/stores/player'
import { usePrizeStore } from '@/stores/prize'

import MinusButton from '@/components/MinusButton.vue'
import PlusButton from '@/components/PlusButton.vue'
import SaveButton from '@/components/SaveButton.vue'

const appStore = useAppStore()
const { hasChanges, isSaving, isLoading } = storeToRefs(appStore)

const playerStore = usePlayerStore()
const { players } = storeToRefs(playerStore)

const prizeStore = usePrizeStore()

const name = ref('')
const tradeUrl = ref('')

const nameErrors = reactive<string[]>([])
const tradeUrlErrors = reactive<string[]>([])

const isPageReady = computed(() => isLoading && !isLoading.value.has(playerStore.at))

const isPageSaving = computed(
  () => isSaving.value.has(playerStore.at) || isSaving.value.has(prizeStore.at),
)

const savingAt = computed(() => Array.from(hasChanges.value.values()).join(', '))

function setNameErrors() {
  nameErrors.splice(0, nameErrors.length)
  if (name.value === '') {
    nameErrors.push('Player Name is required')
  }

  if (players.value.some((player) => player.name === name.value)) {
    nameErrors.push('A Player already has this Name')
  }
}

function setTradeUrlErrors() {
  const tradeUrlValue = tradeUrl.value.trim()
  tradeUrlErrors.splice(0, tradeUrlErrors.length)
  if (tradeUrlValue === '') {
    tradeUrlErrors.push('Trade Url is required')
  }

  const sameTradeUrl = players.value.find((player) => player.tradeUrl === tradeUrlValue)
  if (sameTradeUrl) {
    tradeUrlErrors.push(`The Player "${sameTradeUrl.name}" already has this Trade Url`)
  }

  if (tradeUrlValue && !tradeUrlValue.match(tradeUrlRegex)) {
    tradeUrlErrors.push(
      'Trade Url must be in the following format: https://steamcommunity.com/tradeoffer/new/?partner=<partner>&token=<token>',
    )
  }
}

function tryAddPlayer() {
  setNameErrors()
  setTradeUrlErrors()
  if (nameErrors.length === 0 && tradeUrlErrors.length === 0) {
    playerStore.addPlayer({
      name: name.value.trim(),
      tradeUrl: tradeUrl.value.trim(),
    })

    name.value = ''
    tradeUrl.value = ''
  }
}

function removePlayer(player: Player) {
  playerStore.removePlayer(player)
  prizeStore.removePrizeForPlayer(player)
}

function save() {
  if (hasChanges.value.has(prizeStore.at)) {
    prizeStore.saveAsync()
  }

  if (hasChanges.value.has(playerStore.at)) {
    playerStore.saveAsync()
  }
}

onBeforeRouteLeave(() => {
  save()
})
</script>
<template>
  <div class="flex flex-col items-center" v-if="isPageReady">
    <div
      class="sticky top-0 z-50 flex w-full flex-col items-center border-b-2 border-blue-500 bg-blue-300 py-4"
    >
      <SaveButton
        @click="save"
        :disabled="!hasChanges.has(playerStore.at)"
        :is-saving="isPageSaving"
        class="w-236"
        >Save {{ savingAt }}</SaveButton
      >
    </div>
    <h3>New Player</h3>
    <div class="overflow-auto">
      <table class="w-236 table-fixed">
        <thead>
          <tr class="text-left">
            <th class="w-54">
              <label for="name"
                ><span>Name</span
                ><span class="text-2xl leading-1 font-medium text-red-500">*</span></label
              >
            </th>
            <th class="w-172">
              <label for="tradeUrl"
                ><span>Trade Url</span
                ><span class="text-2xl leading-1 font-medium text-red-500">*</span></label
              >
            </th>
            <th class="w-10"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            class="[&_input]:rounded-md [&_input]:border-2 [&_input]:border-sky-400 [&_input]:bg-sky-200 [&_input]:py-0.5 [&_input]:pl-1 [&_input]:focus:outline-sky-700"
          >
            <td><input v-model="name" id="name" class="min-w-50" /></td>
            <td><input v-model="tradeUrl" id="tradeUrl" class="min-w-168" /></td>
            <td>
              <PlusButton @click="tryAddPlayer" />
            </td>
          </tr>
          <tr class="text-red-600">
            <td class="align-top">
              <div v-for="error in nameErrors">{{ error }}</div>
            </td>
            <td class="align-top">
              <div v-for="error in tradeUrlErrors">{{ error }}</div>
            </td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>
    <h3>Players</h3>
    <div class="overflow-auto">
      <table class="w-236 table-fixed border-1 border-black bg-white">
        <tbody class="divide-y divide-gray-400">
          <tr v-for="player in players" class="hover:bg-amber-100">
            <td class="w-54 px-1.5 py-0.5">{{ player.name }}</td>
            <td class="w-172 px-1.5 py-0.5">{{ player.tradeUrl }}</td>
            <td class="w-10">
              <MinusButton @click="removePlayer(player)" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
