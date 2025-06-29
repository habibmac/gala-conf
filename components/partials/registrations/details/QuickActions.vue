<script setup lang="ts">
import { Icon } from '@iconify/vue';

import type { RegistrationDetails } from '~/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  registration: RegistrationDetails
}

const { registration } = defineProps<Props>();

const openUrl = (url: string) => {
  window.open(url, '_blank');
};

// Create computed actions that access the actual registration properties
const actionList = computed(() => [
  { icon: 'tabler:link', label: 'Registration Link', url: registration.reg_url },
  { icon: 'tabler:receipt', label: 'View Invoice', url: registration.invoice_url },
  { icon: 'tabler:receipt-tax', label: 'View Receipt', url: registration.receipt_url },
]);
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <Icon icon="solar:bolt-bold-duotone" class="size-5 text-yellow-500" />
        Quick Actions
      </CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <Button
        v-for="action in actionList"
        :key="action.label"
        variant="outline"
        class="w-full"
        :disabled="!action.url"
        @click="openUrl(action.url)"
      >
        <Icon :icon="action.icon" class="mr-2 size-4" />
        {{ action.label }}
      </Button>
      <div class="space-y-2">
        <template v-if="registration.stt_id === 'RAP' && registration.ticket_url">
          <Separator />
          <NuxtLink :to="registration.ticket_url" target="_blank">
            <Button
              variant="default"
              class="w-full"
              @click="openUrl(registration.ticket_url)"
            >
              <Icon icon="tabler:ticket" class="mr-2 size-4" />
              Download Ticket
            </Button>
          </NuxtLink>
        </template>
      </div>
    </CardContent>
  </Card>
</template>
