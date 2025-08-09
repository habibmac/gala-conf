<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { toast } from 'vue-sonner';

import type { RegistrationDetails } from '~/types';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

interface Props {
  registration: RegistrationDetails
}

interface Emits {
  (e: 'update-notes', notes: string | null): void
  (e: 'vip-updated'): void
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { $galantisApi } = useNuxtApp();

// Find "Notes" from registration answers as fallback
const registrationNotes = computed(() => {
  const notesAnswer = props.registration.ans?.find(answer =>
    answer.qst.toLowerCase().includes('notes')
    || answer.qst.toLowerCase().includes('note'),
  );
  return notesAnswer?.ans || '';
});

// Local state for notes editing
const isEditingNotes = ref(false);
const notesValue = ref(props.registration.special_attendee?.notes || '');
const isSaving = ref(false);

// Local state for VIP toggle
const isTogglingVip = ref(false);

// Watch for changes in registration data
watch(() => props.registration.special_attendee?.notes, (newNotes) => {
  if (!isEditingNotes.value) {
    notesValue.value = newNotes || '';
  }
});

const specialAttendee = computed(() => props.registration.special_attendee);

const startEditing = () => {
  // Pre-populate with staff notes, fallback to registration notes if empty
  notesValue.value = specialAttendee.value?.notes || registrationNotes.value || '';
  isEditingNotes.value = true;
};

const cancelEditing = () => {
  notesValue.value = specialAttendee.value?.notes || '';
  isEditingNotes.value = false;
};

const saveNotes = async () => {
  if (isSaving.value)
    return;

  try {
    isSaving.value = true;
    const route = useRoute();
    const eventId = route.params.eventId as string;

    const response = await $galantisApi.put(`/event/${eventId}/registrations/${props.registration.id}/notes`, {
      notes: notesValue.value.trim(),
    });

    // Use the returned special_attendee data from API response
    if (response.data.special_attendee) {
      emit('update-notes', response.data.special_attendee.notes);
    }
    else {
      // Fallback to local value
      const updatedNotes = notesValue.value.trim() || null;
      emit('update-notes', updatedNotes);
    }

    isEditingNotes.value = false;
    toast.success('Notes saved successfully');
  }
  catch (error) {
    const { errorMessage, errorDescription } = handleApiError(error, 'Failed to save notes');
    toast.error(errorMessage, {
      description: errorDescription,
    });
  }
  finally {
    isSaving.value = false;
  }
};

const toggleVipStatus = async () => {
  if (isTogglingVip.value)
    return;

  try {
    isTogglingVip.value = true;
    const route = useRoute();
    const eventId = route.params.eventId as string;
    const currentVipStatus = specialAttendee.value?.is_vip || false;

    await $galantisApi.put(`/event/${eventId}/registrations/${props.registration.id}/vip`, {
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
    :class="specialAttendee?.is_vip ? 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20' : ''"
  >
    <CardHeader>
      <CardTitle class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Icon icon="solar:crown-bold-duotone" class="size-5 text-amber-500" />
          Special Attendee
        </div>
        <Button
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
    <CardContent class="space-y-4">
      <!-- VIP Status (only show if VIP) -->
      <div v-if="specialAttendee?.is_vip" class="flex items-center justify-between">
        <span class="text-sm font-medium text-muted-foreground">VIP Status</span>
        <div class="flex items-center gap-2">
          <Badge class="bg-amber-500 text-white">
            <Icon icon="solar:crown-bold" class="mr-1 size-3" />
            VIP
          </Badge>
        </div>
      </div>

      <!-- Special Treatment Indicator -->
      <div v-if="specialAttendee?.special_treatment" class="flex items-center justify-between">
        <span class="text-sm font-medium text-muted-foreground">Special Treatment</span>
        <Badge variant="outline" class="border-amber-500 text-amber-600">
          <Icon icon="solar:medal-star-bold" class="mr-1 size-3" />
          Required
        </Badge>
      </div>

      <Separator />

      <!-- Notes Section -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-muted-foreground">Notes</span>
          <Button
            v-if="!isEditingNotes"
            variant="ghost"
            size="sm"
            @click="startEditing"
          >
            <Icon icon="solar:pen-bold" class="mr-1 size-3" />
            Edit
          </Button>
        </div>

        <!-- Notes Display -->
        <div v-if="!isEditingNotes">
          <div
            v-if="specialAttendee?.notes || registrationNotes"
            class="rounded-md bg-muted/50 p-3 text-sm"
          >
            {{ specialAttendee?.notes || registrationNotes }}
          </div>
          <div v-else class="text-sm italic text-muted-foreground">
            No notes available
          </div>
        </div>

        <!-- Notes Editor -->
        <div v-else class="space-y-3">
          <Textarea
            v-model="notesValue"
            placeholder="Add or edit notes for this attendee"
            class="min-h-[100px]"
            :disabled="isSaving"
          />
          <div class="flex gap-2">
            <Button
              size="sm"
              :disabled="isSaving"
              @click="saveNotes"
            >
              <Icon
                v-if="isSaving"
                icon="svg-spinners:ring-resize"
                class="mr-1 size-3"
              />
              <Icon
                v-else
                icon="tabler:check"
                class="mr-1 size-3"
              />
              {{ isSaving ? 'Saving...' : 'Save' }}
            </Button>
            <Button
              variant="outline"
              size="sm"
              :disabled="isSaving"
              @click="cancelEditing"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>

      <!-- Usage Examples -->
      <div v-if="isEditingNotes" class="rounded-md bg-blue-50 p-3 text-xs text-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
        <div class="mb-1 font-medium">
          Example notes:
        </div>
        <ul class="space-y-0.5 text-xs">
          <li>• "Table 5 - Vegetarian meal required"</li>
          <li>• "Meeting with organizer at 2 PM"</li>
          <li>• "VIP escort required - government official"</li>
        </ul>
      </div>
    </CardContent>
  </Card>
</template>
