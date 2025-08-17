<script setup lang="ts">
import { Icon } from '@iconify/vue';
</script>

<template>
  <div class="flex items-center gap-2">
    <Button :variant="$route.path.includes('/stats') ? 'default' : 'ghost'" as-child>
      <NuxtLink :to="`/event/${$route.params.eventId}/checkins/stats`">
        <Icon icon="heroicons:chart-bar" class="mr-2 size-4" />
        <span>Stats</span>
      </NuxtLink>
    </Button>
    <Button :variant="$route.path.includes('/history') ? 'default' : 'ghost'" as-child>
      <NuxtLink :to="`/event/${$route.params.eventId}/checkins/history`">
        <Icon icon="heroicons:user" class="mr-2 size-4" />
        <span>History</span>
      </NuxtLink>
    </Button>
  </div>
</template>
