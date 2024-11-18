<!-- components/checkins/CheckinDistribution.vue -->
<script setup lang="ts">
import type { TicketCheckinStats, QuestionStats } from '~/types';

defineProps<{
  tickets: TicketCheckinStats[];
  custom?: {
    questions: QuestionStats[];
  };
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
                class="bg-gradient-to-r from-primary to-emerald-400 h-1 rounded-full transition-all"
                :style="{ width: `${ticket.checkin_percentage}%` }"
              ></div>
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
    <!-- Custom Questions Stats -->
    <div v-if="custom?.questions.length">
      <Card v-for="question in custom.questions" :key="question.info.QST_ID" class="mb-4">
        <CardHeader>
          <CardTitle>Check-in Status by {{ question.info.QST_display_text }}</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-1 gap-4">
            <div
              v-for="option in question.options"
              :key="option.answer"
              class="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4"
            >
              <div class="flex justify-between items-center mb-2">
                <span class="font-medium">{{ option.answer }}</span>
                <Badge> {{ option.pickup_percentage }}% </Badge>
              </div>
              <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1">
                <div
                  class="bg-gradient-to-r from-primary to-emerald-400 h-1 rounded-full transition-all"
                  :style="{ width: `${option.pickup_percentage}%` }"
                ></div>
              </div>
              <div class="flex justify-between text-sm mt-2 text-slate-600 dark:text-slate-400">
                <span class="tabular-nums">{{ option.picked_up }}/{{ option.total_registered }}</span>
                <span class="tabular-nums">
                  {{ parseInt(option.total_registered.toString()) - parseInt(option.picked_up.toString()) }} left
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
