<!-- components/checkins/CheckinRecent.vue -->
<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';

import type { CheckinItem } from '~/types';

import RegCode from '~/components/statuses/RegCode.vue';

const route = useRoute();
const eventId = ref(route.params.eventId as string);
const { hasEventEnded } = useEventStatus();
const { $galantisApi } = useNuxtApp();

const getRecentCheckins = async () => {
  const response = await $galantisApi.get(`/event/${eventId.value}/checkins/recent`);
  return response.data as CheckinItem[];
};

const { data: recentCheckins, isLoading } = useQuery<CheckinItem[]>({
  queryFn: getRecentCheckins,
  queryKey: ['recent-checkins', eventId],
  refetchInterval: hasEventEnded.value ? false : 30000,
});

const getRegDetailsUrl = (regId: string) => {
  return `/event/${eventId.value}/registrations?details=${regId}`;
};
</script>

<template>
  <Card class="relative rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
    <CardHeader>
      <CardTitle class="text-base font-medium">
        <NuxtLink :to="`/event/${eventId}/checkins`" class="hover:underline">
          Recent Check-ins
        </NuxtLink>
      </CardTitle>
    </CardHeader>

    <CardContent>
      <div class="scroll-area relative max-h-[300px] overflow-auto">
        <table class="w-full">
          <thead class="sticky top-0 bg-white dark:bg-slate-900">
            <tr class="border-b border-slate-200 text-xs uppercase dark:border-slate-700">
              <th class="px-4 py-2 text-left font-medium text-muted-foreground">
                Time
              </th>
              <th class="px-4 py-2 text-left font-medium text-muted-foreground">
                Session
              </th>
              <th class="px-4 py-2 text-left font-medium text-muted-foreground">
                Name
              </th>
              <th class="px-4 py-2 text-left font-medium text-muted-foreground">
                Reg Code
              </th>
              <th class="px-4 py-2 text-left font-medium text-muted-foreground">
                Ticket
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
            <template v-if="isLoading">
              <tr v-for="i in 5" :key="i">
                <td class="px-4 py-2" colspan="5">
                  <Skeleton class="h-4 w-full" />
                </td>
              </tr>
            </template>
            <template v-else-if="recentCheckins && recentCheckins.length > 0">
              <tr
                v-for="checkin in recentCheckins"
                :key="checkin.id"
                class="text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <td class="whitespace-nowrap px-4 py-2 text-slate-900 dark:text-slate-300">
                  {{ formatDate(checkin.first_check_time, 'dd MMM yyyy HH:mm') }}
                </td>
                <td class="px-4 py-2">
                  {{ checkin.session }}
                </td>
                <td class="px-4 py-2">
                  {{ checkin.name }}
                </td>
                <td class="px-4 py-2">
                  <NuxtLink
                    :to="getRegDetailsUrl(checkin.id)"
                    class="number group inline-block whitespace-nowrap text-center"
                  >
                    <RegCode :code="checkin.code" :status-id="checkin.stt_id" size="xs" />
                  </NuxtLink>
                </td>
                <td class="px-4 py-2 font-medium">
                  {{ checkin.ticket }}
                </td>
              </tr>
            </template>
            <tr v-else>
              <td class="px-4 py-8 text-center text-sm text-slate-500" colspan="5">
                No recent check-ins
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </CardContent>
  </Card>
</template>
