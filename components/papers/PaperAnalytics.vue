<script setup lang="ts">
import type { PaperAnalytics } from '@/types/papers';
import { Icon } from '@iconify/vue';
import { computed } from 'vue';

import Card from '~/components/ui/card/Card.vue';
import CardContent from '~/components/ui/card/CardContent.vue';
import CardHeader from '~/components/ui/card/CardHeader.vue';
import CardTitle from '~/components/ui/card/CardTitle.vue';
import Table from '~/components/ui/table/Table.vue';
import TableBody from '~/components/ui/table/TableBody.vue';
import TableCell from '~/components/ui/table/TableCell.vue';
import TableHead from '~/components/ui/table/TableHead.vue';
import TableHeader from '~/components/ui/table/TableHeader.vue';
import TableRow from '~/components/ui/table/TableRow.vue';

interface Props {
  analytics: PaperAnalytics
}

const props = defineProps<Props>();

const statusColors = {
  pending: '#FBBF24',
  under_review: '#3B82F6',
  accepted: '#10B981',
  rejected: '#EF4444',
};

const statusLabels = {
  pending: 'Pending',
  under_review: 'Under Review',
  accepted: 'Accepted',
  rejected: 'Rejected',
};

interface StatCard {
  bgColor: string
  color: string
  icon: string
  title: string
  value: number
}

const statsCards = computed((): StatCard[] => [
  {
    bgColor: 'bg-gray-50 dark:bg-gray-900/20',
    color: 'text-gray-500',
    icon: 'solar:document-text-linear',
    title: 'Total Submissions',
    value: props.analytics.total_submissions,
  },
  {
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    color: 'text-yellow-600',
    icon: 'solar:clock-circle-linear',
    title: 'Pending',
    value: props.analytics.by_status.pending,
  },
  {
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    color: 'text-blue-600',
    icon: 'solar:eye-linear',
    title: 'Under Review',
    value: props.analytics.by_status.under_review,
  },
  {
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    color: 'text-green-600',
    icon: 'solar:check-circle-linear',
    title: 'Accepted',
    value: props.analytics.by_status.accepted,
  },
]);

const safePercentage = (numerator: number, denominator: number): number => {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return 0;
  }
  return Math.round((numerator / denominator) * 100);
};
</script>

<template>
  <div class="space-y-6">
    <!-- Summary Cards -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card v-for="card in statsCards" :key="card.title">
        <CardContent class="p-6">
          <div class="flex items-center">
            <div class="shrink-0">
              <div :class="`rounded-lg p-3 ${card.bgColor}`">
                <Icon :icon="card.icon" :class="`h-6 w-6 ${card.color}`" />
              </div>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-muted-foreground uppercase">
                  {{ card.title }}
                </dt>
                <dd class="flex items-baseline">
                  <div class="text-2xl font-semibold tracking-tight text-foreground">
                    {{ card.value }}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Status Distribution -->
    <Card>
      <CardHeader>
        <CardTitle>Status Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-3">
          <div v-for="[status, count] in Object.entries(analytics.by_status)" :key="status">
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm font-medium text-muted-foreground">{{ statusLabels[status as keyof typeof statusLabels] }}</span>
              <span class="text-sm font-semibold text-foreground">{{ count }} ({{ safePercentage(count, analytics.total_submissions) }}%)</span>
            </div>
            <div class="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                :style="{
                  width: `${safePercentage(count, analytics.total_submissions)}%`,
                  backgroundColor: statusColors[status as keyof typeof statusColors],
                }"
                class="h-full transition-all"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Submissions Over Time -->
    <Card>
      <CardHeader>
        <CardTitle>Submissions Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="text-left">Date</TableHead>
              <TableHead class="text-right">Count</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="data in analytics.submissions_over_time" :key="data.date">
              <TableCell>{{ new Date(data.date).toLocaleDateString() }}</TableCell>
              <TableCell class="text-right font-medium">{{ data.count }}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
</template>
