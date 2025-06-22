<!-- components/partials/event/EventAgenda.vue -->
<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { ref } from 'vue';

import type { AgendaItem } from '@/types/agenda';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Stepper, StepperDescription, StepperIndicator, StepperItem, StepperSeparator, StepperTitle } from '@/components/ui/stepper';
import { Switch } from '@/components/ui/switch';
import { useAgenda } from '@/composables/useAgenda';
import { formatDate } from '@/utils';
import { cn } from '~/lib/utils';

const route = useRoute();
const eventId = ref(route.params.eventId as string);

// Filter options
const onlyUpcoming = ref(false);
const agendaParams = computed(() => ({
  only_upcoming: onlyUpcoming.value,
}));

const { agenda, isAgendaLoading, isAgendaError } = useAgenda(eventId, agendaParams);

// Stepper state
const currentStep = ref(0);

const getItemIcon = (item: AgendaItem) => {
  switch (item.type) {
    case 'event_setup':
      return 'solar:settings-bold-duotone';
    case 'registration_opens':
      return 'solar:ticket-sale-bold-duotone';
    case 'registration_closes':
      return 'solar:close-circle-bold-duotone';
    case 'event_datetime':
      return 'solar:calendar-date-bold-duotone';
    default:
      return 'solar:calendar-bold-duotone';
  }
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'completed':
      return 'secondary';
    case 'active':
      return 'default';
    case 'upcoming':
      return 'outline';
    default:
      return 'outline';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'text-green-500';
    case 'active':
      return 'text-blue-500';
    case 'upcoming':
      return 'text-gray-500';
    default:
      return 'text-gray-500';
  }
};
</script>

