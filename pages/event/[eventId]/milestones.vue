<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { ref } from 'vue';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useAgenda } from '@/composables/useAgenda';
import { formatCurrency, formatDate } from '@/utils';
import { cn } from '~/lib/utils';

useHead({
  title: 'Milestone',
});

definePageMeta({
  capabilities: ['ee_read_events'],
  group: 'reports',
  icon: 'solar:checklist-minimalistic-bold-duotone',
  layout: 'dashboard-with-sidebar',
  order: 1,
  packages: ['starter', 'smart', 'optima'],
  requiresSelectedEvent: true,
  roles: ['administrator', 'ee_event_organizer', 'ee_event_operator'],
  showInMenu: true,
  title: 'Milestone',
});

const route = useRoute();
const eventId = ref(route.params.eventId as string);

// Filter options
const onlyUpcoming = ref(false);
const agendaParams = computed(() => ({
  only_upcoming: onlyUpcoming.value,
}));

const { agenda, isAgendaLoading, isAgendaError, refetchAgenda } = useAgenda(eventId, agendaParams);

// Collapsible state - track which days are open
const openDays = ref<Set<string>>(new Set());
const allExpanded = ref(false);

// Expanded tickets state - track which items have expanded tickets
const expandedTickets = ref<Set<string>>(new Set());

// Initialize open days based on status
watch(() => agenda.value?.data, (newData) => {
  if (newData && openDays.value.size === 0) {
    // Auto-open completed and active days on first load
    newData.forEach((day) => {
      if (day.status === 'completed' || day.status === 'active') {
        openDays.value.add(day.date);
      }
    });
  }
}, { immediate: true });

// Toggle all days expanded/collapsed
const toggleAllDays = () => {
  if (allExpanded.value) {
    openDays.value.clear();
  }
  else {
    agenda.value?.data.forEach((day) => {
      openDays.value.add(day.date);
    });
  }
  allExpanded.value = !allExpanded.value;
};

// Toggle individual day
const toggleDay = (date: string) => {
  if (openDays.value.has(date)) {
    openDays.value.delete(date);
  }
  else {
    openDays.value.add(date);
  }
  // Update allExpanded state
  allExpanded.value = openDays.value.size === agenda.value?.data.length;
};

// Toggle ticket expansion
const toggleTickets = (itemId: string) => {
  if (expandedTickets.value.has(itemId)) {
    expandedTickets.value.delete(itemId);
  }
  else {
    expandedTickets.value.add(itemId);
  }
};

// Generate unique item ID
const getItemId = (dayIndex: number, itemIndex: number) => {
  return `${dayIndex}-${itemIndex}`;
};

// Calculate time until next milestone
const nextMilestone = computed(() => {
  if (!agenda.value?.progress?.next_milestone)
    return null;

  const nextDate = new Date(agenda.value.progress.next_milestone.date);
  const now = new Date();
  const diff = nextDate.getTime() - now.getTime();

  if (diff <= 0)
    return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  return {
    ...agenda.value.progress.next_milestone,
    days,
    hours,
    isToday: days === 0,
    isTomorrow: days === 1,
  };
});

// Get status icon
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return 'heroicons:check-circle-solid';
    case 'active':
      return 'heroicons:play-circle-solid';
    default:
      return 'heroicons:clock-solid';
  }
};

// Get status color classes
const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'text-green-500';
    case 'active':
      return 'text-blue-500';
    default:
      return 'text-gray-400';
  }
};
</script>

