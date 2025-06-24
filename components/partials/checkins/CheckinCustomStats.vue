<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';

import type { CustomCheckinStats } from '~/types';

import { Badge } from '@/components/ui/badge';
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

const getData = async (evtId: string, datetimeFilter: string): Promise<CustomCheckinStats[]> => {
  const params: Record<string, string> = {};
  if (datetimeFilter) {
    params.datetime_id = datetimeFilter;
  }

  const response = await $galantisApi.get(`/event/${evtId}/checkins/custom-stats`, {
    params,
  });
  return response.data;
};

const {
  data: customStats,
  isLoading,
  isError,
  error,
} = useQuery({
  queryKey: ['checkin-custom-stats', props.eventId, computed(() => props.datetimeFilter)],
  queryFn: () => getData(props.eventId, props.datetimeFilter),
  enabled: computed(() => !!props.eventId),
  staleTime: 1000 * 60 * 2, // 2 minutes
});

const getBadgeVariant = (percentage: number) => {
  if (percentage >= 70)
    return 'default';
  if (percentage >= 50)
    return 'secondary';
  return 'outline';
};

const getProgressColor = (percentage: number) => {
  if (percentage >= 70)
    return 'bg-green-500';
  if (percentage >= 50)
    return 'bg-yellow-500';
  if (percentage >= 30)
    return 'bg-orange-500';
  return 'bg-red-500';
};

// Helper to determine if an answer is "No Answer"
const isNoAnswer = (answer: string) => {
  return answer === 'No Answer' || answer === 'Unknown' || answer === '';
};
</script>

<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="isLoading" class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card v-for="i in 2" :key="i">
        <CardHeader>
          <Skeleton class="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <div v-for="j in 3" :key="j" class="space-y-2">
              <Skeleton class="h-4 w-full" />
              <Skeleton class="h-2 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Error State -->
    <div v-else-if="isError" class="rounded-md bg-red-50 p-4 dark:bg-red-950/50">
      <div class="flex">
        <Icon icon="heroicons:exclamation-triangle" class="size-5 text-red-400" />
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800 dark:text-red-300">
            Error loading custom field statistics
          </h3>
          <div class="mt-2 text-sm text-red-700 dark:text-red-400">
            <p>{{ error?.message || 'Unable to load custom field statistics. Please try again.' }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Data Display -->
    <div v-else-if="customStats && customStats.length > 0" class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div v-for="field, index in customStats" :key="index">
        <Card class="overflow-hidden">
          <CardHeader class="pb-4">
            <CardTitle class="flex items-center gap-2 text-lg font-medium">
              <Icon icon="solar:pie-chart-2-bold-duotone" class="size-5 text-blue-500" />
              {{ field.title }}
            </CardTitle>
          </CardHeader>
          <CardContent class="pt-0">
            <div class="space-y-4">
              <div
                v-for="option in field.data"
                :key="option.answer"
                class="group space-y-3 rounded-lg border border-gray-100 p-4 transition-all hover:border-gray-200 hover:shadow-sm dark:border-gray-800 dark:hover:border-gray-700"
                :class="{ 'opacity-75': isNoAnswer(option.answer) }"
              >
                <!-- Header with answer and stats -->
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span
                      class="text-sm font-medium"
                      :class="isNoAnswer(option.answer) ? 'text-gray-500 italic' : 'text-gray-900 dark:text-gray-100'"
                    >
                      {{ option.answer }}
                    </span>
                    <span class="text-xs text-gray-500 dark:text-gray-400">
                      ({{ formatThousands(option.total_registrations) }} total)
                    </span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {{ formatThousands(option.unique_checkins) }}
                    </span>
                    <Badge :variant="getBadgeVariant(option.checkin_rate)" class="text-xs font-medium">
                      {{ option.checkin_rate }}%
                    </Badge>
                  </div>
                </div>
                <!-- Progress Bar -->
                <div class="relative">
                  <div class="h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      :class="`h-2 rounded-full transition-all duration-500 ease-in-out ${getProgressColor(option.checkin_rate)}`"
                      :style="{ width: `${Math.min(100, option.checkin_rate)}%` }"
                    />
                  </div>
                </div>
                <!-- Statistics Grid -->
                <div class="grid grid-cols-3 gap-2 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                  <div class="text-center">
                    <div class="flex flex-col">
                      <span class="text-lg font-semibold text-green-600 dark:text-green-400">
                        {{ formatThousands(option.currently_present) }}
                      </span>
                      <span class="text-xs text-gray-600 dark:text-gray-400">Present</span>
                    </div>
                  </div>
                  <div class="border-x border-gray-200 text-center dark:border-gray-700">
                    <div class="flex flex-col">
                      <span class="text-lg font-semibold text-orange-600 dark:text-orange-400">
                        {{ formatThousands(option.total_checkouts) }}
                      </span>
                      <span class="text-xs text-gray-600 dark:text-gray-400">Left</span>
                    </div>
                  </div>
                  <div class="text-center">
                    <div class="flex flex-col">
                      <span class="text-lg font-semibold text-gray-600 dark:text-gray-400">
                        {{ formatThousands(option.total_registrations - option.unique_checkins) }}
                      </span>
                      <span class="text-xs text-gray-600 dark:text-gray-400">Pending</span>
                    </div>
                  </div>
                </div>
                <!-- Additional Info for No Answer entries -->
                <div v-if="isNoAnswer(option.answer)" class="rounded-lg bg-yellow-50 p-2 dark:bg-yellow-950/20">
                  <div class="flex items-center gap-2">
                    <Icon icon="heroicons:information-circle" class="size-4 text-yellow-600" />
                    <span class="text-xs text-yellow-700 dark:text-yellow-300">
                      These attendees didn't provide this information during registration
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="rounded-lg border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
      <div class="mx-auto flex size-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
        <Icon icon="heroicons:chart-pie" class="size-8 text-gray-400" />
      </div>
      <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
        No custom field data
      </h3>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Custom field statistics will appear here when questions are configured for this event.
      </p>
      <div class="mt-4">
        <div class="rounded-md bg-blue-50 p-4 dark:bg-blue-950/20">
          <div class="flex">
            <Icon icon="heroicons:information-circle" class="size-5 text-blue-400" />
            <div class="ml-3">
              <p class="text-sm text-blue-700 dark:text-blue-300">
                Configure custom questions in your event insights to see demographic breakdowns and check-in patterns.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
