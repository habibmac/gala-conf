<script setup lang="ts">
import { Icon } from '@iconify/vue';

import type { ScannerSettings } from '~/types';

interface Props {
  selectedDatetime: string
  scannerSettings: ScannerSettings
  successfulScans: number
  failedScans: number
}

defineProps<Props>();
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <Icon icon="heroicons:chart-bar" class="size-5 text-muted-foreground" />
        Session Stats
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div class="grid grid-cols-4 gap-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-green-500">
            {{ Number(scannerSettings.stats.total_checkins) }}
          </div>
          <div class="text-sm text-muted-foreground">
            Check-ins
          </div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-blue-500">
            {{ Number(scannerSettings.stats.currently_checked_in) }}
          </div>
          <div class="text-sm text-muted-foreground">
            Currently Here
          </div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-purple-500">
            {{ successfulScans }}
          </div>
          <div class="text-sm text-muted-foreground">
            Successful
          </div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-red-500">
            {{ failedScans }}
          </div>
          <div class="text-sm text-muted-foreground">
            Failed
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
