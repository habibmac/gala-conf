<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useRouter } from 'nuxt/app'

type Event = {
  id: number
  title: string
}

const authStore = useAuthStore()
const router = useRouter()
const events = ref([] as Event[])

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push('/')
    return
  }

  const { $galantisApi } = useNuxtApp()

  try {
    const response = await $galantisApi.get('/events')
    events.value = response.data?.data || []
  } catch (error) {
    console.error('Failed to fetch events', error)
  }
})
</script>
<template>
  <div>
    <h1>Events</h1>
    <ul v-if="events.length > 0">
      <li v-for="event in events" :key="event.id">{{ event.title }}</li>
    </ul>
    <p v-else>No events found.</p>
  </div>
</template>


