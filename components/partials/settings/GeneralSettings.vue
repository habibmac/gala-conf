<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod';
import { useForm } from 'vee-validate';
import { z } from 'zod';

const props = defineProps<{
  eventData: any
  isLoading?: boolean
}>();

const emit = defineEmits<{
  save: [data: any]
}>();

const generalSchema = toTypedSchema(z.object({
  title: z.string().min(1, 'Event title is required'),
  description: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
}));

const { handleSubmit, setValues } = useForm({
  validationSchema: generalSchema,
});

// Initialize form with event data
watch(() => props.eventData, (data) => {
  if (data) {
    setValues({
      title: data.title,
      description: data.description,
      website: data.website,
    });
  }
}, { immediate: true });

const onSubmit = handleSubmit((formData) => {
  emit('save', formData);
});
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
        <FormField v-slot="{ componentField }" name="title">
          <FormItem>
            <FormLabel>Event Title</FormLabel>
            <FormControl>
              <Input v-bind="componentField" placeholder="Enter event title" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

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
      <Button type="submit" :disabled="isLoading">
        Save Changes
      </Button>
    </div>
  </form>
</template>
