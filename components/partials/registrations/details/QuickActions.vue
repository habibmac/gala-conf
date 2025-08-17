<script setup lang="ts">
import { Icon } from '@iconify/vue';

import type { RegistrationDetails } from '~/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  registration: RegistrationDetails
}

const { registration } = defineProps<Props>();

const authStore = useAuthStore();
const config = useRuntimeConfig();

const openUrl = (url: string) => {
  window.open(url, '_blank');
};

// Check if user is superadmin
const isSuperAdmin = computed(() => {
  return authStore.userInfo?.user_roles?.includes('administrator') || false;
});

// Backend URL for Event Espresso admin
const backendUrl = computed(() => {
  if (!isSuperAdmin.value)
    return null;
  const baseUrl = config.public.backendUrl || 'https://galanesia.test/wp-admin';
  return `${baseUrl}/admin.php?page=espresso_registrations&action=view_registration&_REG_ID=${registration.backend_id}`;
});

// Create computed actions that access the actual registration properties
const actionList = computed(() => {
  const actions: Array<{
    icon: string
    label: string
    url: string
    variant: 'outline' | 'default' | undefined
    class: string
  }> = [
    {
      icon: 'tabler:link',
      label: 'Registration Link',
      url: registration.reg_url,
      variant: 'outline' as const,
      class: '',
    },
    {
      icon: 'tabler:receipt',
      label: 'View Invoice',
      url: registration.invoice_url,
      variant: 'outline' as const,
      class: '',
    },
    {
      icon: 'tabler:receipt-tax',
      label: 'View Receipt',
      url: registration.receipt_url,
      variant: 'outline' as const,
      class: '',
    },
  ];

  // Add backend link for superadmins
  if (isSuperAdmin.value && backendUrl.value) {
    actions.push({
      icon: 'heroicons:cog-6-tooth',
      label: 'Backend Details',
      url: backendUrl.value,
      variant: undefined,
      class: 'bg-yellow-400 text-black hover:bg-yellow-500 dark:bg-yellow-500 dark:text-black dark:hover:bg-yellow-600',
    });
  }

  return actions;
});
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
        :variant="action.variant"
        :class="action.class"
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
              class="w-full bg-emerald-400 text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-600"
              @click="openUrl(registration.ticket_url)"
            >
              <Icon icon="tabler:ticket" class="mr-2 size-4" />
              Ticket
            </Button>
          </NuxtLink>
        </template>
      </div>
    </CardContent>
  </Card>
</template>
