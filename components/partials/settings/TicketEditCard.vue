<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { toTypedSchema } from '@vee-validate/zod';
import VueDatePicker from '@vuepic/vue-datepicker';
import { useForm } from 'vee-validate';
import { z } from 'zod';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatDateForPicker, formatDateForSubmission } from '@/utils';

interface Props {
  ticket: any
  canEdit: boolean
  editWarning: string | null
  availableDatetimes: any[]
}

const props = defineProps<Props>();

const emit = defineEmits<{
  save: [ticket: any]
  cancel: []
  delete: [ticket: any]
}>();

const initialDatetimeIds = computed(() => {
  return props.ticket.datetimes?.map((dt: any) => dt.id) || [];
});

// Form schema
const ticketSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Ticket name is required'),
  description: z.string().optional(),
  price: z.number().min(0, 'Price must be 0 or greater'),
  quantity: z.number().min(0, 'Quantity must be 0 or greater'),
  start_date: z.union([z.string(), z.date()]).optional(),
  end_date: z.union([z.string(), z.date()]).optional(),
  datetime_ids: z.array(z.string()).optional(),
});

const form = useForm({
  validationSchema: toTypedSchema(ticketSchema),
  initialValues: {
    id: props.ticket.id,
    name: props.ticket.name || '',
    description: props.ticket.description || '',
    price: Number(props.ticket.price) || 0,
    quantity: props.ticket.quantity || 0,
    start_date: props.ticket.start_date || '',
    end_date: props.ticket.end_date || '',
    datetime_ids: initialDatetimeIds.value,
  },
});

const formatPriceInput = (value: number | string) => {
  if (!value || value === 0)
    return '';
  const numValue = typeof value === 'string' ? Number.parseFloat(value.replace(/\D/g, '')) : value;
  return new Intl.NumberFormat('id-ID').format(numValue);
};

const handlePriceInput = (event: Event, onChange: (value: number) => void) => {
  const target = event.target as HTMLInputElement;
  const rawValue = target.value.replace(/\D/g, ''); // Remove all non-digits
  const numValue = rawValue ? Number.parseInt(rawValue, 10) : 0;

  // Update the display value
  target.value = formatPriceInput(numValue);

  // Update the form value
  onChange(numValue);
};

const onSubmit = form.handleSubmit(async (values) => {
  // emit('save', values);
  const formattedValues = {
    ...values,
    start_date: formatDateForSubmission(values.start_date || null),
    end_date: formatDateForSubmission(values.end_date || null),
  };
  emit('save', formattedValues);
});

const canModifyField = (field: string) => {
  if (!props.ticket.constraints?.can_modify)
    return true;

  // Map frontend field names to API field names
  const fieldMapping: Record<string, string> = {
    name: 'name',
    description: 'description',
    price: 'price',
    quantity: 'max_quantity', // quantity editing is controlled by max_quantity
    start_date: 'start_date',
    end_date: 'end_date',
    visibility: 'visibility',
    is_required: 'is_required',
    is_taxable: 'is_taxable',
  };

  const apiField = fieldMapping[field] || field;
  return props.ticket.constraints.can_modify[apiField] !== false;
};

const getFieldWarning = (field: string) => {
  if (canModifyField(field))
    return null;

  const totalRegs = props.ticket.constraints?.total_registrations || 0;

  switch (field) {
    case 'price':
      return `Cannot change price: ${totalRegs} registrations exist`;
    case 'is_taxable':
      return `Cannot change tax setting: ${totalRegs} registrations exist`;
    default:
      return 'Field cannot be modified due to existing registrations';
  }
};

// Watch for prop changes and update form
watch(() => props.ticket.datetimes, (newDatetimes) => {
  const datetimeIds = newDatetimes?.map((dt: any) => dt.id) || [];
  form.setFieldValue('datetime_ids', datetimeIds);
}, { immediate: true });
</script>

