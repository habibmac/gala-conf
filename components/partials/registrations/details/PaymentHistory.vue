<script setup lang="ts">
import { Icon } from '@iconify/vue';

import type { RegistrationDetails } from '~/types';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { formatCurrency } from '@/utils';

interface Props {
  registration: RegistrationDetails
}

defineProps<Props>();

const isExpanded = ref(true);
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <Icon icon="solar:wallet-money-bold-duotone" class="size-5 text-green-500" />
        Payment History
        <Badge variant="secondary" class="flex h-6 min-w-6 shrink-0 scale-90 items-center justify-center rounded-full px-1.5 text-xs">
          {{ registration.pmt.length }}
        </Badge>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <EmptyStateSimple
        v-if="!registration.pmt.length"
        icon="solar:wallet-money-bold-duotone"
        title="No Payments Found"
        description="This registration has no payment history."
      />
      <div class="space-y-4">
        <div v-for="(payment, index) in registration.pmt" :key="index" class="rounded-lg border p-4">
          <div class="mb-3 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Icon icon="heroicons:check-circle" class="size-5 text-green-500" />
              <span class="font-medium">{{ payment.method }}</span>
            </div>
            <div class="text-right">
              <div class="font-semibold">
                {{ formatCurrency(payment.amount) }}
              </div>
              <div class="text-sm text-muted-foreground">
                {{ payment.timestamp }}
              </div>
            </div>
          </div>

          <div class="mb-3 flex items-center justify-between">
            <span class="text-sm text-muted-foreground">Status</span>
            <Badge>{{ payment.status }}</Badge>
          </div>

          <div class="mb-3">
            <span class="text-sm text-green-600">{{ payment.gateway_response }}</span>
          </div>

          <!-- Payment Details -->
          <Collapsible v-model:open="isExpanded">
            <CollapsibleTrigger as-child>
              <Button variant="ghost" size="sm" class="h-8 p-0 text-xs">
                <Icon :icon="isExpanded ? 'heroicons:chevron-up' : 'heroicons:chevron-down'" class="mr-1 size-3" />
                {{ isExpanded ? 'Hide' : 'Show' }} Details
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent class="mt-3">
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span class="text-muted-foreground">Transaction ID:</span>
                  <div class="font-mono">
                    {{ payment.details.TransId }}
                  </div>
                </div>
                <div>
                  <span class="text-muted-foreground">Auth Code:</span>
                  <div class="font-mono">
                    {{ payment.details.AuthCode }}
                  </div>
                </div>
                <div>
                  <span class="text-muted-foreground">Reference:</span>
                  <div class="font-mono">
                    {{ payment.details.RefNo }}
                  </div>
                </div>
                <div>
                  <span class="text-muted-foreground">Payment Date:</span>
                  <div>{{ payment.details.PaymentDate }}</div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
