<script setup lang="ts">
import { Icon } from '@iconify/vue';

import type { RegistrationDetails, GroupMember } from '~/types';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  registration: RegistrationDetails
}

const props = defineProps<Props>();

const route = useRoute();
const eventId = computed(() => route.params.eventId as string);

// Get group members from registration data
const groupMembers = computed(() => {
  return props.registration.group_info?.members || [];
});

// Get group info
const groupInfo = computed(() => props.registration.group_info);

// Get display name with handler indication
const getDisplayName = (member: GroupMember) => {
  return member.is_primary ? `${member.fullname} (Handler)` : member.fullname;
};

// Navigate to member details
const openMemberDetails = (memberId: string) => {
  navigateTo(`/event/${eventId.value}/registrations/${memberId}`);
};
</script>

<template>
  <Card v-if="registration.is_group && groupInfo">
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <Icon icon="solar:users-group-rounded-bold-duotone" class="size-5 text-blue-500" />
        Group Members
        <Badge v-if="groupInfo.total_members" variant="secondary" class="ml-auto">
          {{ groupInfo.total_members }}
        </Badge>
      </CardTitle>
    </CardHeader>
    <CardContent class="space-y-3">
      <!-- Group Members List -->
      <div v-if="groupMembers.length" class="space-y-2">
        <div
          v-for="member in groupMembers"
          :key="member.id"
          class="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
          :class="member.is_current ? 'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20' : ''"
        >
          <div class="flex-1 space-y-1">
            <div class="flex items-center gap-2">
              <span class="font-medium text-sm">
                {{ getDisplayName(member) }}
              </span>
              <Badge v-if="member.is_primary" variant="outline" class="text-xs">
                <Icon icon="solar:crown-bold" class="mr-1 size-3" />
                Handler
              </Badge>
              <Badge v-if="member.is_current" variant="secondary" class="text-xs">
                Current
              </Badge>
            </div>
            <div class="flex items-center gap-2 text-xs text-muted-foreground">
              <span class="font-mono">{{ member.code }}</span>
              <span>•</span>
              <span>{{ member.email }}</span>
              <span>•</span>
              <span>{{ member.ticket_name }}</span>
            </div>
          </div>
          <Button
            v-if="!member.is_current"
            variant="outline"
            size="sm"
            @click="openMemberDetails(member.id)"
          >
            <Icon icon="heroicons:arrow-top-right-on-square" class="mr-1 size-3" />
            View
          </Button>
          <Badge v-else variant="secondary" size="sm">
            Current
          </Badge>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="py-4 text-center text-sm text-muted-foreground">
        No group members found
      </div>
    </CardContent>
  </Card>
</template>