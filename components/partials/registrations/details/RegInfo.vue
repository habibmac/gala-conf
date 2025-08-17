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

const props = defineProps<Props>();

// Show/hide group members toggle
const showAllMembers = ref(false);

// Display limited members initially, all when expanded
const displayedMembers = computed(() => {
  const members = props.registration.group_info?.members || [];
  return showAllMembers.value ? members : members.slice(0, 2);
});
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

      <Separator />

      <!-- Registration Type -->
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-muted-foreground">Registration Type</span>
        <Badge :variant="registration.is_group ? 'default' : 'secondary'">
          {{ registration.is_group ? 'Group' : 'Single' }}
        </Badge>
      </div>

      <!-- Group Members Section -->
      <div v-if="registration.is_group && registration.group_info" class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-muted-foreground">Grouped Members</span>
          <Button
            v-if="(registration.group_info?.members?.length || 0) > 2"
            variant="ghost"
            size="sm"
            @click="showAllMembers = !showAllMembers"
          >
            {{ showAllMembers ? 'Show Less' : 'Show More' }}
            <Icon
              :icon="showAllMembers ? 'heroicons:chevron-up' : 'heroicons:chevron-down'"
              class="ml-1 size-3"
            />
          </Button>
        </div>

        <!-- Group Members List -->
        <div class="space-y-2">
          <NuxtLink
            v-for="member in displayedMembers"
            :key="member.id"
            :to="member.is_current ? undefined : `/event/${$route.params.eventId}/registrations/${member.id}`"
            class="flex items-center justify-between rounded-md border p-2 text-xs transition-colors"
            :class="[
              member.is_current
                ? 'cursor-default border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20'
                : 'cursor-pointer border-muted hover:border-blue-200 hover:bg-blue-50/30 dark:hover:border-blue-800 dark:hover:bg-blue-950/10',
            ]"
          >
            <div class="flex items-center gap-2">
              <Icon
                :icon="member.is_current ? 'heroicons:check-circle' : 'heroicons:user-circle'"
                class="size-4"
                :class="member.is_current ? 'text-blue-600' : 'text-muted-foreground'"
              />
              <div>
                <div class="font-medium">
                  {{ member.fullname }}
                  <span v-if="member.is_primary" class="text-amber-600">(Handler)</span>
                </div>
                <div class="text-muted-foreground">
                  {{ member.email }}
                </div>
              </div>
            </div>
            <div class="text-right">
              <div class="number font-medium">
                {{ member.code }}
              </div>
              <div class="text-muted-foreground">
                {{ member.ticket_name }}
              </div>
            </div>
          </NuxtLink>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
