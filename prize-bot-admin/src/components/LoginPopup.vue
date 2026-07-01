<script setup lang="ts">
import { SteamGuardCodeSchema, type SteamCredentials } from '@jf-prize-bot/schema'
import { storeToRefs } from 'pinia'
//@ts-ignore
import * as EResultValue from 'steam-user/enums/EResult'
import { reactive, ref, useTemplateRef, watch } from 'vue'

import { api } from '@/api'
import { useAppStore } from '@/stores/app'

import SubmitButton from './SubmitButton.vue'

const EResult = EResultValue as typeof import('steam-user').EResult

const appStore = useAppStore()
const { isLoginPopupOpened } = storeToRefs(appStore)

let hasError = false

const isSubmitting = ref(false)
const mode = ref<'login' | 'steam-guard-code'>('login')
const accountNameError = ref('')
const passwordError = ref('')
const steamGuardCodeError = ref('')
const error = ref('')
const steamGuardCode = ref('')

const credentials = reactive<SteamCredentials>({
  accountName: '',
  password: '',
})

const steamGuardCodeRef = useTemplateRef('steam-guard-code')
const accountNameRef = useTemplateRef('account-name')

const steamGuardCodeLength = SteamGuardCodeSchema.shape.steamGuardCode.minLength

async function submit() {
  hasError = false
  resetErrors()
  if (mode.value === 'login') {
    if (credentials.accountName.trim() === '') {
      accountNameError.value = 'Account Name is required'
      hasError = true
    }

    if (credentials.password.trim() === '') {
      passwordError.value = 'Password is required'
      hasError = true
    }

    if (hasError) {
      return
    }

    isSubmitting.value = true
    const result = await api.login(credentials)
    isSubmitting.value = false
    if (!result.success && result.error) {
      if (result.error === EResult.InvalidPassword) {
        error.value = 'Invalid Account Name or Password'
      } else {
        error.value = 'Unexpected error: ' + EResult[result.error]
      }
    } else if (result.success) {
      mode.value = 'steam-guard-code'
      resetErrors()
    }

    credentials.accountName = ''
    credentials.password = ''
  } else {
    if (steamGuardCode.value.trim() === '') {
      steamGuardCodeError.value = 'Steam Guard Code is required'
      return
    }

    if (steamGuardCode.value.length !== steamGuardCodeLength) {
      steamGuardCodeError.value = `Steam Guard Code needs to be ${steamGuardCodeLength} characters`
      return
    }

    isSubmitting.value = true
    const result = await api.sendSteamGuardCode({
      steamGuardCode: steamGuardCode.value.toUpperCase(),
    })
    isSubmitting.value = false
    if (!result.success && result.error) {
      if (result.error === EResult.TwoFactorCodeMismatch) {
        error.value = 'Invalid Steam Guard Code'
      } else {
        error.value = 'Unexpected error: ' + EResult[result.error]
      }
    } else if (result.success) {
      appStore.setIsLoggedInAsync()
      appStore.setIsLoginPopupOpened(false)
    }

    steamGuardCode.value = ''
  }
}

function close() {
  appStore.setIsLoginPopupOpened(false)
  credentials.accountName = ''
  credentials.password = ''
}

function resetErrors() {
  accountNameError.value = ''
  passwordError.value = ''
  steamGuardCodeError.value = ''
  error.value = ''
}

watch(accountNameRef, () => {
  accountNameRef.value?.focus()
})

watch(steamGuardCodeRef, () => {
  steamGuardCodeRef.value?.focus()
})

watch(isLoginPopupOpened, (opened) => {
  if (opened) {
    mode.value = 'login'
    resetErrors()
  } else {
    close()
  }
})
</script>
<template>
  <dialog
    v-if="isLoginPopupOpened"
    class="absolute top-0 left-0 flex h-screen w-screen items-center justify-center bg-transparent backdrop-blur-sm"
  >
    <div class="relative rounded-md bg-white p-2">
      <button @click="close" class="absolute top-0 right-2 text-2xl font-medium">×</button>
      <div class="flex flex-col gap-2">
        <template v-if="mode === 'login'">
          <h2>Login</h2>
          <div class="flex justify-between gap-2">
            <label for="account-name">Account Name</label>
            <input
              type="text"
              id="account-name"
              v-model="credentials.accountName"
              ref="account-name"
            />
          </div>
          <div class="text-sm text-red-500">{{ accountNameError }}</div>
          <div class="flex justify-between gap-2">
            <label for="password">Password</label>
            <input type="password" id="password" v-model="credentials.password" />
          </div>
          <div class="text-sm text-red-500">{{ passwordError }}</div>
        </template>
        <template v-else>
          <h2>Provide Steam Guard Code</h2>
          <div class="flex justify-between gap-2">
            <label for="steam-guard-code">Steam Guard Code</label>
            <input
              type="text"
              id="steam-guard-code"
              v-model="steamGuardCode"
              ref="steam-guard-code"
            />
          </div>
        </template>
        <div class="text-sm text-red-500">{{ steamGuardCodeError }}</div>
        <div class="text-red-500">{{ error }}</div>
        <SubmitButton
          @click="submit"
          :is-submitting="isSubmitting"
          :disabled="isSubmitting"
          class="button-green"
          >Submit</SubmitButton
        >
      </div>
    </div>
  </dialog>
</template>
