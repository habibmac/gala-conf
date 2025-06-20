<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { toTypedSchema } from '@vee-validate/zod';
import VueDatePicker from '@vuepic/vue-datepicker';
import { useForm } from 'vee-validate';
import { toast } from 'vue-sonner';
import { z } from 'zod';

interface Props {
  eventData: any
  isLoading?: boolean
}

const props = defineProps<Props>();

const emit = defineEmits<{
  save: [data: any]
}>();

const { $galantisApi } = useNuxtApp();
const route = useRoute();
const eventId = route.params.eventId as string;

// Simple form schema
const sessionSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Session name is required'),
  date_start: z.string().min(1, 'Start date is required'),
  date_end: z.string().min(1, 'End date is required'),
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
    sessions: [],
  },
});

// Simple state
const isLoadingSessions = ref(true);
const isSaving = ref(false);

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
    const response = await $galantisApi.get(`/event/${eventId}/datetimes`);

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
    console.error('Error loading sessions:', error);
    toast.error('Failed to load sessions');
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

const addSession = () => {
  const now = new Date();
  const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  const newSession = {
    name: `Session ${(form.values.sessions?.length || 0) + 1}`,
    date_start: now.toISOString().slice(0, 16),
    date_end: twoHoursLater.toISOString().slice(0, 16),
    reg_limit: 0,
    description: '',
  };

  push(newSession);
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

const onSubmit = form.handleSubmit(async (values) => {
  try {
    isSaving.value = true;

    const newSessions = values.sessions.filter(session => !session.id);
    const existingSessions = values.sessions.filter(session => session.id);

    const promises = [];

    if (newSessions.length > 0) {
      promises.push(
        $galantisApi.post(`/event/${eventId}/datetimes/bulk`, {
          datetimes: newSessions,
        }),
      );
    }

    if (existingSessions.length > 0) {
      promises.push(
        $galantisApi.put(`/event/${eventId}/datetimes/bulk`, {
          datetimes: existingSessions,
        }),
      );
    }

    const results = await Promise.all(promises);
    const hasErrors = results.some(result => !result.data.success);

    if (hasErrors) {
      const errors = results
        .filter(result => !result.data.success)
        .map(result => result.data.errors || [result.data.message])
        .flat();

      toast.error('Some sessions failed to save', {
        description: errors.join(', '),
      });
    }
    else {
      toast.success('Session settings saved successfully');
      emit('save', values);
    }

    await loadSessions();
  }
  catch (error: any) {
    console.error('Error saving sessions:', error);
    toast.error('Failed to save sessions', {
      description: error?.response?.data?.message || 'Please check your information and try again',
    });
  }
  finally {
    isSaving.value = false;
  }
});

const deleteSession = async (sessionId: string, index: number) => {
  try {
    await $galantisApi.delete(`/event/${eventId}/datetime/${sessionId}`);
    remove(index);
    toast.success('Session deleted successfully');
    await loadSessions();
  }
  catch (error: any) {
    console.error('Error deleting session:', error);
    toast.error('Failed to delete session', {
      description: error?.response?.data?.message || 'Session may have registrations',
    });
  }
};

const { fields, push, remove, insert } = useFieldArray('sessions');
</script>

<template>
  <form class="space-y-6" @submit="onSubmit">
    <!-- Loading State -->
    <div v-if="isLoadingSessions" class="flex items-center justify-center py-8">
      <div class="flex items-center gap-2">
        <Icon icon="svg-spinners:ring-resize" class="mx-auto mb-2 size-8 text-muted-foreground" />
        <span class="text-sm text-muted-foreground">Loading sessions...</span>
      </div>
    </div>

    <!-- Sessions List -->
    <div v-else class="space-y-4">
      <Card v-for="(field, index) in fields" :key="`session-${index}`">
        <CardHeader class="pb-4">
          <div class="flex items-center justify-between">
            <h4 class="font-medium">
              Session {{ index + 1 }}
            </h4>

            <div class="flex items-center gap-2">
              <!-- Dropdown -->
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="ghost" size="icon" :disabled="isSaving">
                    <Icon icon="tabler:dots-vertical" class="size-4" />
                    <span class="sr-only">Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem @click="duplicateSession(index)">
                    <Icon icon="tabler:copy" class="mr-2 size-4" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    v-if="form.values.sessions?.[index]?.id"
                    class="text-destructive focus:text-destructive"
                    @click="deleteSession(form.values.sessions[index].id!, index)"
                  >
                    <Icon icon="tabler:trash" class="mr-2 size-4" />
                    Delete
                  </DropdownMenuItem>
                  <DropdownMenuItem v-else class="text-destructive focus:text-destructive" @click="remove(index)">
                    <Icon icon="tabler:trash" class="mr-2 size-4" />
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent class="space-y-4">
          <!-- Session Name -->
          <FormField v-slot="{ componentField }" :name="`sessions[${index}].name`">
            <FormItem>
              <FormLabel>Session Name</FormLabel>
              <FormControl>
                <Input v-bind="componentField" placeholder="Enter session name" :disabled="isSaving" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <!-- Date and Time Row -->
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField v-slot="{ componentField }" :name="`sessions[${index}].date_start`">
              <FormItem>
                <FormLabel>Start Date & Time</FormLabel>
                <FormControl>
                  <VueDatePicker
                    v-bind="componentField"
                    :enable-time-picker="true"
                    format="yyyy-MM-dd HH:mm"
                    preview-format="dd MMM yyyy, HH:mm"
                    auto-apply
                    :disabled="isSaving"
                    placeholder="Select start date and time"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" :name="`sessions[${index}].date_end`">
              <FormItem>
                <FormLabel>End Date & Time</FormLabel>
                <FormControl>
                  <VueDatePicker
                    v-bind="componentField"
                    :enable-time-picker="true"
                    format="yyyy-MM-dd HH:mm"
                    preview-format="dd MMM yyyy, HH:mm"
                    auto-apply
                    :disabled="isSaving"
                    placeholder="Select end date and time"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>
          </div>

          <!-- Limit and Description Row -->
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField v-slot="{ componentField }" :name="`sessions[${index}].reg_limit`">
              <FormItem>
                <FormLabel>Registration Limit</FormLabel>
                <FormControl>
                  <Input
                    v-bind="componentField"
                    type="number"
                    min="0"
                    placeholder="0 = No limit"
                    :disabled="isSaving"
                  />
                </FormControl>
                <FormDescription>
                  Set to 0 for unlimited registrations
                </FormDescription>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" :name="`sessions[${index}].description`">
              <FormItem>
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <Input v-bind="componentField" placeholder="Session description" :disabled="isSaving" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>
          </div>

          <Alert v-if="form.values.sessions?.[index]?.sold" variant="destructive">
            <AlertDescription class="flex items-center gap-1 text-xs">
              <Icon icon="tabler:alert-triangle-filled" class="mr-2 size-4" />
              This session has {{ form.values.sessions[index].sold }} registrations. Changes may be restricted.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <!-- Empty State -->
      <Card v-if="fields.length === 0" class="border-dashed">
        <CardContent class="flex items-center justify-center py-12">
          <div class="text-center">
            <Icon icon="solar:calendar-bold-duotone" class="mx-auto mb-4 size-12 text-muted-foreground" />
            <h3 class="mb-2 font-medium">
              No sessions configured
            </h3>
            <p class="mb-4 text-sm text-muted-foreground">
              Add your first session to get started
            </p>
            <Button type="button" @click="addSession">
              <Icon icon="tabler:plus" class="mr-2 size-4" />
              Add Session
            </Button>
          </div>
        </CardContent>
      </Card>

      <Button
        v-else
        type="button"
        variant="outline"
        :disabled="isLoadingSessions || isSaving"
        @click="addSession"
      >
        <Icon icon="tabler:plus" class="mr-2 size-4" />
        Add Session
      </Button>
    </div>

    <!-- Submit Button -->
    <div class="flex justify-end border-t pt-4">
      <Button type="submit" :disabled="isLoadingSessions || isSaving || fields.length === 0" class="min-w-[120px]">
        <Icon v-if="isSaving" icon="svg-spinners:ring-resize" class="mr-2 size-4" />
        <Icon v-else-if="fields.length > 0" icon="tabler:check" class="mr-2 size-4" />
        {{ isSaving ? 'Saving...' : 'Save Changes' }}
      </Button>
    </div>
  </form>
</template>
