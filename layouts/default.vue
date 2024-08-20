<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useRouter } from 'nuxt/app'

const authStore = useAuthStore()
const router = useRouter()

const logout = () => {
  authStore.logout()
  router.push('/')
}
</script>
<template>
  <div>
    <nav>
      <NuxtLink to="/">Home</NuxtLink>
      <NuxtLink v-if="authStore.isAuthenticated" to="/events">Events</NuxtLink>
      <a v-if="authStore.isAuthenticated" href="#" @click.prevent="logout">Logout</a>
    </nav>
    <slot />
  </div>
</template>

