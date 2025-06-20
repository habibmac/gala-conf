<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { toTypedSchema } from '@vee-validate/zod';
import { useForm } from 'vee-validate';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const props = defineProps<{
  loading?: boolean
  initialValues?: {
    theme?: 'light' | 'dark' | 'system'
    language?: string
    locale?: string
    timezone?: string
  }
}>();
const emit = defineEmits(['submit']);
const preferencesFormSchema = toTypedSchema(z.object({
  theme: z.enum(['light', 'dark', 'system'] as const).optional(),
  locale: z.string().optional(),
  language: z.string().optional(),
  timezone: z.string().optional(),
}));

const { handleSubmit } = useForm({
  validationSchema: preferencesFormSchema,
  initialValues: {
    theme: props.initialValues?.theme || 'system',
    language: props.initialValues?.language || 'en',
    locale: props.initialValues?.locale || 'id-ID',
    timezone: props.initialValues?.timezone || 'Asia/Jakarta',
  },
});

const themeOptions = [
  { label: 'Light', value: 'light' as const },
  { label: 'Dark', value: 'dark' as const },
  { label: 'System', value: 'system' as const },
];

const languageOptions = [
  { label: 'English', value: 'en' },
  { label: 'Bahasa Indonesia', value: 'id' },
];

const timezoneOptions = [
  { label: 'Asia/Jakarta (WIB)', value: 'Asia/Jakarta' },
  { label: 'Asia/Makassar (WITA)', value: 'Asia/Makassar' },
  { label: 'Asia/Jayapura (WIT)', value: 'Asia/Jayapura' },
  { label: 'UTC', value: 'UTC' },
];

const onSubmit = handleSubmit((values) => {
  emit('submit', values);
});
</script>

<template>
  <form class="space-y-4" @submit="onSubmit">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <!-- Theme Selection -->
      <FormField v-slot="{ componentField }" name="theme">
        <FormItem>
          <FormLabel>Theme</FormLabel>
          <Select v-bind="componentField">
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem v-for="option in themeOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      </FormField>

      <!-- Language Selection -->
      <FormField v-slot="{ componentField }" name="language">
        <FormItem>
          <FormLabel>Language</FormLabel>
          <Select v-bind="componentField">
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem v-for="option in languageOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      </FormField>

      <!-- Timezone Selection -->
      <FormField v-slot="{ componentField }" name="timezone">
        <FormItem>
          <FormLabel>Timezone</FormLabel>
          <Select v-bind="componentField">
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem v-for="option in timezoneOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      </FormField>
    </div>

    <div class="flex justify-end">
      <Button type="submit" :disabled="loading">
        <Icon v-if="loading" icon="svg-spinners:ring-resize" class="mr-2 size-4" />
        <Icon v-else icon="tabler:check" class="mr-2 size-4" />
        {{ loading ? 'Saving...' : 'Save Preferences' }}
      </Button>
    </div>
  </form>
</template>
