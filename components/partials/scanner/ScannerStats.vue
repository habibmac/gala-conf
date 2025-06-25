<!-- ScannerStats.vue -->
<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { useQuery } from '@tanstack/vue-query';

import type { GlobalCheckinStats } from '~/types';

const props = defineProps<{
  selectedDatetime: string
  successfulScans: number
  failedScans: number
}>();

const { $galantisApi } = useNuxtApp();
const route = useRoute();
const eventId = computed(() => route.params.eventId as string);

// Component fetches its own stats
const getStats = async (): Promise<GlobalCheckinStats> => {
  const params: Record<string, string> = {};
  if (props.selectedDatetime) {
    params.datetime_id = props.selectedDatetime;
  }

  const response = await $galantisApi.get(`/event/${eventId.value}/checkins/stats`, { params });
  return response.data;
};

// Auto-refreshes when selectedDatetime changes
const {
  data: stats,
  isLoading,
  isError,
  error,
} = useQuery({
  queryKey: ['scanner-stats', eventId, computed(() => props.selectedDatetime)],
  queryFn: getStats,
  enabled: computed(() => !!eventId.value),
  staleTime: 1000 * 30, // 30 seconds
  refetchInterval: 1000 * 60, // Refresh every minute for live stats
});
</script>

<template>
  <div class="space-y-4">
    <!-- Loading state -->
    <div v-if="isLoading" class="grid grid-cols-2 gap-4 md:grid-cols-4">
      <Skeleton v-for="i in 4" :key="i" class="h-32 rounded-lg bg-muted-foreground/10" />
    </div>

    <!-- Error state -->
    <Alert v-else-if="isError" variant="destructive">
      <AlertDescription>{{ error?.message || 'Failed to load stats' }}</AlertDescription>
    </Alert>

    <!-- Stats cards -->
    <Card v-else>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Icon icon="heroicons:chart-bar" class="size-5 text-muted-foreground" />
          Session Stats
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-4 gap-4">
          <div class="text-center">
            <div class="text-2xl font-bold text-green-500">
              {{ Number(stats?.total_checkins) }}
            </div>
            <div class="text-sm text-muted-foreground">
              Check-ins
            </div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-500">
              {{ Number(stats?.currently_present) }}
            </div>
            <div class="text-sm text-muted-foreground">
              Currently Here
            </div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-purple-500">
              {{ successfulScans }}
            </div>
            <div class="text-sm text-muted-foreground">
              Successful
            </div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-red-500">
              {{ failedScans }}
            </div>
            <div class="text-sm text-muted-foreground">
              Failed
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
