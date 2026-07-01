<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

import { useAppStore } from '@/stores/app'
import { useBountyGroupStore } from '@/stores/bountyGroup'
import { usePrizeStore } from '@/stores/prize'
import { getRankColorHex } from '@/utils'

import type { BountyGroup } from '@jf-prize-bot/schema'

import LoadingPage from '@/components/LoadingPage.vue'
import MinusButton from '@/components/MinusButton.vue'
import PlusButton from '@/components/PlusButton.vue'
import SubmitButton from '@/components/SubmitButton.vue'

const appStore = useAppStore()
const { hasChanges, isSaving, isLoading } = storeToRefs(appStore)

const prizeStore = usePrizeStore()

const bountyGroupStore = useBountyGroupStore()
const { at } = bountyGroupStore
const { bountyGroups, isDeletingBounties } = storeToRefs(bountyGroupStore)

const errors = ref(new Map<string, Array<string | undefined>>())

const isPageLoading = computed(() => !isLoading || isLoading.value.has(at))
const isSaveButtonDisabled = computed(() => !hasChanges.value.has(at) || isSaving.value.has(at))
const isDeleteButtonDisabled = computed(
  () =>
    bountyGroups.value.every((group) => group.bounties.length === 0) || isDeletingBounties.value,
)

function removeBounty(group: BountyGroup, idx: number) {
  prizeStore.removeBountyFromPrizes(group.bounties[idx]!)
  group.bounties.splice(idx, 1)
  hasChanges.value.add(at)
}

function addBounty(group: BountyGroup) {
  group.bounties.push({ id: crypto.randomUUID(), name: '', keys: 1 })
  hasChanges.value.add(at)
}

function setKeys(group: BountyGroup, idx: number) {
  hasChanges.value.add(at)
  const keys = group.bounties[idx]!.keys
  group.bounties[idx]!.keys = Number.isNaN(keys) || keys < 1 ? 1 : keys
}

function prizeHasError(group: BountyGroup, idx: number) {
  return errors.value.get(group.discordRank.name)?.at(idx) !== undefined
}

function trySave() {
  let hasError = false
  bountyGroups.value.forEach((group) => {
    const prizeErrors: Array<string | undefined> = []
    group.bounties.forEach((prize) => {
      if (prize.name.trim() === '') {
        prizeErrors.push('Name is required')
      } else {
        prizeErrors.push(undefined)
      }
    })

    if (prizeErrors.some((err) => !!err)) {
      hasError = true
      errors.value.set(group.discordRank.name, prizeErrors)
    } else {
      errors.value.delete(group.discordRank.name)
    }
  })

  if (hasError) {
    return
  }

  if (hasChanges.value.has(prizeStore.at)) {
    prizeStore.saveAsync()
  }

  bountyGroupStore.saveAsync()
}

function tryDelete() {
  if (confirm(`Are you sure you want to delete all Bounties?`)) {
    bountyGroupStore.deleteBountiesAsync()
    prizeStore.removeAllBountiesFromPrizesAsync()
  }
}

onBeforeRouteLeave(() => {
  trySave()
  if (errors.value.size > 0) {
    return false
  }

  return true
})
</script>
<template>
  <LoadingPage v-if="isPageLoading" :name="at" />
  <div class="flex flex-col items-center" v-else>
    <div
      class="sticky top-0 z-50 flex w-full flex-col items-center border-b-2 border-blue-500 bg-blue-300 py-4"
    >
      <div class="flex w-180 gap-4">
        <SubmitButton
          @click="trySave"
          :disabled="isSaveButtonDisabled"
          :is-submitting="isSaving.has(at)"
          class="w-full button-green"
          >Save {{ at }}</SubmitButton
        >
        <SubmitButton
          @click="tryDelete"
          :disabled="isDeleteButtonDisabled"
          :is-submitting="isDeletingBounties"
          class="w-full button-rose"
          >Delete Bounties</SubmitButton
        >
      </div>
    </div>
    <h3>{{ at }}</h3>
    <table class="bg-slate-700 text-white">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Bounties</th>
        </tr>
      </thead>
      <tbody class="divide-y-2 divide-gray-400">
        <tr v-for="group in bountyGroups" :key="group.discordRank.name">
          <td :style="'color:' + getRankColorHex(group.discordRank)" class="px-2 font-bold">
            {{ group.discordRank.name }}
          </td>
          <td class="px-1 py-1">
            <div class="flex flex-col gap-1">
              <table v-if="group.bounties.length > 0">
                <thead>
                  <tr>
                    <th></th>
                    <th>Name</th>
                    <th>Keys</th>
                  </tr>
                </thead>
                <tbody>
                  <template v-for="idx in group.bounties.length" :key="idx">
                    <tr class="[&_td]:px-1">
                      <td>
                        <MinusButton @click="removeBounty(group, idx - 1)" class="pt-0.75" />
                      </td>
                      <td>
                        <input
                          v-model="group.bounties[idx - 1]!.name"
                          @input="hasChanges.add(at)"
                          class="custom-input w-full max-w-50 rounded-md border-2 border-sky-800 bg-sky-950 px-1 py-0.5 focus:outline-sky-700"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          v-model="group.bounties[idx - 1]!.keys"
                          @focusout="() => setKeys(group, idx - 1)"
                          class="custom-input w-full max-w-15 rounded-md border-2 border-sky-800 bg-sky-950 px-1 py-0.5 focus:outline-sky-700"
                        />
                      </td>
                    </tr>
                    <tr class="border-b-1 border-gray-500">
                      <td></td>
                      <td class="px-1 text-xs text-fuchsia-400" colspan="2">
                        <div v-if="prizeHasError(group, idx - 1)" class="mb-1">
                          {{ errors.get(group.discordRank.name)?.at(idx - 1) }}
                        </div>
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
              <PlusButton @click="addBounty(group)" class="px-1" />
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