<template>
  <Card class="relative overflow-hidden">
    <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-4">
      <div class="flex items-center space-x-3">
        <div>
          <CardTitle class="text-lg font-semibold">
            Event Timeline
          </CardTitle>
          <p v-if="agenda?.progress" class="text-sm text-muted-foreground">
            {{ agenda.progress.completed_items }} of {{ agenda.progress.total_items }} milestones completed
          </p>
        </div>
      </div>
      <div class="flex items-center space-x-3">
        <div class="flex items-center space-x-2">
          <Switch id="upcoming-filter" v-model:checked="onlyUpcoming" class="scale-75" />
          <label for="upcoming-filter" class="cursor-pointer text-sm text-muted-foreground">
            Upcoming only
          </label>
        </div>
        <Icon icon="solar:calendar-search-bold-duotone" class="size-7 text-orange-500" />
      </div>
    </CardHeader>

    <CardContent>
      <!-- Progress bar -->
      <div v-if="agenda?.progress && !onlyUpcoming" class="mb-6">
        <div class="mb-2 flex items-center justify-between">
          <span class="text-sm font-medium">Progress</span>
          <span class="text-sm text-muted-foreground">{{ agenda.progress.completion_percentage }}%</span>
        </div>
        <Progress :value="agenda.progress.completion_percentage" class="h-2" />
        <div v-if="agenda.progress.next_milestone" class="mt-2 text-xs text-muted-foreground">
          Next: {{ agenda.progress.next_milestone.title }} on {{ formatDate(agenda.progress.next_milestone.date, 'MMM dd, yyyy') }}
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="isAgendaLoading" class="space-y-6">
        <div v-for="i in 3" :key="i" class="space-y-2">
          <Skeleton class="h-6 w-32" />
          <div class="space-y-2 pl-4">
            <Skeleton class="h-4 w-full" />
            <Skeleton class="h-4 w-3/4" />
          </div>
        </div>
      </div>

      <!-- Error state -->
      <div v-else-if="isAgendaError" class="flex flex-col items-center py-8 text-center">
        <Icon icon="solar:danger-triangle-bold-duotone" class="mb-2 size-12 text-red-500" />
        <span class="text-sm text-muted-foreground">Error loading agenda</span>
      </div>

      <!-- Empty state -->
      <div v-else-if="!agenda?.data?.length" class="flex flex-col items-center py-8 text-center">
        <Icon icon="solar:calendar-bold-duotone" class="mb-2 size-12 text-muted-foreground" />
        <span class="text-sm text-muted-foreground">
          {{ onlyUpcoming ? 'No upcoming agenda items' : 'No agenda items available' }}
        </span>
      </div>

      <!-- Stepper agenda (without collapsible) -->
      <div v-else>
        <Stepper v-model="currentStep" orientation="vertical" class="flex flex-col gap-4">
          <StepperItem
            v-for="(day, dayIndex) in agenda.data"
            :key="day.date"
            :step="dayIndex + 1"
            class="group"
          >
            <!-- Day header with stepper -->
            <div class="flex w-full items-start gap-4">
              <div class="flex flex-col items-center">
                <StepperIndicator
                  :class="cn(
                    'flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors',
                    day.status === 'completed' ? 'bg-green-500 border-green-500 text-white'
                    : day.status === 'active' ? 'bg-blue-500 border-blue-500 text-white'
                      : 'bg-background border-muted-foreground text-muted-foreground',
                  )"
                >
                  <Icon v-if="day.status === 'completed'" icon="heroicons:check" class="size-4" />
                  <Icon v-else-if="day.status === 'active'" icon="heroicons:play" class="size-4" />
                  <span v-else class="text-xs font-medium">{{ dayIndex + 1 }}</span>
                </StepperIndicator>

                <!-- Vertical line -->
                <StepperSeparator v-if="dayIndex < agenda.data.length - 1" class="mt-2 h-8 w-0.5 bg-border" />
              </div>

              <!-- Day content -->
              <div class="min-w-0 flex-1">
                <div class="mb-3 flex items-center justify-between">
                  <div>
                    <StepperTitle class="text-base font-semibold">
                      {{ day.formatted_date }}
                    </StepperTitle>
                    <StepperDescription class="text-sm text-muted-foreground">
                      {{ day.day_name }} • {{ day.item_count }}
                      {{ day.item_count === 1 ? 'item' : 'items' }}
                    </StepperDescription>
                  </div>

                  <Badge :variant="getStatusVariant(day.status)" class="text-xs">
                    {{ day.status.charAt(0).toUpperCase() + day.status.slice(1) }}
                  </Badge>
                </div>

                <!-- Day items (always visible) -->
                <div class="space-y-3 pb-4">
                  <div
                    v-for="(item, itemIndex) in day.items"
                    :key="itemIndex"
                    class="flex items-start space-x-3 rounded-lg border bg-card/50 p-3 transition-colors hover:bg-accent/30"
                  >
                    <!-- Item icon -->
                    <div
                      class="flex size-8 shrink-0 items-center justify-center rounded-full border-2"
                      :class="item.status === 'completed' ? 'bg-green-100 border-green-500 dark:bg-green-950'
                        : item.status === 'active' ? 'bg-blue-100 border-blue-500 dark:bg-blue-950'
                          : 'bg-gray-100 border-gray-400 dark:bg-gray-900'"
                    >
                      <Icon :icon="getItemIcon(item)" class="size-4" :class="getStatusColor(item.status)" />
                    </div>

                    <!-- Item content -->
                    <div class="min-w-0 flex-1">
                      <div class="flex items-start justify-between">
                        <div class="flex-1">
                          <div class="mb-1 flex items-center space-x-2">
                            <h4 class="text-sm font-medium">
                              {{ item.title }}
                            </h4>
                            <Badge v-if="item.count && item.count > 1" variant="outline" class="scale-90 text-xs">
                              {{ item.count }}
                            </Badge>
                          </div>

                          <p class="mb-2 text-sm text-muted-foreground">
                            {{ item.description }}
                          </p>

                          <!-- DateTime specific info -->
                          <div v-if="item.datetime_info" class="space-y-2">
                            <div class="flex items-center space-x-4 text-xs text-muted-foreground">
                              <div class="flex items-center space-x-1">
                                <Icon icon="heroicons:clock" class="size-3" />
                                <span>{{ item.datetime_info.time_range }}</span>
                              </div>
                              <div v-if="item.datetime_info.sold > 0" class="flex items-center space-x-1">
                                <Icon icon="heroicons:users" class="size-3" />
                                <span>{{ item.datetime_info.sold }} registered</span>
                              </div>
                            </div>
                          </div>

                          <!-- Tickets info -->
                          <div v-if="item.tickets && item.tickets.length > 0" class="mt-2">
                            <div class="flex flex-wrap gap-1">
                              <Badge
                                v-for="ticket in item.tickets.slice(0, 3)"
                                :key="ticket.ticket_id"
                                variant="outline"
                                class="text-xs"
                              >
                                {{ ticket.ticket_name }}
                              </Badge>
                              <Badge v-if="item.tickets.length > 3" variant="outline" class="text-xs">
                                +{{ item.tickets.length - 3 }} more
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <!-- Status indicator -->
                        <Badge :variant="getStatusVariant(item.status)" class="ml-2 text-xs">
                          <Icon v-if="item.status === 'completed'" icon="heroicons:check-circle" class="mr-1 size-3" />
                          <Icon v-else-if="item.status === 'active'" icon="heroicons:play-circle" class="mr-1 size-3" />
                          <Icon v-else icon="heroicons:clock" class="mr-1 size-3" />
                          {{ item.status }}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </StepperItem>
        </Stepper>

        <!-- Summary footer -->
        <div v-if="agenda.progress && !onlyUpcoming" class="mt-6 rounded-lg bg-muted/50 p-4">
          <div class="grid grid-cols-3 gap-4 text-center">
            <div>
              <div class="text-lg font-semibold text-green-600">
                {{ agenda.progress.completed_items }}
              </div>
              <div class="text-xs text-muted-foreground">
                Completed
              </div>
            </div>
            <div>
              <div class="text-lg font-semibold text-blue-600">
                {{ agenda.progress.active_items }}
              </div>
              <div class="text-xs text-muted-foreground">
                Active
              </div>
            </div>
            <div>
              <div class="text-lg font-semibold text-gray-600">
                {{ agenda.progress.upcoming_items }}
              </div>
              <div class="text-xs text-muted-foreground">
                Upcoming
              </div>
            </div>
          </div>

          <div v-if="agenda.progress.is_event_completed" class="mt-4 text-center">
            <Badge variant="default" class="bg-green-500">
              <Icon icon="heroicons:trophy" class="mr-1 size-3" />
              Event Complete!
            </Badge>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
