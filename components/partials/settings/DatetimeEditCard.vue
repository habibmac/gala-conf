<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { toTypedSchema } from '@vee-validate/zod';
import VueDatePicker from '@vuepic/vue-datepicker';
import { useForm } from 'vee-validate';
import { z } from 'zod';

import { formatDateForPicker, formatDateForSubmission } from '@/utils';

interface Props {
  session: any
  canEdit?: boolean
  editWarning?: string | null
}

const props = defineProps<Props>();

const emit = defineEmits<{
  save: [session: any]
  cancel: []
  delete: [session: any]
}>();

// Form schema
const sessionSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Session name is required'),
  date_start: z.string().min(1, 'Start date is required'),
  date_end: z.string().min(1, 'End date is required'),
  reg_limit: z.number().min(0).optional(),
  description: z.string().optional(),
});

const form = useForm({
  validationSchema: toTypedSchema(sessionSchema),
  initialValues: {
    id: props.session.id,
    name: props.session.name || '',
    date_start: props.session.date_start || '',
    date_end: props.session.date_end || '',
    reg_limit: props.session.reg_limit || 0,
    description: props.session.description || '',
  },
});

const onSubmit = form.handleSubmit(async (values) => {
  emit('save', values);
});

const canModifyField = (field: string) => {
  if (!props.session.constraints?.can_modify)
    return true;
  return props.session.constraints.can_modify[field] !== false;
};

const getFieldWarning = (field: string) => {
  if (canModifyField(field))
    return null;

  const totalRegs = props.session.registrations || props.session.sold || 0;

  switch (field) {
    case 'date_start':
    case 'date_end':
      return `Cannot change dates: ${totalRegs} registrations exist`;
    case 'reg_limit':
      return `Cannot decrease limit: ${totalRegs} registrations exist`;
    default:
      return 'Field cannot be modified due to existing registrations';
  }
};
</script>

<template>
  <Card class="border-primary">
    <CardHeader>
      <div class="flex items-center justify-between">
        <CardTitle class="text-base">
          {{ session.id?.startsWith('temp-') ? 'New Session' : 'Edit Session' }}
        </CardTitle>
        <div class="flex items-center gap-2">
          <Button variant="ghost" size="icon" @click="$emit('cancel')">
            <Icon icon="tabler:x" class="size-4" />
          </Button>
        </div>
      </div>
    </CardHeader>

    <CardContent>
      <!-- Warning Message -->
      <Alert v-if="editWarning && !canEdit" class="mb-4" variant="destructive">
        <AlertDescription class="flex items-center gap-1 text-xs">
          <Icon icon="tabler:alert-triangle-filled" class="size-4" />
          <span>{{ editWarning }}</span>
        </AlertDescription>
      </Alert>
      <Alert v-else-if="editWarning" class="mb-4">
        <AlertDescription class="flex items-center gap-1 text-xs">
          <Icon icon="tabler:info-circle" class="size-4" />
          <span>{{ editWarning }}</span>
        </AlertDescription>
      </Alert>

      <form class="space-y-4" @submit="onSubmit">
        <!-- Session Name -->
        <FormField v-slot="{ componentField }" name="name">
          <FormItem>
            <FormLabel>Session Name</FormLabel>
            <FormControl>
              <Input v-bind="componentField" placeholder="Enter session name" :disabled="!canModifyField('name')" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <!-- Date Range Picker - Create a custom FormField for this -->
        <FormField name="active_date_range">
          <FormItem>
            <FormLabel>Session Date & Time Range</FormLabel>
            <FormControl>
              <VueDatePicker
                :model-value="[formatDateForPicker(form.values.date_start || null), formatDateForPicker(form.values.date_end || null)].filter(date => date !== null)"
                range
                :enable-time-picker="true"
                format="yyyy-MM-dd HH:mm"
                preview-format="dd MMM yyyy, HH:mm"
                auto-apply
                :disabled="!canModifyField('date_start') || !canModifyField('date_end')"
                placeholder="Select start and end date & time"
                @update:model-value="(dates: Date[] | null) => {
                  if (dates && Array.isArray(dates)) {
                    form.setFieldValue('date_start', formatDateForSubmission(dates[0]))
                    form.setFieldValue('date_end', formatDateForSubmission(dates[1]))
                  }
                }"
              />
            </FormControl>
            <FormDescription v-if="getFieldWarning('date_start')" class="text-xs text-destructive">
              {{ getFieldWarning('date_start') }}
            </FormDescription>
            <!-- Show validation errors for both date fields -->
            <FormMessage />
          </FormItem>
        </FormField>

        <!-- Registration Limit and Description -->
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField v-slot="{ componentField }" name="reg_limit">
            <FormItem>
              <FormLabel>Registration Limit</FormLabel>
              <FormControl>
                <Input
                  v-bind="componentField"
                  type="number"
                  min="0"
                  placeholder="0 = No limit"
                  :disabled="!canModifyField('reg_limit')"
                />
              </FormControl>
              <FormDescription>
                <span v-if="session.registrations || session.sold">
                  Current: {{ session.registrations || session.sold || 0 }} registrations
                </span>
                <span v-else>Set to 0 for unlimited registrations</span>
              </FormDescription>
              <FormDescription v-if="getFieldWarning('reg_limit')" class="text-xs text-destructive">
                {{ getFieldWarning('reg_limit') }}
              </FormDescription>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField v-slot="{ componentField }" name="description">
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Input
                  v-bind="componentField"
                  placeholder="Session description"
                  :disabled="!canModifyField('description')"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-between pt-4">
          <Button
            v-if="!session.id?.startsWith('temp-')"
            type="button"
            variant="outline"
            @click="$emit('delete', session)"
          >
            <Icon icon="tabler:trash" class="mr-2 size-4" />
            Delete
          </Button>
          <div v-else />

          <div class="flex items-center gap-2">
            <Button type="button" variant="outline" @click="$emit('cancel')">
              Cancel
            </Button>
            <Button type="submit">
              <Icon icon="tabler:check" class="mr-2 size-4" />
              Save
            </Button>
          </div>
        </div>
      </form>
    </CardContent>
  </Card>
</template>
