<script setup lang="ts">
import { Icon } from '@iconify/vue';

import type { RegistrationData, ScanHistoryItem } from '~/types';

interface Props {
  scanHistory: ScanHistoryItem[]
  recentScans: ScanHistoryItem[]
  successfulScans: number
  failedScans: number
}

defineProps<Props>();

defineEmits<{
  'export-history': []
  'clear-history': []
  'registration-action': [registration: RegistrationData, action: 'checkin' | 'checkout']
}>();

const formatTimestamp = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};
</script>

<template>
  <Card v-if="scanHistory.length > 0">
    <CardHeader class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div>
        <CardTitle>Scan History</CardTitle>
        <CardDescription>
          Recent scans and their results ({{ scanHistory.length }} total)
        </CardDescription>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" size="sm" @click="$emit('export-history')">
          <Icon icon="heroicons:arrow-down-tray" class="mr-1 size-4" />
          Export
        </Button>
        <Button variant="outline" size="sm" @click="$emit('clear-history')">
          <Icon icon="heroicons:trash" class="mr-1 size-4" />
          Clear
        </Button>
      </div>
    </CardHeader>
    <CardContent>
      <div class="max-h-96 space-y-3 overflow-y-auto">
        <div
          v-for="scan in recentScans"
          :key="scan.id"
          class="flex items-center justify-between rounded-lg border p-3"
          :class="{
            'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20': scan.status === 'success',
            'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20': scan.status === 'lookup',
            'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20': scan.status === 'error',
          }"
        >
          <div class="min-w-0 flex-1">
            <div class="mb-1 flex items-center gap-2">
              <Icon
                :icon="scan.status === 'success'
                  ? 'heroicons:check-circle'
                  : scan.status === 'lookup'
                    ? 'heroicons:magnifying-glass'
                    : 'heroicons:x-circle'
                "
                :class="{
                  'text-green-500': scan.status === 'success',
                  'text-blue-500': scan.status === 'lookup',
                  'text-red-500': scan.status === 'error',
                }"
                class="size-4 shrink-0"
              />
              <span class="truncate text-sm font-medium">{{ scan.code }}</span>
            </div>
            <p class="text-xs text-muted-foreground">
              {{ formatTimestamp(scan.timestamp) }}
            </p>
            <p v-if="scan.attendeeName" class="mt-1 text-sm font-medium">
              {{ scan.attendeeName }}
            </p>
            <p
              v-if="scan.message"
              class="mt-1 text-xs"
              :class="{
                'text-green-600 dark:text-green-400': scan.status === 'success',
                'text-blue-600 dark:text-blue-400': scan.status === 'lookup',
                'text-red-600 dark:text-red-400': scan.status === 'error',
              }"
            >
              {{ scan.message }}
            </p>

            <!-- Note display -->
            <div
              v-if="scan.note"
              class="mt-2 rounded border-l-2 border-amber-300 bg-amber-50 p-2 text-xs dark:bg-amber-900/20"
            >
              <div class="mb-1 flex items-center gap-1">
                <Icon icon="heroicons:pencil-square" class="size-3 text-amber-600" />
                <span class="font-medium text-amber-700 dark:text-amber-400">Note:</span>
              </div>
              <p class="text-amber-800 dark:text-amber-300">
                {{ scan.note }}
              </p>
            </div>
          </div>

          <div>
            <Badge v-if="scan.action" variant="outline" class="text-xs">
              {{ scan.action }}
            </Badge>
          </div>

          <div v-if="scan.status === 'lookup' && scan.registrationData" class="flex items-center gap-1">
            <Button
              v-if="scan.registrationData.can_checkin"
              @click="$emit('registration-action', scan.registrationData, 'checkin')"
            >
              <Icon icon="ph:sign-in" class="size-5" />
            </Button>
            <Button
              v-if="scan.registrationData.can_checkout"
              variant="destructive"
              @click="$emit('registration-action', scan.registrationData, 'checkout')"
            >
              <Icon icon="ph:sign-out" class="size-5" />
            </Button>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
