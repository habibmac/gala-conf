<script setup lang="ts">
import { Icon } from '@iconify/vue';
</script>

<template>
  <Card
    class="relative overflow-hidden bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20"
  >
    <div class="absolute right-0 top-0 size-32 translate-x-8 translate-y-[-32px]">
      <div
        class="size-full rounded-full bg-gradient-to-br from-amber-200/20 to-orange-200/20 dark:from-amber-800/20 dark:to-orange-800/20"
      />
    </div>

    <CardHeader class="relative">
      <div class="flex items-start justify-between">
        <div class="space-y-1">
          <CardTitle class="flex items-center gap-2 text-lg">
            <Icon icon="heroicons:information-circle" class="size-5 text-amber-600 dark:text-amber-400" />
            Withdrawal Information
          </CardTitle>
        </div>
        <Badge
          variant="outline"
          class="border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300"
        >
          <Icon icon="heroicons:clock" class="mr-1 size-3" />
          5-7 Business Days
        </Badge>
      </div>
    </CardHeader>

    <CardContent class="relative space-y-4">
      <div class="space-y-3">
        <div class="flex items-start gap-3">
          <div class="mt-0.5 rounded-full bg-amber-100 p-1 dark:bg-amber-900">
            <Icon icon="heroicons:calendar" class="size-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div class="space-y-1">
            <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
              Processing Schedule
            </p>
            <p class="text-sm text-muted-foreground">
              Withdrawals are processed every Friday. Requests made on Friday will be processed the following week.
            </p>
          </div>
        </div>

        <div class="flex items-start gap-3">
          <div class="mt-0.5 rounded-full bg-amber-100 p-1 dark:bg-amber-900">
            <Icon icon="heroicons:clock" class="size-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div class="space-y-1">
            <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
              Processing Time
            </p>
            <p class="text-sm text-muted-foreground">
              Please allow 5-7 business days for your withdrawal to be processed and reflected in your account.
            </p>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