<template>
  <div class="container mx-auto mb-20">
    <header class="mb-6 flex flex-col gap-2 pt-10 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="h2 mb-2">
          Event Milestone
        </h1>
        <p class="text-muted-foreground">
          Track your event's progress from setup to completion
        </p>
      </div>

      <!-- Filter Controls -->
      <div class="flex items-center space-x-4">
        <div class="flex items-center space-x-2">
          <Switch id="upcoming-filter" v-model:checked="onlyUpcoming" class="scale-75" />
          <label for="upcoming-filter" class="cursor-pointer text-sm text-muted-foreground">
            Show upcoming only
          </label>
        </div>
      </div>
    </header>

    <div class="mb-40 space-y-6">
      <!-- Overview Cards (same as before) -->
      <div v-if="agenda?.progress && !onlyUpcoming" class="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <!-- Progress Card -->
        <Card
          class="relative overflow-hidden border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-100 dark:border-blue-800 dark:from-blue-950 dark:to-indigo-900"
        >
          <CardHeader class="pb-2">
            <div class="flex items-center space-x-2">
              <Icon icon="solar:pie-chart-bold-duotone" class="size-5 text-blue-600" />
              <CardTitle class="text-sm font-medium">
                Progress
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div class="space-y-2">
              <div class="text-2xl font-semibold text-blue-600">
                {{ agenda.progress.completion_percentage }}%
              </div>
              <Progress :model-value="agenda.progress.completion_percentage" class="h-2" />
              <p class="text-xs text-muted-foreground">
                {{ agenda.progress.completed_items }} of {{ agenda.progress.total_items }} completed
              </p>
            </div>
          </CardContent>
        </Card>

        <!-- Completed Card -->
        <Card
          class="relative overflow-hidden border-green-200 bg-gradient-to-br from-green-50 to-emerald-100 dark:border-green-800 dark:from-green-950 dark:to-emerald-900"
        >
          <CardHeader class="pb-2">
            <div class="flex items-center space-x-2">
              <Icon icon="solar:check-circle-bold-duotone" class="size-5 text-green-600" />
              <CardTitle class="text-sm font-medium">
                Completed
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-semibold text-green-600">
              {{ agenda.progress.completed_items }}
            </div>
            <p class="text-xs text-muted-foreground">
              Milestones achieved
            </p>
          </CardContent>
        </Card>
        <template v-if="!agenda.progress.is_event_completed">
          <!-- Active Card -->
          <Card
            class="relative overflow-hidden border-orange-200 bg-gradient-to-br from-orange-50 to-amber-100 dark:border-orange-800 dark:from-orange-950 dark:to-amber-900"
          >
            <CardHeader class="pb-2">
              <div class="flex items-center space-x-2">
                <Icon icon="solar:play-circle-bold-duotone" class="size-5 text-orange-600" />
                <CardTitle class="text-sm font-medium">
                  Active
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div class="text-2xl font-semibold text-orange-600">
                {{ agenda.progress.active_items }}
              </div>
              <p class="text-xs text-muted-foreground">
                Currently in progress
              </p>
            </CardContent>
          </Card>

          <!-- Upcoming Card -->
          <Card
            class="relative overflow-hidden border-purple-200 bg-gradient-to-br from-purple-50 to-violet-100 dark:border-purple-800 dark:from-purple-950 dark:to-violet-900"
          >
            <CardHeader class="pb-2">
              <div class="flex items-center space-x-2">
                <Icon icon="solar:clock-circle-bold-duotone" class="size-5 text-purple-600" />
                <CardTitle class="text-sm font-medium">
                  Upcoming
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div class="text-2xl font-semibold text-purple-600">
                {{ agenda.progress.upcoming_items }}
              </div>
              <p class="text-xs text-muted-foreground">
                Still on the horizon
              </p>
            </CardContent>
          </Card>
        </template>
        <Card v-else-if="agenda.progress?.is_event_completed" class=" col-span-2 grid place-items-center text-center">
          <div class="flex items-center justify-center space-x-4 p-6">
            <Icon icon="solar:medal-star-bold-duotone" class="size-16 text-green-600" />
            <div>
              <h3 class="text-xl font-semibold text-green-600">
                Congratulations!
              </h3>
              <p class="text-sm text-muted-foreground">
                All event milestones have been completed successfully.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <!-- Next Milestone Alert (same as before) -->
      <div v-if="nextMilestone" class="relative">
        <Card class="border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/50">
          <CardContent class="pt-6">
            <div class="flex items-start space-x-4">
              <div class="rounded-full bg-blue-100 p-2 dark:bg-blue-900">
                <Icon icon="solar:calendar-mark-bold-duotone" class="size-6 text-blue-600" />
              </div>
              <div class="flex-1">
                <h3 class="font-semibold text-blue-700 dark:text-blue-300">
                  Next Milestone: {{ nextMilestone.title }}
                </h3>
                <p class="mt-1 text-sm text-blue-600 dark:text-blue-400">
                  {{ formatDate(nextMilestone.date, 'EEEE, dd MMMM yyyy') }}
                </p>
                <div class="mt-2 flex items-center space-x-4 text-sm text-blue-600 dark:text-blue-400">
                  <span v-if="nextMilestone.isToday" class="font-medium">Today</span>
                  <span v-else-if="nextMilestone.isTomorrow" class="font-medium">Tomorrow</span>
                  <span v-else>{{ nextMilestone.days }} days, {{ nextMilestone.hours }} hours</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Milestone Timeline -->
      <Card class="relative overflow-hidden">
        <CardHeader>
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <Icon icon="solar:calendar-search-bold-duotone" class="size-7 text-indigo-500" />
              <div>
                <CardTitle class="text-xl font-semibold">
                  Event Timeline
                </CardTitle>
                <p class="mt-1 text-sm text-muted-foreground">
                  {{ onlyUpcoming ? 'Upcoming milestones' : 'Complete event timeline' }}
                </p>
              </div>
            </div>

            <div class="flex items-center space-x-2">
              <Button
                v-if="agenda?.data?.length"
                variant="ghost"
                size="sm"
                @click="toggleAllDays"
              >
                <Icon :icon="allExpanded ? 'heroicons:chevron-up' : 'heroicons:chevron-down'" class="mr-2 size-4" />
                {{ allExpanded ? 'Collapse All' : 'Expand All' }}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <!-- Loading, Error, and Empty states (same as before) -->
          <div v-if="isAgendaLoading" class="space-y-6">
            <div v-for="i in 4" :key="i" class="space-y-2">
              <Skeleton class="h-6 w-32" />
              <div class="space-y-2 pl-8">
                <Skeleton class="h-4 w-full" />
                <Skeleton class="h-4 w-3/4" />
              </div>
            </div>
          </div>

          <div v-else-if="isAgendaError" class="flex flex-col items-center py-12 text-center">
            <Icon icon="solar:danger-triangle-bold-duotone" class="mb-4 size-16 text-red-500" />
            <h3 class="mb-2 text-lg font-semibold">
              Unable to load milestone data
            </h3>
            <p class="mb-4 text-sm text-muted-foreground">
              There was an error loading your event timeline
            </p>
            <Button variant="outline" size="sm" @click="refetchAgenda">
              <Icon icon="heroicons:arrow-path" class="mr-2 size-4" />
              Try Again
            </Button>
          </div>

          <div v-else-if="!agenda?.data?.length" class="flex flex-col items-center py-12 text-center">
            <Icon icon="solar:calendar-bold-duotone" class="mb-4 size-16 text-muted-foreground" />
            <h3 class="mb-2 text-lg font-semibold">
              No milestones found
            </h3>
            <p class="text-sm text-muted-foreground">
              {{ onlyUpcoming ? 'No upcoming milestones for this event' : 'No timeline data available for this event' }}
            </p>
          </div>

          <!-- Timeline content with Collapsibles -->
          <div v-else class="">
            <div v-for="(day, dayIndex) in agenda.data" :key="day.date" class="relative">
              <!-- Vertical connector line -->
              <div
                v-if="dayIndex < agenda.data.length - 1"
                :class="cn(
                  'absolute left-10 top-14 h-[calc(100%-56px)] w-0.5',
                  day.status === 'completed' ? 'bg-green-200' : 'bg-gray-200 dark:bg-gray-700',
                )"
              />

              <Collapsible :open="openDays.has(day.date)" @update:open="() => toggleDay(day.date)">
                <div class="relative">
                  <CollapsibleTrigger
                    class="flex w-full items-center gap-4 rounded-lg bg-card p-4 transition-colors hover:bg-accent/50"
                  >
                    <!-- Status Icon -->
                    <div
                      :class="cn(
                        'flex size-12 items-center justify-center rounded-full border-2 bg-white dark:bg-gray-900',
                        day.status === 'completed' ? 'border-green-500'
                        : day.status === 'active' ? 'border-blue-500'
                          : 'border-gray-300 dark:border-gray-600',
                      )"
                    >
                      <Icon :icon="getStatusIcon(day.status)" :class="cn('size-6', getStatusColor(day.status))" />
                    </div>

                    <!-- Day Info -->
                    <div class="flex-1 text-left">
                      <div class="flex items-center justify-between gap-2">
                        <h3 class="text-lg font-semibold">
                          {{ day.formatted_date }}
                        </h3>
                      </div>
                      <p class="text-sm text-muted-foreground">
                        {{ day.day_name }} • {{ day.item_count }}
                        {{ day.item_count === 1 ? 'milestone' : 'milestones' }}
                      </p>
                    </div>

                    <!-- Expand/Collapse Icon -->
                    <Icon
                      :icon="openDays.has(day.date) ? 'heroicons:chevron-up' : 'heroicons:chevron-down'"
                      class="size-5 text-muted-foreground"
                    />
                  </CollapsibleTrigger>

                  <CollapsibleContent class="mt-2 space-y-2 pb-5 pl-16">
                    <div
                      v-for="(item, itemIndex) in day.items"
                      :key="itemIndex"
                      class="rounded-lg border bg-card/50 p-4"
                    >
                      <div class="space-y-3">
                        <!-- Item Header -->
                        <div>
                          <div class="flex items-center gap-2">
                            <h4 class="text-base font-semibold">
                              {{ item.title }}
                            </h4>
                            <Badge v-if="item.count && item.count > 1" variant="outline" class="text-xs">
                              {{ item.count }}
                            </Badge>
                          </div>
                        </div>

                        <!-- DateTime Info -->
                        <div v-if="item.datetime_info" class="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div class="flex items-center gap-2">
                            <Icon icon="heroicons:clock" class="size-4" />
                            <span>{{ item.datetime_info.time_range }}</span>
                          </div>
                          <div v-if="item.datetime_info.sold > 0" class="flex items-center gap-2">
                            <Icon icon="heroicons:users" class="size-4" />
                            <span>{{ item.datetime_info.sold }} registered</span>
                          </div>
                          <div v-if="item.datetime_info.available !== null" class="flex items-center gap-2">
                            <Icon icon="heroicons:ticket" class="size-4" />
                            <span>{{ item.datetime_info.available }} available</span>
                          </div>
                        </div>

                        <!-- Tickets -->
                        <div v-if="item.tickets && item.tickets.length > 0" class="space-y-2">
                          <div class="flex flex-wrap gap-2">
                            <Badge
                              v-for="(ticket) in expandedTickets.has(getItemId(dayIndex, itemIndex))
                                ? item.tickets
                                : item.tickets.slice(0, 3)"
                              :key="ticket.ticket_id"
                              variant="outline"
                              class="text-sm"
                            >
                              {{ ticket.ticket_name }}
                              <span v-if="ticket.ticket_price > 0" class="ml-1 font-normal text-muted-foreground">
                                {{ formatCurrency(ticket.ticket_price) }}
                              </span>
                            </Badge>

                            <Button
                              v-if="item.tickets.length > 3"
                              variant="ghost"
                              size="sm"
                              class="h-6 px-2 text-xs"
                              @click="toggleTickets(getItemId(dayIndex, itemIndex))"
                            >
                              <Icon
                                :icon="expandedTickets.has(getItemId(dayIndex, itemIndex))
                                  ? 'heroicons:chevron-up'
                                  : 'heroicons:chevron-down'"
                                class="mr-1 size-3"
                              />
                              {{ expandedTickets.has(getItemId(dayIndex, itemIndex))
                                ? 'Show less'
                                : `+${item.tickets.length - 3} more` }}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
