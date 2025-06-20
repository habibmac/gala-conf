<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { toTypedSchema } from '@vee-validate/zod';
import VueDatePicker from '@vuepic/vue-datepicker';
import { useForm } from 'vee-validate';
import { z } from 'zod';

import { Alert, AlertDescription } from '@/components/ui/alert';

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

// Form schema
const ticketSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Ticket name is required'),
  description: z.string().optional(),
  price: z.number().min(0, 'Price must be 0 or greater'),
  quantity: z.number().min(0, 'Quantity must be 0 or greater'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
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
    datetime_ids: props.ticket.datetime_ids || [],
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
  emit('save', values);
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
    datetime_ids: 'datetime_associations', // Updated field name
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
    case 'datetime_ids':
      return `Cannot change sessions: ${totalRegs} registrations exist`;
    case 'is_taxable':
      return `Cannot change tax setting: ${totalRegs} registrations exist`;
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
          <Icon icon="mdi:alert" class="size-4" />
          <span>{{ editWarning }}</span>
        </AlertDescription>
      </Alert>
      <Alert v-else-if="editWarning" class="mb-3">
        <AlertDescription class="flex items-center gap-1 text-xs">
          <Icon icon="mdi:information" class="size-4" />
          <span>{{ editWarning }}</span>
        </AlertDescription>
      </Alert>
      <form class="space-y-4" @submit="onSubmit">
        <!-- Basic Info -->
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <FormField v-slot="{ componentField }" name="name">
            <FormItem class="md:col-span-2">
              <FormLabel>Ticket Name</FormLabel>
              <FormControl>
                <Input v-bind="componentField" placeholder="Enter ticket name" :disabled="!canModifyField('name')" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

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
        </div>

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

        <!-- Quantity -->
        <FormField v-slot="{ componentField }" name="quantity">
          <FormItem>
            <FormLabel>Available Quantity</FormLabel>
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
              <span v-if="ticket.constraints?.min_allowed_quantity">
                Minimum: {{ ticket.constraints.min_allowed_quantity }} (due to {{ ticket.constraints.total_registrations
                }} existing registrations)
              </span>
              <span v-else>Set to 0 for unlimited tickets</span>
            </FormDescription>
            <FormMessage />
          </FormItem>
        </FormField>

        <!-- Sale Period -->
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField v-slot="{ componentField }" name="start_date">
            <FormItem>
              <FormLabel>On Sale From</FormLabel>
              <FormControl>
                <VueDatePicker
                  v-bind="componentField"
                  :enable-time-picker="true"
                  format="yyyy-MM-dd HH:mm"
                  preview-format="dd MMM yyyy, HH:mm"
                  auto-apply
                  :disabled="!canModifyField('start_date')"
                  placeholder="Select start date and time"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField v-slot="{ componentField }" name="end_date">
            <FormItem>
              <FormLabel>On Sale Until</FormLabel>
              <FormControl>
                <VueDatePicker
                  v-bind="componentField"
                  :enable-time-picker="true"
                  format="yyyy-MM-dd HH:mm"
                  preview-format="dd MMM yyyy, HH:mm"
                  auto-apply
                  :disabled="!canModifyField('end_date')"
                  placeholder="Select end date and time"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
        </div>

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
                <Label class="text-sm">
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

        <!-- Actions -->
        <div class="flex items-center justify-between pt-4">
          <Button
            v-if="!ticket.id?.startsWith('temp-')"
            type="button"
            variant="destructive"
            @click="$emit('delete', ticket)"
          >
            <Icon icon="mdi:delete" class="mr-2 size-4" />
            Delete
          </Button>
          <div v-else />

          <div class="flex items-center gap-2">
            <Button type="button" variant="outline" @click="$emit('cancel')">
              Cancel
            </Button>
            <Button type="submit">
              <Icon icon="mdi:content-save" class="mr-2 size-4" />
              Save
            </Button>
          </div>
        </div>
      </form>
    </CardContent>
  </Card>
</template>
