<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { useQuery } from '@tanstack/vue-query';

import RegCode from '@/components/statuses/RegCode.vue';
import StatusBadge from '@/components/statuses/StatusBadge.vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/utils';

const route = useRoute();
const eventId = computed(() => route.params.eventId as string || '');

const getRecentRegistrations = async (evtId: Ref<string>) => {
  const { $galantisApi } = useNuxtApp();
  const response = await $galantisApi.get(`/event/${evtId.value}/registrations?per_page=5&page=1&sort_by=date&order=desc`);
  return response.data;
};

const { data, isLoading, isError } = useQuery({
  enabled: !!eventId.value,
  queryFn: () => getRecentRegistrations(eventId),
  queryKey: ['recentRegistrations', eventId],
});

const recentRegs = computed(() => {
  if (!data.value?.data)
    return [];

  return data.value.data.slice(0, 5).map((reg: any) => ({
    id: reg.id,
    code: reg.code,
    fullname: reg.fullname,
    ticket_name: reg.ticket_name,
    date: reg.date,
    status: reg.status,
    stt_id: reg.stt_id,
  }));
});
</script>

<template>
  <Card class="relative overflow-hidden">
    <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle>
        <NuxtLink :to="`/event/${eventId}/registrations`" class="hover:underline">
          Recent Registrations
        </NuxtLink>
      </CardTitle>
      <Icon icon="solar:users-group-rounded-bold-duotone" class="size-7 text-indigo-500" />
    </CardHeader>
    <CardContent class="p-0">
      <div v-if="isLoading" class="space-y-3">
        <Skeleton v-for="i in 5" :key="i" class="h-12 w-full" />
      </div>
      <div v-else-if="isError" class="text-center text-sm text-muted-foreground">
        Error loading registrations
      </div>
      <div v-else-if="recentRegs.length === 0" class="py-4 text-center text-sm text-muted-foreground">
        No registrations yet
      </div>
      <div v-else class="scroll-area space-y-3 overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead>
            <tr class="border-b border-slate-200 text-xs uppercase dark:border-slate-700">
              <th class="px-4 py-2 font-normal text-muted-foreground">
                Date
              </th>
              <th class="px-4 py-2 font-normal text-muted-foreground">
                Name
              </th>
              <th class="px-4 py-2 font-normal text-muted-foreground">
                Ticket
              </th>
              <th class="px-4 py-2 text-center font-normal text-muted-foreground">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="reg in recentRegs"
              :key="reg.id"
              class="border-b border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50"
            >
              <td class="px-4 py-2 text-right">
                <div class="whitespace-nowrap">
                  {{ formatDate(reg.date, 'dd MMM yyyy') }}
                </div>
                <div class="block text-xs text-muted-foreground">
                  {{ formatDate(reg.date, 'HH:mm') }}
                </div>
              </td>
              <td class="px-4 py-2">
                <div>{{ reg.fullname }}</div>
                <NuxtLink :to="`/event/${eventId}/registrations/${reg.id}`">
                  <RegCode
                    :code="reg.code"
                    :status-id="reg.stt_id"
                    size="xs"
                    class="whitespace-nowrap"
                  />
                </NuxtLink>
              </td>
              <td class="px-4 py-2">
                <div>{{ reg.ticket_name }}</div>
              </td>
              <td class="text-center">
                <StatusBadge
                  :status="reg.status"
                  variant="dot"
                  size="default"
                  :icon-only="true"
                  :tooltip="reg.status"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </CardContent>
  </Card>
</template>
