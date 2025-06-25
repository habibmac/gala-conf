<script setup lang="ts">
import type { RegistrationDetails } from '~/types';

import CopyButton from '@/components/CopyButton.vue';
import StatusBadge from '@/components/statuses/StatusBadge.vue';
import { Badge } from '@/components/ui/badge';
import { getCountryFlagWithName } from '@/utils';

defineProps<{
  data: RegistrationDetails
}>();

const displayedFields: Array<{ key: keyof RegistrationDetails, label: string }> = [
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'address', label: 'Address' },
  { key: 'city', label: 'City' },
  { key: 'country_code', label: 'Country' },
];
</script>

<template>
  <div class="mt-8 w-full drop-shadow-lg">
    <!-- Top -->
    <div
      class="rounded-t-xl bg-white px-5 pb-2.5 pt-4 text-center text-slate-800 dark:bg-slate-700 dark:text-slate-100"
    >
      <div class="b-1 text-2xl font-semibold">
        {{ data.fullname || '-' }}
      </div>
      <div class="mb-3 text-sm font-medium">
        {{ data.ticket_name }}
      </div>
      <StatusBadge :status-id="data.stt_id" />
    </div>
    <!-- Divider -->
    <div class="flex items-center justify-between" aria-hidden="true">
      <svg class="size-5 fill-white dark:fill-slate-700" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 20c5.523 0 10-4.477 10-10S5.523 0 0 0h20v20H0Z" />
      </svg>
      <div class="flex h-5 w-full grow flex-col justify-center bg-white dark:bg-slate-700">
        <div class="h-px w-full border-t border-dashed border-slate-200 dark:border-slate-600" />
      </div>
      <svg class="size-5 rotate-180 fill-white dark:fill-slate-700" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 20c5.523 0 10-4.477 10-10S5.523 0 0 0h20v20H0Z" />
      </svg>
    </div>
    <!-- Bottom -->
    <div
      class="space-y-3 rounded-b-xl bg-white p-5 pt-2.5 text-sm dark:bg-slate-800 dark:bg-gradient-to-b dark:from-slate-700 dark:to-slate-700/70"
    >
      <div v-if="data.code" class="flex flex-col items-center justify-center space-y-2">
        <div class="w-40">
          <ClientOnly>
            <Qrcode :value="data.reg_url_link" />
          </ClientOnly>
        </div>
        <div class="relative">
          <Badge
            variant="outline"
            class="text-md number rounded-full border border-muted-foreground font-medium tabular-nums"
          >
            {{ data.code }}
          </Badge>
          <!-- Copy btn -->
          <CopyButton
            :value="data.code"
            text="Copy code"
            button-class="absolute -right-8 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-slate-800 dark:hover:text-slate-100"
            side="top"
          />
        </div>
      </div>
      <!-- <div class="flex justify-between space-x-1">
        <span class="">Email:</span>
        <span class="text-right font-medium text-slate-700 dark:text-slate-100">{{ data.email }}</span>
      </div>
      <div class="flex justify-between space-x-1">
        <span class="">Phone:</span>
        <span class="text-right font-medium text-slate-700 dark:text-slate-100">{{ data.phone }}</span>
      </div>
      <div class="flex justify-between space-x-1">
        <span class="">Address:</span>
        <span class="text-right font-medium text-slate-700 dark:text-slate-100">{{ data.address }}</span>
      </div>
      <div class="flex justify-between space-x-1">
        <span class="">City:</span>
        <span class="text-right font-medium text-slate-700 dark:text-slate-100">{{ data.city }}</span>
      </div>
      <div class="flex justify-between space-x-1">
        <span class="">Nationality:</span>
        <span class="text-right font-medium text-slate-700 dark:text-slate-100">
          {{ getCountryFlagWithName(data.country_code) }}
        </span>
      </div> -->
      <div v-for="(field, index) in displayedFields" :key="index">
        <div class="flex justify-between space-x-1">
          <span class="text-muted-foreground">{{ field.label }}:</span>
          <span class="text-right font-medium">
            {{ field.label === 'Country' ? getCountryFlagWithName(String(data[field.key])) : data[field.key] || '-' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
