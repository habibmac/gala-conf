<!-- components/partials/dashboard/AgendaProgress.vue -->
<script setup lang="ts">
import { Icon } from '@iconify/vue';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAgenda } from '@/composables/useAgenda';

const route = useRoute();
const eventId = ref(route.params.eventId as string);

// Only get upcoming items for this simple card
const agendaParams = ref({ only_upcoming: true });
const { agenda, isAgendaLoading, isAgendaError } = useAgenda(eventId, agendaParams);

const statusConfig = computed(() => {
  if (!agenda.value?.progress)
    return null;

  const progress = agenda.value.progress;

  if (progress.is_event_completed) {
    return {
      title: 'Event Complete!',
      subtitle: 'All milestones achieved',
      icon: 'solar:medal-star-bold-duotone',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
    };
  }
  else if (progress.active_items > 0) {
    return {
      title: 'In Progress',
      subtitle: `${progress.active_items} active milestone${progress.active_items > 1 ? 's' : ''}`,
      icon: 'solar:play-circle-bold-duotone',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
    };
  }
  else {
    return {
      title: 'Upcoming',
      subtitle: `${progress.upcoming_items} milestone${progress.upcoming_items > 1 ? 's' : ''} ahead`,
      icon: 'solar:calendar-date-bold-duotone',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
    };
  }
});

const progressPercentage = computed(() => {
  if (!agenda.value?.progress)
    return 0;
  return agenda.value.progress.completion_percentage;
});
</script>

<template>
  <Card
    class="relative h-full overflow-hidden border-emerald-200 bg-gradient-to-b from-emerald-200 to-emerald-400 dark:border-emerald-800 dark:from-emerald-600"
  >
    <CardHeader>
      <NuxtLink :to="`/event/${eventId}/milestones`" class="flex flex-row items-center justify-between hover:underline">
        <CardTitle class="text-sm font-medium tracking-normal">
          Milestone
        </CardTitle>
        <Icon icon="solar:checklist-minimalistic-bold-duotone" class="size-7 text-emerald-500" />
      </NuxtLink>
    </CardHeader>
    <CardContent>
      <div v-if="isAgendaLoading" class="space-y-3">
        <Skeleton class="h-8 w-20" />
        <Skeleton class="h-4 w-32" />
        <Skeleton class="h-2 w-full" />
      </div>

      <div v-else-if="isAgendaError" class="py-4 text-center text-sm text-muted-foreground">
        Error loading progress
      </div>

      <div v-else-if="!agenda?.progress" class="py-4 text-center text-sm text-muted-foreground">
        No progress data available
      </div>

      <div v-else class="space-y-4 ">
        <!-- Status section -->
        <div v-if="statusConfig" class="text-center">
          <div class="mb-3 inline-flex size-16 items-center justify-center rounded-full" :class="statusConfig.bgColor">
            <Icon :icon="statusConfig.icon" class="size-8" :class="statusConfig.color" />
          </div>
          <div class="space-y-1">
            <div class="text-2xl font-bold tabular-nums text-white">
              {{ progressPercentage }}%
            </div>
            <div class="text-sm font-medium">
              {{ statusConfig.title }}
            </div>
          </div>
        </div>

        <!-- Progress visualization -->
        <div class="space-y-2">
          <div class="flex justify-between text-xs dark:text-emerald-500">
            <div v-if="statusConfig && statusConfig.subtitle" class="text-xs">
              {{ statusConfig.subtitle }}
            </div>
            <span>{{ agenda.progress.completed_items }}/{{ agenda.progress.total_items }}</span>
          </div>
          <div class="h-1 w-full rounded-full bg-emerald-200 dark:bg-emerald-900">
            <div
              class="h-1 rounded-full bg-emerald-600 transition-all duration-500 ease-out dark:bg-emerald-300"
              :style="{ width: `${progressPercentage}%` }"
            />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
