<!-- components/partials/dashboard/SessionsCapacity.vue -->
<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { useQuery } from '@tanstack/vue-query';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateRange, formatThousands } from '@/utils';

interface SessionCapacity {
  id: string
  name: string
  date_start: string
  date_end: string
  sold: number
  available: number | null
  reg_limit: number | null
  capacity_percentage: number
  is_active: boolean
  is_upcoming: boolean
  is_expired: boolean
  status: string
}

const route = useRoute();
const eventId = ref(route.params.eventId as string);

const getSessionsCapacity = async (evtId: Ref<string>) => {
  const { $galantisApi } = useNuxtApp();
  const response = await $galantisApi.get(`/event/${evtId.value}/datetimes`);
  return response.data;
};

const { data: sessions, isLoading, isError } = useQuery({
  enabled: !!eventId.value,
  queryFn: () => getSessionsCapacity(eventId),
  queryKey: ['sessionsCapacity', eventId],
});

// Enhanced sessions with computed properties
const enhancedSessions = computed(() => {
  if (!sessions.value)
    return [];

  return sessions.value.map((session: SessionCapacity) => {
    const sold = session.sold || 0;
    const limit = session.reg_limit || 0;
    const percentage = limit > 0 ? Math.round((sold / limit) * 100) : 0;
    const isFull = limit > 0 && sold >= limit;

    return {
      ...session,
      percentage,
      isFull,
    };
  });
});

// Get session status with enhanced styling
const getSessionStatus = (session: any) => {
  // Check if session is full first
  if (session.isFull) {
    return {
      label: 'Full',
      class: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
      icon: 'heroicons:x-circle',
    };
  }

  // Then check time-based status
  if (session.is_expired) {
    return {
      label: 'Ended',
      class: 'bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-300',
      icon: 'heroicons:check-circle',
    };
  }

  if (session.is_active) {
    return {
      label: 'Active',
      class: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
      icon: 'heroicons:play-circle',
    };
  }

  // Check if almost full
  if (session.percentage > 80) {
    return {
      label: 'Limited',
      class: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
      icon: 'heroicons:exclamation-circle',
    };
  }

  if (session.is_upcoming) {
    return {
      label: 'Upcoming',
      class: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
      icon: 'heroicons:clock',
    };
  }

  return {
    label: 'Available',
    class: 'bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-300',
    icon: 'heroicons:information-circle',
  };
};

// Get progress bar colors
const getProgressColor = (percentage: number) => {
  if (percentage >= 90)
    return 'bg-red-200 dark:bg-red-900';
  if (percentage >= 70)
    return 'bg-orange-200 dark:bg-orange-900';
  if (percentage >= 50)
    return 'bg-yellow-200 dark:bg-yellow-900';
  return 'bg-green-200 dark:bg-green-900';
};

const getProgressFillColor = (percentage: number) => {
  if (percentage >= 90)
    return 'bg-red-500 dark:bg-red-400';
  if (percentage >= 70)
    return 'bg-orange-500 dark:bg-orange-400';
  if (percentage >= 50)
    return 'bg-yellow-500 dark:bg-yellow-400';
  return 'bg-green-500 dark:bg-green-400';
};

// Get border color for session cards
const getSessionBorderColor = (session: any) => {
  if (session.isFull)
    return 'border-l-red-500';
  if (session.is_expired)
    return 'border-l-gray-500';
  if (session.is_active)
    return 'border-l-green-500';
  if (session.percentage > 80)
    return 'border-l-orange-500';
  return 'border-l-blue-500';
};
</script>

<template>
  <Card class="relative overflow-hidden">
    <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle class="text-sm font-medium tracking-normal">
        Sessions Capacity
      </CardTitle>
      <Icon icon="solar:calendar-search-bold-duotone" class="size-7 text-orange-500" />
    </CardHeader>
    <CardContent class="scroll-area max-h-[400px] overflow-y-auto">
      <div v-if="isLoading" class="space-y-3">
        <Skeleton v-for="i in 3" :key="i" class="h-20 w-full" />
      </div>

      <div v-else-if="isError" class="text-center text-sm text-muted-foreground">
        Error loading sessions
      </div>

      <div
        v-else-if="!enhancedSessions || enhancedSessions.length === 0"
        class="py-4 text-center text-sm text-muted-foreground"
      >
        No sessions available
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="session in enhancedSessions"
          :key="session.id"
          class="rounded-lg border border-l-4 p-3 transition-all duration-200 hover:bg-accent/50"
          :class="getSessionBorderColor(session)"
        >
          <!-- Header with name and status -->
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between gap-2">
                <h4 class="truncate text-sm font-medium">
                  {{ session.name }}
                </h4>
                <Badge class="shrink-0 text-xs font-medium" :class="getSessionStatus(session).class">
                  <Icon :icon="getSessionStatus(session).icon" class="mr-1 size-3" />
                  {{ getSessionStatus(session).label }}
                </Badge>
              </div>

              <!-- Date range -->
              <div class="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Icon icon="heroicons:calendar" class="size-3" />
                {{ formatDateRange(session.date_start, session.date_end) }}
              </div>
            </div>
          </div>

          <!-- Capacity info and progress -->
          <div class="mt-3 space-y-1">
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">
                <span class="font-medium text-foreground">{{ formatThousands(session.sold) }}</span> registered
                <span v-if="session.reg_limit">
                  of {{ formatThousands(session.reg_limit) }}
                </span>
                <span v-else class="text-xs">
                  (unlimited)
                </span>
              </span>
              <span
                class="font-medium"
                :class="{
                  'text-red-600 dark:text-red-400': session.percentage >= 90,
                  'text-orange-600 dark:text-orange-400': session.percentage >= 70 && session.percentage < 90,
                  'text-yellow-600 dark:text-yellow-400': session.percentage >= 50 && session.percentage < 70,
                }"
              >
                {{ session.reg_limit > 0 ? `${session.percentage}%` : '-' }}
              </span>
            </div>

            <!-- Progress bar -->
            <div
              v-if="session.reg_limit > 0"
              class="relative h-1.5 w-full overflow-hidden rounded-full"
              :class="getProgressColor(session.percentage)"
            >
              <div
                class="h-full rounded-full transition-all duration-300 ease-out"
                :class="getProgressFillColor(session.percentage)"
                :style="{ width: `${Math.min(session.percentage, 100)}%` }"
              />
            </div>

            <!-- Warning messages -->
            <div
              v-if="session.percentage >= 90 && !session.isFull"
              class="mt-1 flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400"
            >
              <Icon icon="heroicons:exclamation-triangle" class="size-3" />
              Almost full - only {{ session.reg_limit - session.sold }} spots left
            </div>

            <div v-else-if="session.isFull" class="mt-1 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
              <Icon icon="heroicons:x-circle" class="size-3" />
              This session is fully booked
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
