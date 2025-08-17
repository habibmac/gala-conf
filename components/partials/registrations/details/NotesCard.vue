<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { useQuery } from '@tanstack/vue-query';
import { toast } from 'vue-sonner';

import type { RegistrationDetails } from '~/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

interface Props {
  registration: RegistrationDetails
  compact?: boolean // For different layouts (RegPanel vs full page)
}

interface Emits {
  (e: 'update-notes', notes: string | null): void
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { $galantisApi } = useNuxtApp();
const route = useRoute();
const eventId = computed(() => route.params.eventId as string);

// Get event configuration to check if Notes are enabled
const { data: eventData } = useQuery({
  enabled: !!eventId.value,
  queryFn: async () => {
    const response = await $galantisApi.get(`/event/${eventId.value}`);
    return response.data;
  },
  queryKey: ['eventDetails', { evtId: eventId.value }],
  staleTime: 5 * 60 * 1000, // 5 minutes
});

// Check if Notes functionality is enabled for this event
const isNotesEnabled = computed(() => !!eventData.value?.has_notes);

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

// Watch for changes in registration data
watch(() => props.registration.special_attendee?.notes, (newNotes) => {
  if (!isEditingNotes.value) {
    notesValue.value = newNotes || '';
  }
});

const specialAttendee = computed(() => props.registration.special_attendee);

// Check if there are any notes to show enhanced styling
const hasNotes = computed(() => {
  return !!(specialAttendee.value?.notes || registrationNotes.value);
});

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
  if (isSaving.value || !isNotesEnabled.value)
    return;

  try {
    isSaving.value = true;

    const response = await $galantisApi.put(`/event/${eventId.value}/registrations/${props.registration.id}/notes`, {
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
</script>

<template>
  <Card
    v-if="isNotesEnabled"
    :class="[
      compact ? '' : 'mt-6',
      hasNotes && !isEditingNotes ? 'border-amber-200 bg-gradient-to-br from-amber-50/70 to-yellow-50/50 dark:border-amber-800/50 dark:from-amber-950/20 dark:to-yellow-950/10' : '',
    ]"
  >
    <CardHeader v-if="!compact">
      <CardTitle class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <Icon
            icon="solar:notes-bold-duotone"
            class="size-5 text-amber-600 dark:text-amber-400"
          />
          <span :class="hasNotes ? 'text-amber-900 dark:text-amber-100' : ''">Notes</span>
        </div>

        <Button
          v-if="!isEditingNotes"
          variant="ghost"
          size="sm"
          @click.stop="startEditing"
        >
          <Icon icon="solar:pen-bold" class="mr-1 size-3" />
          Edit
        </Button>
      </CardTitle>
    </CardHeader>

    <!-- Compact version for RegPanel -->
    <div v-if="compact" class="space-y-2 p-4" @click.stop>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Icon
            icon="tabler:notes"
            :class="hasNotes ? 'size-4 text-amber-600 dark:text-amber-400' : 'size-4 text-slate-500'"
          />
          <span
            class="text-sm font-semibold"
            :class="hasNotes ? 'text-amber-900 dark:text-amber-100' : 'text-slate-800 dark:text-slate-100'"
          >
            Notes
          </span>
        </div>
        <Button
          v-if="!isEditingNotes"
          variant="ghost"
          size="sm"
          @click.stop="startEditing"
        >
          <Icon icon="solar:pen-bold" class="mr-1 size-3" />
          Edit
        </Button>
      </div>

      <!-- Notes Display -->
      <div v-if="!isEditingNotes">
        <div
          v-if="specialAttendee?.notes || registrationNotes"
          class="rounded-md border border-amber-200/50 bg-gradient-to-r from-amber-50 to-yellow-50 p-3 text-xs shadow-sm dark:border-amber-800/30 dark:from-amber-950/30 dark:to-yellow-950/20 dark:text-amber-100"
        >
          <span class="text-amber-900 dark:text-amber-100">{{ specialAttendee?.notes || registrationNotes }}</span>
        </div>
        <div v-else class="text-xs italic text-slate-500">
          No notes available
        </div>
      </div>

      <!-- Notes Editor -->
      <div v-else class="space-y-2" @click.stop>
        <Textarea
          v-model="notesValue"
          placeholder="Add notes for this attendee"
          class="min-h-[60px] text-xs"
          :disabled="isSaving"
        />
        <div class="flex gap-2">
          <Button size="sm" :disabled="isSaving" @click.stop="saveNotes">
            <Icon v-if="isSaving" icon="svg-spinners:ring-resize" class="mr-1 size-3" />
            <Icon v-else icon="tabler:check" class="mr-1 size-3" />
            {{ isSaving ? 'Saving...' : 'Save' }}
          </Button>
          <Button
            variant="outline"
            size="sm"
            :disabled="isSaving"
            @click.stop="cancelEditing"
          >
            Cancel
          </Button>
        </div>
      </div>

      <!-- Usage Examples -->
      <div
        v-if="isEditingNotes"
        class="rounded-md bg-blue-50 p-3 text-xs text-blue-800 dark:bg-blue-900/20 dark:text-blue-200"
      >
        <div class="mb-1 font-medium">
          Example notes:
        </div>
        <ul class="space-y-0.5 text-xs">
          <li>• "Table 5 - Vegetarian meal required"</li>
          <li>• "Meeting with organizer at 2 PM"</li>
          <li>• "VIP escort required - government official"</li>
        </ul>
      </div>
    </div>

    <!-- Full version for registration details page -->
    <CardContent v-else class="space-y-3">
      <!-- Notes Display -->
      <div v-if="!isEditingNotes">
        <div
          v-if="specialAttendee?.notes || registrationNotes"
          class="rounded-lg border border-amber-200/60 bg-gradient-to-r from-amber-50 to-yellow-50 p-4 text-sm shadow-sm dark:border-amber-800/40 dark:from-amber-950/30 dark:to-yellow-950/20"
        >
          <span class="text-amber-900 dark:text-amber-100">{{ specialAttendee?.notes || registrationNotes }}</span>
        </div>
        <div v-else class="text-sm italic text-muted-foreground">
          No notes available
        </div>
      </div>

      <!-- Notes Editor -->
      <div v-else class="space-y-3" @click.stop>
        <Textarea
          v-model="notesValue"
          placeholder="Add or edit notes for this attendee"
          class="min-h-[100px]"
          :disabled="isSaving"
        />
        <div class="flex gap-2">
          <Button size="sm" :disabled="isSaving" @click.stop="saveNotes">
            <Icon v-if="isSaving" icon="svg-spinners:ring-resize" class="mr-1 size-3" />
            <Icon v-else icon="tabler:check" class="mr-1 size-3" />
            {{ isSaving ? 'Saving...' : 'Save' }}
          </Button>
          <Button
            variant="outline"
            size="sm"
            :disabled="isSaving"
            @click.stop="cancelEditing"
          >
            Cancel
          </Button>
        </div>
      </div>

      <!-- Usage Examples -->
      <div
        v-if="isEditingNotes"
        class="rounded-md bg-blue-50 p-3 text-xs text-blue-800 dark:bg-blue-900/20 dark:text-blue-200"
      >
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
