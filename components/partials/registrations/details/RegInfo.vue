<script setup lang="ts">
import { Icon } from '@iconify/vue';

import type { RegistrationDetails } from '~/types';

import CopyButton from '@/components/CopyButton.vue';
import StatusBadge from '@/components/statuses/StatusBadge.vue';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/utils';

interface Props {
  registration: RegistrationDetails
}

defineProps<Props>();
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <Icon icon="solar:clipboard-list-bold-duotone" class="size-5 text-blue-500" />
        Registration Details
      </CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <!-- Registration Code -->
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-muted-foreground">Registration Code</span>
        <div class="relative flex items-center">
          <CopyButton
            :value="registration.code"
            text="Copy code"
            button-class=" text-muted-foreground hover:text-slate-800 dark:hover:text-slate-100"
            side="top"
          />
          <Badge
            variant="outline"
            class="number whitespace-nowrap  rounded-full border border-muted-foreground text-sm font-medium tabular-nums"
          >
            {{ registration.code }}
          </Badge>
          <!-- Copy btn -->
        </div>
      </div>

      <!-- Status -->
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-muted-foreground">Status</span>
        <StatusBadge :status="registration.status" />
      </div>

      <!-- Group Registration -->
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-muted-foreground">Registration Type</span>
        <Badge :variant="registration.is_group ? 'default' : 'secondary'">
          {{ registration.is_group ? 'Group' : 'Individual' }}
        </Badge>
      </div>

      <Separator />

      <!-- Ticket Info -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-muted-foreground">Ticket</span>
          <span class="text-sm font-medium">{{ registration.ticket_name }}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-muted-foreground">Ticket Price</span>
          <span class="text-sm font-medium">{{ formatCurrency(Number(registration.ticket_price)) }}</span>
        </div>
      </div>

      <Separator />

      <!-- Payment Summary -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-muted-foreground">Total Amount</span>
          <span class="text-sm font-medium">{{ formatCurrency(Number(registration.total)) }}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-muted-foreground">Paid Amount</span>
          <span class="text-sm font-medium text-green-600">{{ formatCurrency(Number(registration.paid)) }}</span>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
