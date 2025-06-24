<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { toTypedSchema } from '@vee-validate/zod';
import { useForm } from 'vee-validate';
import { toast } from 'vue-sonner';
import { z } from 'zod';

import DatetimeDisplayCard from './DatetimeDisplayCard.vue';
import DatetimeEditCard from './DatetimeEditCard.vue';

interface Props {
  eventData: any
  isLoading?: boolean
}

const props = defineProps<Props>();

const { $galantisApi } = useNuxtApp();
const route = useRoute();
const eventId = computed(() => route.params.eventId as string || '');

// Simple form schema
const sessionSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Session name is required'),
  date_start: z.union([z.string(), z.date()]).optional(),
  date_end: z.union([z.string(), z.date()]).optional(),
  reg_limit: z.number().min(0).optional(),
  description: z.string().optional(),
  sold: z.number().min(0).optional(),
});

const formSchema = z.object({
  sessions: z.array(sessionSchema).min(1, 'At least one session is required'),
});

const form = useForm({
  validationSchema: toTypedSchema(formSchema),
  initialValues: {
    sessions: [] as z.infer<typeof formSchema>['sessions'],
  },
});

// Simple state
const isLoadingSessions = ref(true);

// Load sessions on mount
onMounted(async () => {
  await loadSessions();
});

// Watch for eventData changes
watch(() => props.eventData, (newEventData) => {
  if (newEventData?.eventDatetimes) {
    updateSessionsFromEventData(newEventData.eventDatetimes);
  }
}, { immediate: true });

const loadSessions = async () => {
  try {
    isLoadingSessions.value = true;
    const response = await $galantisApi.get(`/event/${eventId.value}/datetimes`);

    if (response.data) {
      form.setValues({
        sessions: response.data.map((session: any) => ({
          ...session,
          reg_limit: session.reg_limit || 0,
          sold: session.sold || 0,
        })),
      });
    }
  }
  catch (error) {
    const { errorMessage, errorDescription } = handleApiError(error, 'Failed to load sessions');

    toast.error(errorMessage, {
      description: errorDescription,
    });
  }
  finally {
    isLoadingSessions.value = false;
  }
};

const updateSessionsFromEventData = (eventDatetimes: any[]) => {
  if (!eventDatetimes)
    return;

  const formattedSessions = eventDatetimes.map(datetime => ({
    id: datetime.id,
    name: datetime.name || `Session ${datetime.id}`,
    date_start: datetime.date_start,
    date_end: datetime.date_end,
    reg_limit: datetime.reg_limit || 0,
    description: datetime.description || '',
  }));

  form.setValues({ sessions: formattedSessions });
};

const duplicateSession = (index: number) => {
  const sessions = form.values.sessions;
  if (!sessions || !sessions[index])
    return;

  const originalSession = sessions[index];
  const duplicatedSession = {
    ...originalSession,
    id: undefined, // Remove ID so it creates a new session
    name: `${originalSession.name} (Copy)`,
  };

  insert(index + 1, duplicatedSession);
};

const { remove, insert } = useFieldArray('sessions');

const editingSessionId = ref<string | null>(null);

const addSession = () => {
  const newSession = {
    id: `temp-${Date.now()}`, // This temp ID should not be sent to the server
    name: '',
    date_start: '',
    date_end: '',
    reg_limit: 0,
    description: '',
  };

  insert(0, newSession); // Insert at the top
  editingSessionId.value = newSession.id; // Set editing mode
};

const editSession = (sessionId: string) => {
  editingSessionId.value = sessionId;
};

const cancelEdit = () => {
  if (editingSessionId.value?.startsWith('temp-')) {
    const sessions = form.values.sessions || [];
    const index = sessions.findIndex(s => s.id === editingSessionId.value);
    if (index !== -1) {
      remove(index);
    }
  }
  editingSessionId.value = null;
};

const saveSession = async (_sessionData: any) => {
  try {
    const sessionData = {
      ..._sessionData,
      date_start: formatDateForSubmission(_sessionData.date_start),
      date_end: formatDateForSubmission(_sessionData.date_end),
    };

    // Check if this is a new session (temp ID) or existing session
    const isNewSession = !editingSessionId.value || editingSessionId.value.startsWith('temp-');

    if (isNewSession) {
      // Create new session - POST to /datetimes (note the plural)
      const response = await $galantisApi.post(`/event/${eventId.value}/datetimes`, sessionData);

      if (response.data && response.data.id) {
        // Update the session with the real ID from server
        const sessions = form.values.sessions || [];
        const sessionIndex = sessions.findIndex(s => s.id === editingSessionId.value);
        if (sessionIndex !== -1) {
          sessions[sessionIndex] = {
            ...sessionData,
            id: response.data.id,
          };
          form.setValues({ sessions });
        }
        toast.success('Session created successfully');
      }
    }
    else {
      // Update existing session - PUT to /datetime/:id (note the singular)
      await $galantisApi.put(`/event/${eventId.value}/datetime/${editingSessionId.value}`, sessionData);
      toast.success('Session updated successfully');
    }

    editingSessionId.value = null;
    await loadSessions(); // Refresh the list
  }
  catch (error) {
    const { errorMessage, errorDescription } = handleApiError(error, 'Failed to save session');

    toast.error(errorMessage, {
      description: errorDescription,
    });
  }
};

const getEditWarning = (session: any) => {
  if (session.sold > 0) {
    return `This session has ${session.sold} registrations. Some changes may be restricted.`;
  }
  return null;
};

const canEdit = (session: any) => {
  return session.sold === 0;
};

const deleteSession = async (sessionId: string, index: number) => {
  try {
    await $galantisApi.delete(`/event/${eventId.value}/datetime/${sessionId}`);
    remove(index);
    toast.success('Session deleted successfully');
    await loadSessions();
  }
  catch (error) {
    const { errorMessage, errorDescription } = handleApiError(error, 'Failed to delete session');

    toast.error(errorMessage, {
      description: errorDescription,
    });
  }
};
</script>

<template>
  <div class="space-y-4">
    <div v-if="isLoadingSessions" class="flex items-center justify-center py-8">
      <div class="flex items-center gap-2">
        <Icon icon="svg-spinners:ring-resize" class="mx-auto mb-2 size-8 text-muted-foreground" /> <span
          class="text-sm text-muted-foreground"
        >Loading sessions...</span>
      </div>
    </div>

    <div v-else class="space-y-4">
      <div v-for="(session, index) in form.values.sessions" :key="session.id || index">
        <!-- Editing Mode -->
        <DatetimeEditCard
          v-if="editingSessionId === session.id"
          :session="session"
          :can-edit="canEdit(session)"
          :edit-warning="getEditWarning(session)"
          @save="saveSession"
          @cancel="cancelEdit"
          @delete="(session) => deleteSession(session.id, index)"
        />
        <!-- Display Mode -->
        <DatetimeDisplayCard
          v-else
          :session="session"
          :can-edit="canEdit(session)"
          :edit-warning="getEditWarning(session)"
          @edit="editSession"
          @duplicate="duplicateSession"
          @delete="(session) => deleteSession(session.id, index)"
        />
      </div>
    </div>

    <div class="mt-4 flex items-center justify-between">
      <Button
        variant="default"
        :disabled="isLoadingSessions || editingSessionId"
        @click="addSession"
      >
        <Icon icon="tabler:plus" class="mr-2 size-4" />
        Add Ticket
      </Button>
    </div>
  </div>
</template>
