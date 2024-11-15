<!-- components/checkins/CheckinDistribution.vue -->
<script setup lang="ts">
import type { TicketCheckinStats, TshirtCheckinStats } from '~/types';

defineProps<{
  tickets: TicketCheckinStats[];
  tshirts?: TshirtCheckinStats[];
}>();
</script>

<template>
  <div class="grid gap-4 grid-cols-1 md:grid-cols-2">
    <!-- Ticket Distribution Card -->
    <Card>
      <CardHeader>
        <CardTitle>Check-in Status by Ticket</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-1 gap-4">
          <div v-for="ticket in tickets" :key="ticket.TKT_ID" class="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
            <div class="flex justify-between items-center mb-2">
              <span class="font-medium">{{ ticket.TKT_name }}</span>
              <Badge> {{ ticket.checkin_percentage }}% </Badge>
            </div>
            <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1">
              <div
                class="bg-emerald-400 h-1 rounded-full transition-all"
                :style="{ width: `${ticket.checkin_percentage}%` }"
              />
            </div>
            <div class="flex justify-between text-sm mt-2 text-slate-600 dark:text-slate-400">
              <span class="tabular-nums">{{ ticket.total_checkins }}/{{ ticket.total_registrations }}</span>
              <span class="tabular-nums"
                >{{ parseInt(ticket.total_registrations) - parseInt(ticket.total_checkins) }} left</span
              >
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Check-in Stats Card for T-shirts -->
    <!-- interface TshirtCheckinStats {
    tshirt_size: string;
    total_registered: number;
    picked_up: number;
    checked_out: number;
    currently_out: number;
    pickup_percentage: number;
} -->
    <Card v-if="tshirts">
      <CardHeader>
        <CardTitle>Check-in Status by T-shirt</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-1 gap-4">
          <div
            v-for="tshirt in tshirts"
            :key="tshirt.tshirt_size"
            class="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4"
          >
            <div class="flex justify-between items-center mb-2">
              <span class="font-medium">{{ tshirt.tshirt_size }}</span>
              <Badge> {{ tshirt.pickup_percentage }}% </Badge>
            </div>
            <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1">
              <div
                class="bg-primary h-1 rounded-full transition-all"
                :style="{ width: `${tshirt.pickup_percentage}%` }"
              />
            </div>
            <div class="flex justify-between text-sm mt-2 text-slate-600 dark:text-slate-400">
              <span class="tabular-nums">{{ tshirt.picked_up }}/{{ tshirt.total_registered }}</span>
              <span class="tabular-nums"
                >{{ parseInt(tshirt.total_registered.toString()) - parseInt(tshirt.picked_up.toString()) }} left</span
              >
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
