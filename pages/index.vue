<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const config = useRuntimeConfig()

const loginWithOAuth = () => {
  const clientId = config.public.oauthClientId
  const redirectUri = encodeURIComponent(config.public.oauthRedirectUri)
  return `${config.public.oauthUrl}/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}`
}

const login = () => {
  window.location.href = loginWithOAuth()
}
</script>
<template>
  <div>
    <h1>Welcome</h1>
    <p>
        {{ loginWithOAuth() }}
    </p>
    <button v-if="!authStore.isAuthenticated" @click="login">
        Login with OAuth 
    </button>
    <p v-else>You are logged in. <NuxtLink to="/events">Go to Events</NuxtLink></p>
  </div>
</template>

