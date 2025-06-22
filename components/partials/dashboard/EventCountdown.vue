<!-- components/partials/dashboard/EventCountdown.vue -->
<script setup lang="ts">
import { Icon } from '@iconify/vue';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEvent } from '@/composables/useEvent';

interface CountdownTime {
  days: number
  hours: number
  minutes: number
  seconds: number
}

const { event } = useEvent();

const countdown = ref<CountdownTime>({
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
});

const eventStatus = ref<'upcoming' | 'active' | 'ended'>('upcoming');

const calculateCountdown = () => {
  if (!event.value)
    return;

  const now = new Date();
  const startDate = new Date(event.value.date_start);
  const endDate = new Date(event.value.end_date);

  let targetDate: Date;

  if (now < startDate) {
    eventStatus.value = 'upcoming';
    targetDate = startDate;
  }
  else if (now >= startDate && now <= endDate) {
    eventStatus.value = 'active';
    targetDate = endDate;
  }
  else {
    eventStatus.value = 'ended';
    return;
  }

  const diff = targetDate.getTime() - now.getTime();

  if (diff > 0) {
    countdown.value = {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
    };
  }
};

const statusConfig = computed(() => {
  switch (eventStatus.value) {
    case 'upcoming':
      return {
        title: 'Event Starts In',
        subtitle: 'Until event begins',
        icon: 'solar:calendar-date-bold-duotone',
        color: 'text-blue-500',
        gradientFrom: 'from-blue-500',
        gradientTo: 'to-blue-600',
      };
    case 'active':
      return {
        title: 'Event Ends In',
        subtitle: 'Until event concludes',
        icon: 'solar:clock-circle-bold-duotone',
        color: 'text-green-500',
        gradientFrom: 'from-green-500',
        gradientTo: 'to-green-600',
      };
    case 'ended':
      return {
        title: 'Congratulations!',
        subtitle: 'You have completed the event',
        icon: 'solar:check-circle-bold-duotone',
        color: 'text-gray-500',
        gradientFrom: 'from-gray-500',
        gradientTo: 'to-gray-600',
      };
    default:
      return {
        title: 'Event Countdown',
        subtitle: 'Calculating...',
        icon: 'solar:hourglass-bold-duotone',
        color: 'text-yellow-500',
        gradientFrom: 'from-yellow-500',
        gradientTo: 'to-yellow-600',
      };
  }
});

// Calculate progress percentages for circular indicators
const progressValues = computed(() => {
  const dayProgress = Math.min((countdown.value.days / 365) * 100, 100);
  const hourProgress = (countdown.value.hours / 24) * 100;
  const minuteProgress = (countdown.value.minutes / 60) * 100;
  const secondProgress = (countdown.value.seconds / 60) * 100;

  return {
    days: dayProgress,
    hours: hourProgress,
    minutes: minuteProgress,
    seconds: secondProgress,
  };
});

let intervalId: NodeJS.Timeout | null = null;

onMounted(() => {
  calculateCountdown();
  if (eventStatus.value !== 'ended') {
    intervalId = setInterval(calculateCountdown, 1000);
  }
});

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId);
  }
});

watch(event, () => {
  calculateCountdown();
});
</script>

<template>
  <Card class="relative h-full overflow-hidden border bg-gradient-to-br from-slate-900 to-slate-800">
    <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle class="text-sm font-medium tracking-normal text-white">
        {{ statusConfig.title }}
      </CardTitle>
      <Icon :icon="statusConfig.icon" class="size-7" :class="statusConfig.color" />
    </CardHeader>
    <CardContent class="space-y-4">
      <div v-if="eventStatus === 'ended'" class="flex flex-col items-center space-y-2 py-8">
        <Icon icon="solar:medal-star-bold-duotone" class="size-16 text-yellow-500" />
        <span class="text-xl font-semibold text-white">Congratulations!</span>
        <span class="text-sm text-slate-400">{{ statusConfig.subtitle }}</span>
      </div>

      <div v-else class="space-y-4">
        <!-- Main countdown display -->
        <div class="text-center">
          <div class="text-3xl font-semibold tabular-nums text-white">
            {{ countdown.days }}
            <span class="text-lg font-normal text-slate-400">days</span>
          </div>
          <div class="text-xs text-slate-500">
            {{ statusConfig.subtitle }}
          </div>
        </div>

        <!-- Circular progress indicators -->
        <div class="grid grid-cols-3 gap-3">
          <!-- Days (when > 0) -->
          <div v-if="countdown.days > 0" class="flex flex-col items-center">
            <div class="relative size-12">
              <svg class="size-full -rotate-90" viewBox="0 0 36 36">
                <!-- Background circle -->
                <path
                  class="stroke-slate-700"
                  stroke-width="3"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <!-- Progress circle -->
                <path
                  class="stroke-blue-500"
                  stroke-width="3"
                  fill="none"
                  stroke-linecap="round"
                  :stroke-dasharray="`${progressValues.days}, 100`"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div class="absolute inset-0 flex items-center justify-center">
                <span class="text-sm font-semibold tabular-nums text-white">{{ countdown.days }}</span>
              </div>
            </div>
            <span class="mt-1 text-xs text-slate-400">Days</span>
          </div>

          <!-- Hours -->
          <div class="flex flex-col items-center">
            <div class="relative size-12">
              <svg class="size-full -rotate-90" viewBox="0 0 36 36">
                <path
                  class="stroke-slate-700"
                  stroke-width="3"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  class="stroke-blue-500"
                  stroke-width="3"
                  fill="none"
                  stroke-linecap="round"
                  :stroke-dasharray="`${progressValues.hours}, 100`"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div class="absolute inset-0 flex items-center justify-center">
                <span class="text-sm font-semibold tabular-nums text-white">{{ countdown.hours }}</span>
              </div>
            </div>
            <span class="mt-1 text-xs text-slate-400">Hours</span>
          </div>

          <!-- Minutes -->
          <div class="flex flex-col items-center">
            <div class="relative size-12">
              <svg class="size-full -rotate-90" viewBox="0 0 36 36">
                <path
                  class="stroke-slate-700"
                  stroke-width="3"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  class="stroke-blue-500"
                  stroke-width="3"
                  fill="none"
                  stroke-linecap="round"
                  :stroke-dasharray="`${progressValues.minutes}, 100`"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div class="absolute inset-0 flex items-center justify-center">
                <span class="text-sm font-semibold tabular-nums text-white">{{ countdown.minutes }}</span>
              </div>
            </div>
            <span class="mt-1 text-xs text-slate-400">Mins</span>
          </div>
        </div>

        <!-- Additional info -->
        <div class="text-center">
          <div class="text-2xl font-semibold tabular-nums text-white">
            {{ String(countdown.hours).padStart(2, '0') }}:{{ String(countdown.minutes).padStart(2, '0') }}:{{
              String(countdown.seconds).padStart(2, '0') }}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
