<!-- components/checkins/CheckinDistribution.vue -->
<script setup lang="ts">
import type { CustomStats, TicketCheckinStats } from '~/types';

defineProps<{
  tickets: TicketCheckinStats[]
  custom?: CustomStats[]

}>();
</script>

<template>
  <div class="grid h-auto grid-cols-1 gap-4 md:grid-cols-2">
    <!-- Ticket Distribution Card -->
    <Card>
      <CardHeader>
        <CardTitle>Check-in Status by Ticket</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-1 gap-4">
          <div v-for="ticket in tickets" :key="ticket.TKT_ID" class="rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50">
            <div class="mb-2 flex items-center justify-between">
              <span class="font-medium">{{ ticket.TKT_name }}</span>
              <Badge> {{ parseInt(ticket.checkin_percentage ?? 0).toFixed(0) }}% </Badge>
            </div>
            <div class="h-1 w-full rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                class="h-1 rounded-full bg-gradient-to-r from-primary to-emerald-400 transition-all"
                :style="{ width: `${ticket.checkin_percentage ?? 0}%` }"
              />
            </div>
            <div class="mt-2 flex justify-between text-sm text-slate-600 dark:text-slate-400">
              <span class="tabular-nums">{{ ticket.total_checkins }}/{{ ticket.total_registrations }}</span>
              <span class="tabular-nums">{{ parseInt(ticket.total_registrations) - parseInt(ticket.total_checkins) }} left</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
    <!-- Custom Questions Stats -->
    <div v-if="custom && custom?.length" class="col-span-1 grid gap-4">
      <div class="space-y-4">
        <Card v-for="question in custom" :key="question.info.QST_ID" class="h-auto">
          <CardHeader>
            <CardTitle>Check-in Status by {{ question.info.QST_display_text }}</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-1 gap-4">
              <div
                v-for="item in question.options"
                :key="item.option"
                class="rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50"
              >
                <div class="mb-2 flex items-center justify-between">
                  <span class="font-medium">{{ item.option }}</span>
                  <Badge> {{ parseInt(item.pickup_percentage.toString()).toFixed(0) }}% </Badge>
                </div>
                <div class="h-1 w-full rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    class="h-1 rounded-full bg-gradient-to-r from-primary to-emerald-400 transition-all"
                    :style="{ width: `${item.pickup_percentage}%` }"
                  />
                </div>
                <div class="mt-2 flex justify-between text-sm text-slate-600 dark:text-slate-400">
                  <span class="tabular-nums">{{ item.picked_up }}/{{ item.total_registered }}</span>
                  <span class="tabular-nums">
                    {{ parseInt(item.total_registered.toString()) - parseInt(item.picked_up.toString()) }} left
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
