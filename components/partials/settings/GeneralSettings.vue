<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { toTypedSchema } from '@vee-validate/zod';
import { useForm } from 'vee-validate';
import { toast } from 'vue-sonner';
import { z } from 'zod';

const props = defineProps<{
  eventData: any
}>();

const emit = defineEmits<{
  save: [data: any]
}>();

const { $galantisApi } = useNuxtApp();

const generalSchema = toTypedSchema(z.object({
  description: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
}));

const { handleSubmit, setValues, isSubmitting } = useForm({
  validationSchema: generalSchema,
});

const { refetch } = useEvent();
const { refetch: refetchEvents } = useEvents();

const onSubmit = handleSubmit(async (formData) => {
  // If no changes, do nothing
  const currentValues = {
    description: props.eventData.description,
    website: props.eventData.website,
  };

  if (JSON.stringify(formData) === JSON.stringify(currentValues)) {
    return;
  }

  try {
    const response = await $galantisApi.put(`/event/${props.eventData.id}`, formData);
    const authStore = useAuthStore();
    const route = useRoute();
    const currentEventId = route.params.eventId as string;

    // Update auth store immediately
    if (authStore.selectedEvent?.id === currentEventId) {
      // Create updated event maintaining all required properties
      const updatedEvent = Object.assign({}, authStore.selectedEvent, formData);
      await authStore.setSelectedEvent(updatedEvent);
    }

    // Refresh events list
    await refetch();
    await refetchEvents();

    toast.success(response.data.message || 'Settings saved successfully');
  }
  catch (error) {
    const { errorMessage, errorDescription } = handleApiError(error, 'Failed to save settings');
    toast.error(errorMessage, {
      description: errorDescription,
    });
  }
  // Emit save event with form data
  emit('save', formData);
});

// Initialize form with event data
watch(() => props.eventData, (data) => {
  if (data) {
    setValues({
      description: data.description,
      website: data.website,
    });
  }
}, { immediate: true });
</script>

<template>
  <form class="space-y-6" @submit="onSubmit">
    <Card>
      <CardHeader>
        <CardTitle>General Information</CardTitle>
        <CardDescription>
          Basic event details and description
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <Alert variant="info" class="mb-4">
          <AlertTitle>Note</AlertTitle>
          <AlertDescription>
            Editing these settings will update the event information across the platform. Ensure all details are correct
            before saving.
          </AlertDescription>
        </Alert>
        <!-- Disable edit for title, show as plain text, not an input -->
        <div class="rounded-lg border bg-muted/50 p-4">
          <Label class="text-sm font-medium">
            Event Title
          </Label>
          <p class="text-lg font-semibold">
            {{ props.eventData.title }}
          </p>
        </div>

        <FormField v-slot="{ componentField }" name="description">
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea v-bind="componentField" placeholder="Event description" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="website">
          <FormItem>
            <FormLabel>Website URL</FormLabel>
            <FormControl>
              <Input v-bind="componentField" placeholder="https://example.com" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
      </CardContent>
    </Card>

    <div class="flex justify-end">
      <Button type="submit" :disabled="isSubmitting" class="w-full sm:w-auto">
        <Icon v-if="isSubmitting" icon="svg-spinners:ring-resize" class="mr-2 size-4" />
        <Icon v-else icon="tabler:check" class="mr-2 size-4" />
        {{ isSubmitting ? 'Saving...' : 'Save Settings' }}
      </Button>
    </div>
  </form>
</template>
