<script setup lang="ts">
import { api } from '@/api';
import { useAppStore } from '@/stores/app';
import { type SteamCredentials } from '@jf-prize-bot/schema';
//@ts-ignore
import EResult from 'steam-user/enums/EResult';
import { reactive, ref, useTemplateRef, watch } from 'vue';
import SubmitButton from './SubmitButton.vue';
import { storeToRefs } from 'pinia';

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
  password: ''
})

const steamGuardCodeRef = useTemplateRef('steam-guard-code')
const accountNameRef = useTemplateRef('account-name')

async function submit() {
  hasError = false
  if (mode.value === 'login') {
    console.log(credentials)
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
      }
      else {
        error.value = 'Unexpected error: ' + EResult[result.error]
      }
    }
    else if (result.success) {
      mode.value = 'steam-guard-code'
      steamGuardCodeRef.value?.focus()
    }

    credentials.accountName = ''
    credentials.password = ''
  }
  else {
    if (steamGuardCode.value.trim() === '') {
      steamGuardCodeError.value = 'Steam Guard Code is required'
      return
    }

    isSubmitting.value = true
    const result = await api.sendSteamGuardCode({ steamGuardCode: steamGuardCode.value })
    isSubmitting.value = false
    if (!result.success && result.error) {
      if (result.error === EResult.TwoFactorCodeMismatch) {
        error.value = 'Invalid Steam Guard Code'
      }
      else {
        error.value = 'Unexpected error: ' + EResult[result.error]
      }
    }
    else if (result.success) {
      appStore.setIsLoggedIn(true)
    }

    steamGuardCode.value = ''
  }
}

function close() {
  appStore.setIsLoginPopupOpened(false)
  credentials.accountName = ''
  credentials.password = ''
  error.value = ''
}

watch(isLoginPopupOpened, opened => {
  if (opened) {
    mode.value = 'login'
    accountNameRef.value?.focus()
  }
  else {
    close()
  }
})
</script>
<template>
  <dialog v-if="isLoginPopupOpened" class="w-screen h-screen flex justify-center items-center backdrop-blur-sm absolute top-0 left-0 bg-transparent">
    <div class="bg-white rounded-md relative p-2">
      <button @click="close" class="absolute top-0 right-2 text-2xl font-medium">×</button>
      <div class="flex flex-col gap-2">
        <template v-if="mode === 'login'">
          <h2>Login</h2>
          <div class="flex justify-between gap-2">
            <label for="account-name">Account Name</label>
            <input type="text" id="account-name" v-model="credentials.accountName" ref="account-name">
          </div>
          <div class="text-red-500 text-sm">{{ accountNameError }}</div>
          <div class="flex justify-between gap-2">
            <label for="password">Password</label>
            <input type="password" id="password" v-model="credentials.password">
          </div>
          <div class="text-red-500 text-sm">{{ passwordError }}</div>
        </template>
        <template v-else>
          <h2>Provide Steam Guard Code</h2>
          <div class="flex justify-between gap-2">
            <label for="steam-guard-code">Steam Guard Code</label>
            <input type="text" id="steam-guard-code" v-model="steamGuardCode" ref="steam-guard-code">
          </div>
        </template>
        <div class="text-red-500 text-sm">{{ error }}</div>
        <SubmitButton @click="submit" :is-submitting="isSubmitting">Submit</SubmitButton>
      </div>
    </div>
  </dialog>
</template>