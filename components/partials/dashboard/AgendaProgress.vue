<!-- components/partials/dashboard/AgendaProgress.vue -->
<script setup lang="ts">
import { Icon } from '@iconify/vue';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAgenda } from '@/composables/useAgenda';
import { formatDate } from '@/utils';

const route = useRoute();
const eventId = computed(() => route.params.eventId as string || '');

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

const nextMilestone = computed(() => {
  if (!agenda.value?.progress?.next_milestone)
    return null;
  return agenda.value.progress.next_milestone;
});
</script>

<template>
  <Card class="relative overflow-hidden border-emerald-200 dark:border-emerald-800">
    <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle class="text-sm font-medium tracking-normal">
        Agenda Progress
      </CardTitle>
      <Icon icon="solar:checklist-minimalistic-bold-duotone" class="size-7 text-emerald-500" />
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

      <div v-else class="space-y-4">
        <!-- Status section -->
        <div v-if="statusConfig" class="text-center">
          <div
            class="mb-3 inline-flex size-16 items-center justify-center rounded-full"
            :class="statusConfig.bgColor"
          >
            <Icon :icon="statusConfig.icon" class="size-8" :class="statusConfig.color" />
          </div>
          <div class="space-y-1">
            <div class="text-2xl font-bold tabular-nums text-emerald-600">
              {{ progressPercentage }}%
            </div>
            <div class="text-sm font-medium">
              {{ statusConfig.title }}
            </div>
            <div class="text-xs text-muted-foreground">
              {{ statusConfig.subtitle }}
            </div>
          </div>
        </div>

        <!-- Progress visualization -->
        <div class="space-y-2">
          <div class="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{{ agenda.progress.completed_items }}/{{ agenda.progress.total_items }}</span>
          </div>
          <div class="h-2 w-full rounded-full bg-emerald-100 dark:bg-emerald-900">
            <div
              class="h-2 rounded-full bg-emerald-500 transition-all duration-500 ease-out"
              :style="{ width: `${progressPercentage}%` }"
            />
          </div>
        </div>

        <!-- Next milestone -->
        <div v-if="nextMilestone" class="mt-4 rounded-lg p-3" :class="statusConfig?.bgColor">
          <div class="flex items-start space-x-2">
            <Icon icon="solar:clock-circle-bold-duotone" class="mt-0.5 size-4 text-emerald-600" />
            <div class="min-w-0 flex-1">
              <div class="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                Next milestone
              </div>
              <div class="text-sm font-medium">
                {{ nextMilestone.title }}
              </div>
              <div class="text-xs text-emerald-600 dark:text-emerald-400">
                {{ formatDate(nextMilestone.date, 'MMM dd, yyyy') }}
              </div>
            </div>
          </div>
        </div>

        <!-- Statistics grid -->
        <div class="grid grid-cols-3 gap-2 pt-2">
          <div class="text-center">
            <div class="text-lg font-semibold tabular-nums text-emerald-600">
              {{ agenda.progress.completed_items }}
            </div>
            <div class="text-xs text-muted-foreground">
              Done
            </div>
          </div>
          <div class="text-center">
            <div class="text-lg font-semibold tabular-nums text-blue-600">
              {{ agenda.progress.active_items }}
            </div>
            <div class="text-xs text-muted-foreground">
              Active
            </div>
          </div>
          <div class="text-center">
            <div class="text-lg font-semibold tabular-nums text-gray-600">
              {{ agenda.progress.upcoming_items }}
            </div>
            <div class="text-xs text-muted-foreground">
              Pending
            </div>
          </div>
        </div>

        <!-- Completion badge -->
        <div v-if="agenda.progress.is_event_completed" class="pt-2 text-center">
          <Badge class="bg-emerald-500 hover:bg-emerald-600">
            <Icon icon="solar:crown-bold-duotone" class="mr-1 size-3" />
            All Complete!
          </Badge>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
