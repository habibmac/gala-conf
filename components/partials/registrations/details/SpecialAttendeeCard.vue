<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { useQuery } from '@tanstack/vue-query';
import { toast } from 'vue-sonner';

import type { RegistrationDetails } from '~/types';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  registration: RegistrationDetails
}

interface Emits {
  (e: 'vip-updated'): void
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { $galantisApi } = useNuxtApp();
const route = useRoute();
const eventId = computed(() => route.params.eventId as string);

// Get event configuration to check if VIP/Notes are enabled
const { data: eventData } = useQuery({
  enabled: !!eventId.value,
  queryFn: async () => {
    const response = await $galantisApi.get(`/event/${eventId.value}`);
    return response.data;
  },
  queryKey: ['eventDetails', { evtId: eventId.value }],
  staleTime: 5 * 60 * 1000, // 5 minutes
});

// Check if VIP functionality is enabled for this event
const isVipEnabled = computed(() => !!eventData.value?.has_vip);

// Only show the card if VIP is enabled
const shouldShowCard = computed(() => isVipEnabled.value);

// Local state for VIP toggle
const isTogglingVip = ref(false);

const specialAttendee = computed(() => props.registration.special_attendee);

const toggleVipStatus = async () => {
  if (isTogglingVip.value || !isVipEnabled.value)
    return;

  try {
    isTogglingVip.value = true;
    const currentVipStatus = specialAttendee.value?.is_vip || false;

    await $galantisApi.put(`/event/${eventId.value}/registrations/${props.registration.id}/vip`, {
      is_vip: !currentVipStatus,
    });

    // Emit event to parent to refetch registration data
    emit('vip-updated');

    toast.success(
      currentVipStatus ? 'VIP status removed' : '👑 Marked as VIP! 👑',
      {
        description: `${props.registration.fullname} is now ${!currentVipStatus ? 'a VIP attendee ✨' : 'a regular attendee'}`,
      },
    );
  }
  catch (error) {
    const { errorMessage, errorDescription } = handleApiError(error, 'Failed to update VIP status');
    toast.error(errorMessage, {
      description: errorDescription,
    });
  }
  finally {
    isTogglingVip.value = false;
  }
};
</script>

<template>
  <Card
    v-if="shouldShowCard"
    :class="specialAttendee?.is_vip ? 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20' : ''"
  >
    <CardHeader>
      <CardTitle class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Icon icon="solar:crown-bold-duotone" class="size-5 text-amber-500" />
          VIP Status
          <Badge 
            v-if="specialAttendee?.is_vip" 
            class="bg-amber-500 text-white"
          >
            <Icon icon="solar:crown-bold" class="mr-1 size-3" />
            VIP
          </Badge>
        </div>
        <Button
          v-if="isVipEnabled"
          variant="outline"
          size="sm"
          :disabled="isTogglingVip"
          @click="toggleVipStatus"
        >
          <Icon
            v-if="isTogglingVip"
            icon="svg-spinners:ring-resize"
            class="mr-2 size-3"
          />
          <Icon
            v-else-if="specialAttendee?.is_vip"
            icon="solar:crown-minimalistic-bold"
            class="mr-2 size-3 text-amber-500"
          />
          <Icon
            v-else
            icon="solar:crown-line-duotone"
            class="mr-2 size-3"
          />
          {{ isTogglingVip ? 'Updating...' : (specialAttendee?.is_vip ? 'Remove VIP' : 'Mark VIP') }}
        </Button>
      </CardTitle>
    </CardHeader>
  </Card>
</template>
