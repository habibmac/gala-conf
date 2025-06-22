<!-- components/partials/dashboard/RecentRegistrations.vue -->
<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { useQuery } from '@tanstack/vue-query';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/utils';

const route = useRoute();
const eventId = ref(route.params.eventId as string);

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
  }));
});
</script>

<template>
  <Card class="relative overflow-hidden">
    <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle class="text-sm font-medium tracking-normal">
        Recent Registrations
      </CardTitle>
      <Icon icon="solar:users-group-rounded-bold-duotone" class="size-7 text-indigo-500" />
    </CardHeader>
    <CardContent>
      <div v-if="isLoading" class="space-y-3">
        <Skeleton v-for="i in 5" :key="i" class="h-12 w-full" />
      </div>
      <div v-else-if="isError" class="text-center text-sm text-muted-foreground">
        Error loading registrations
      </div>
      <div v-else-if="recentRegs.length === 0" class="py-4 text-center text-sm text-muted-foreground">
        No registrations yet
      </div>
      <div v-else class="space-y-3">
        <div
          v-for="reg in recentRegs"
          :key="reg.id"
          class="flex items-center justify-between border-b py-2 last:border-b-0"
        >
          <div class="min-w-0 flex-1">
            <div class="flex items-center space-x-2">
              <h4 class="truncate text-sm font-medium">
                {{ reg.fullname }}
              </h4>
            </div>
            <div class="mt-1 flex items-center space-x-2">
              <span class="text-xs text-muted-foreground">{{ formatDate(reg.date) }}</span>
              <span class="text-xs text-muted-foreground">•</span>
              <span class="text-xs text-muted-foreground">{{ reg.code }}</span>
            </div>
          </div>
          <div class="text-sm">
            {{ reg.ticket_name }}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
