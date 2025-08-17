<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { useQuery } from '@tanstack/vue-query';
import { computed, ref } from 'vue';

import type { TicketCheckinStats } from '~/types';

import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatThousands } from '@/utils';

const props = withDefaults(
  defineProps<{
    eventId: string
    datetimeFilter?: string
    showAll?: boolean
  }>(),
  {
    datetimeFilter: '',
    showAll: false,
  },
);

const { $galantisApi } = useNuxtApp();

const getData = async (evtId: string, datetimeFilter: string): Promise<TicketCheckinStats[]> => {
  const params: Record<string, string> = {};
  if (datetimeFilter) {
    params.datetime_id = datetimeFilter;
  }

  const response = await $galantisApi.get(`/event/${evtId}/checkins/ticket-stats`, {
    params,
  });
  return response.data;
};

const {
  data: ticketStats,
  isLoading,
  isError,
  error,
} = useQuery({
  queryKey: ['checkin-ticket-stats', props.eventId, computed(() => props.datetimeFilter)],
  queryFn: () => getData(props.eventId, props.datetimeFilter),
  enabled: computed(() => !!props.eventId),
  staleTime: 1000 * 60 * 2, // 2 minutes
});

const displayLimit = 6;
const showAll = ref(false);

const displayedTickets = computed(() => {
  if (!ticketStats.value)
    return [];

  if (showAll.value) {
    return ticketStats.value;
  }
  return ticketStats.value.slice(0, displayLimit);
});

const hasMoreTickets = computed(() =>
  ticketStats.value ? ticketStats.value.length > displayLimit : false,
);

const toggleShowAll = () => {
  showAll.value = !showAll.value;
};

const getProgressColor = (percentage: number) => {
  if (percentage >= 80)
    return 'bg-green-500';
  if (percentage >= 60)
    return 'bg-yellow-500';
  if (percentage >= 40)
    return 'bg-orange-500';
  return 'bg-red-500';
};

const getBadgeVariant = (percentage: number) => {
  if (percentage >= 80)
    return 'default';
  if (percentage >= 60)
    return 'secondary';
  return 'outline';
};
</script>

<template>
  <Card class="overflow-hidden">
    <CardHeader>
      <CardTitle class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Icon icon="solar:ticket-bold-duotone" class="size-5 text-blue-500" />
          <span class="text-lg font-medium">Check-ins by Ticket Type</span>
        </div>
        <div v-if="!isLoading && ticketStats?.length" class="text-sm text-muted-foreground">
          {{ ticketStats.length }} ticket{{ ticketStats.length !== 1 ? 's' : '' }}
        </div>
      </CardTitle>
    </CardHeader>

    <CardContent class="relative">
      <!-- Loading State -->
      <div v-if="isLoading" class="space-y-4 py-4">
        <div v-for="i in 5" :key="i" class="space-y-3">
          <div class="flex justify-between">
            <div class="flex items-center gap-2">
              <Skeleton class="size-5 rounded" />
              <Skeleton class="h-4 w-32" />
            </div>
            <Skeleton class="h-6 w-16" />
          </div>
          <Skeleton class="h-2 w-full rounded-full" />
        </div>
      </div>

      <!-- Error State -->
      <Alert v-else-if="isError" variant="destructive" class="mt-4">
        <Icon icon="heroicons:exclamation-triangle" class="size-4" />
        <span class="ml-2">
          {{ error?.message || 'Unable to load ticket statistics. Please try again.' }}
        </span>
      </Alert>

      <!-- Data Display -->
      <div v-else-if="ticketStats && ticketStats.length > 0" class="space-y-4 py-4">
        <!-- Individual Tickets -->
        <div class="space-y-4">
          <div
            v-for="ticket in displayedTickets"
            :key="ticket.ticket_name"
            class="group rounded-lg border border-gray-200 p-4 transition-all hover:border-gray-300 hover:shadow-sm dark:border-gray-700 dark:hover:border-gray-600"
          >
            <div class="space-y-3">
              <!-- Ticket Header -->
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-medium text-gray-900 dark:text-gray-100">
                    {{ ticket.ticket_name }}
                  </p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ formatThousands(ticket.total_registrations) }} registrations
                  </p>
                </div>
                <div class="flex items-center gap-3">
                  <div class="text-right">
                    <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {{ formatThousands(ticket.unique_checkins) }}
                    </p>
                    <p class="text-xs text-gray-500">
                      checked in
                    </p>
                  </div>
                  <Badge :variant="getBadgeVariant(ticket.checkin_rate)" class="text-xs font-medium">
                    {{ ticket.checkin_rate }}%
                  </Badge>
                </div>
              </div>

              <!-- Progress Bar -->
              <div class="space-y-2">
                <div class="h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    :class="`h-2 rounded-full transition-all duration-500 ease-in-out ${getProgressColor(ticket.checkin_rate)}`"
                    :style="{ width: `${Math.min(100, ticket.checkin_rate)}%` }"
                  />
                </div>
              </div>

              <!-- Quick Stats -->
              <div class="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                <div class="text-center">
                  <p class="text-lg font-semibold text-green-600 dark:text-green-400">
                    {{ formatThousands(ticket.unique_checkins) }}
                  </p>
                  <p class="text-xs text-gray-600 dark:text-gray-400">
                    Checked In
                  </p>
                </div>
                <div class="text-center">
                  <p class="text-lg font-semibold text-gray-600 dark:text-gray-400">
                    {{ formatThousands(ticket.total_registrations - ticket.unique_checkins) }}
                  </p>
                  <p class="text-xs text-gray-600 dark:text-gray-400">
                    Pending
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Show More/Less Button -->
        <div
          v-if="hasMoreTickets"
          class="flex w-full flex-col justify-end rounded-b-lg py-4 text-center"
          :class="{
            'absolute bottom-0 left-0 h-24 bg-gradient-to-t from-card via-card/95 to-transparent dark:from-slate-900 dark:via-slate-900/95 dark:to-transparent': !showAll,
            'relative bg-none': showAll,
          }"
        >
          <div class="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              class="relative inline-flex border border-gray-200 bg-white shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
              @click="toggleShowAll"
            >
              <Icon :icon="showAll ? 'heroicons:chevron-up' : 'heroicons:chevron-down'" class="mr-2 size-4" />
              {{ showAll ? 'Show Less' : `Show ${ticketStats.length - displayLimit} More` }}
            </Button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <EmptyStateSimple
        v-else
        icon="solar:ticket-bold-duotone"
        title="No Ticket Data"
        description="No check-in data available for this event. Please ensure tickets have been checked in."
      />
    </CardContent>
  </Card>
</template>