<template>
  <Card class="border-primary">
    <CardHeader>
      <div class="flex items-center justify-between">
        <CardTitle class="text-base">
          {{ ticket.id?.startsWith('temp-') ? 'New Ticket' : 'Edit Ticket' }}
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
      <Alert v-if="editWarning && !canEdit" class="mb-3" variant="destructive">
        <AlertDescription class="flex items-center gap-1 text-xs">
          <Icon icon="tabler:alert-triangle-filled" class="size-4" />
          <span>{{ editWarning }}</span>
        </AlertDescription>
      </Alert>
      <Alert v-else-if="editWarning" class="mb-3">
        <AlertDescription class="flex items-center gap-1 text-xs">
          <Icon icon="tabler:info-circle" class="size-4" />
          <span>{{ editWarning }}</span>
        </AlertDescription>
      </Alert>
      <form class="space-y-4" @submit="onSubmit">
        <!-- Basic Info -->
        <FormField v-slot="{ componentField }" name="name">
          <FormItem class="md:col-span-2">
            <FormLabel>Ticket Name</FormLabel>
            <FormControl>
              <Input v-bind="componentField" placeholder="Enter ticket name" :disabled="!canModifyField('name')" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <!-- Description -->
        <FormField v-slot="{ componentField }" name="description">
          <FormItem>
            <FormLabel>Description (Optional)</FormLabel>
            <FormControl>
              <Textarea v-bind="componentField" placeholder="Ticket description" class="min-h-[60px] resize-none" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <div class="grid grid-cols-2 gap-4">
          <FormField v-slot="{ componentField }" name="price">
            <FormItem>
              <FormLabel>Price</FormLabel>
              <FormControl>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    Rp
                  </span>
                  <Input
                    :model-value="formatPriceInput(componentField.modelValue)"
                    type="text"
                    placeholder="0"
                    class="pl-8"
                    :disabled="!canModifyField('price')"
                    @input="handlePriceInput($event, componentField.onChange)"
                    @blur="componentField.onBlur"
                  />
                </div>
              </FormControl>
              <FormDescription v-if="getFieldWarning('price')" class="text-xs text-destructive">
                {{ getFieldWarning('price') }}
              </FormDescription>
              <FormMessage />
            </FormItem>
          </FormField>
          <!-- Quantity -->
          <FormField v-slot="{ componentField }" name="quantity">
            <FormItem>
              <FormLabel>Quota</FormLabel>
              <FormControl>
                <Input
                  v-bind="componentField"
                  type="number"
                  :min="ticket.constraints?.min_allowed_quantity || 0"
                  placeholder="100"
                  :disabled="!canModifyField('quantity')"
                />
              </FormControl>
              <FormDescription>
                <span v-if="ticket.constraints?.min_allowed_quantity && ticket.constraints.total_registrations">
                  Minimum: {{ ticket.constraints.min_allowed_quantity }} (due to {{
                    ticket.constraints.total_registrations
                  }} existing registrations)
                </span>
                <span v-else>Set to 0 for unlimited quota</span>
              </FormDescription>
              <FormMessage />
            </FormItem>
          </FormField>
        </div>

        <!-- Sale Period -->
        <div class="grid grid-cols-1 gap-4 sidebar-expanded:grid-cols-1 md:grid-cols-2">
          <FormField name="sale_period">
            <FormItem>
              <FormLabel>Sale Period</FormLabel>
              <FormControl>
                <VueDatePicker
                  :model-value="[formatDateForPicker(form.values.start_date || null), formatDateForPicker(form.values.end_date || null)].filter(date => date !== null)"
                  range
                  :enable-time-picker="true"
                  format="yyyy-MM-dd HH:mm"
                  preview-format="dd MMM yyyy, HH:mm"
                  auto-apply
                  :disabled="!canModifyField('start_date') || !canModifyField('end_date')"
                  placeholder="Select sale period"
                  @update:model-value="(dates: Date[] | null) => {
                    if (dates && Array.isArray(dates)) {
                      form.setFieldValue('start_date', formatDateForSubmission(dates[0]))
                      form.setFieldValue('end_date', formatDateForSubmission(dates[1]))
                    }
                  }"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <!-- Session Association -->
          <FormField v-slot="{ componentField }" name="datetime_ids">
            <FormItem>
              <FormLabel>Accessible Sessions</FormLabel>
              <FormDescription>
                Select which sessions this ticket has access to
              </FormDescription>
              <div class="grid grid-cols-1 gap-2 md:grid-cols-2">
                <div v-for="datetime in availableDatetimes" :key="datetime.id" class="flex items-center space-x-2">
                  <Checkbox
                    :id="`datetime-${datetime.id}`"
                    :checked="componentField.modelValue?.includes(datetime.id)"
                    :disabled="!canModifyField('datetime_ids')"
                    @update:checked="(checked) => {
                      const currentIds = componentField.modelValue || [];
                      if (checked) {
                        componentField.onChange([...currentIds, datetime.id]);
                      }
                      else {
                        componentField.onChange(currentIds.filter((id: string) => id !== datetime.id));
                      }
                    }"
                  />
                  <Label class="text-sm" :for="`datetime-${datetime.id}`">
                    {{ datetime.name || `Session ${datetime.id}` }}
                  </Label>
                </div>
              </div>
              <div v-if="getFieldWarning('datetime_ids')" class="text-xs text-destructive">
                {{ getFieldWarning('datetime_ids') }}
              </div>
              <FormMessage />
            </FormItem>
          </FormField>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-between pt-4">
          <Button
            v-if="!ticket.id?.startsWith('temp-')"
            type="button"
            variant="outline"
            @click="$emit('delete', ticket)"
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
