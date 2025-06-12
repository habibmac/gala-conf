<script setup lang="ts">
import type { SortableEvent } from 'vue-draggable-plus';

import { Icon } from '@iconify/vue';
import { toTypedSchema } from '@vee-validate/zod';
import VueDatePicker from '@vuepic/vue-datepicker';
import { endOfDay, format, startOfDay } from 'date-fns';
import { VueDraggable } from 'vue-draggable-plus';
import { z } from 'zod';

import FieldComboFilter from '@/components/FieldComboFilter.vue';
import FieldTextarea from '@/components/FieldTextarea.vue';
import FormStep from '@/components/FormStep.vue';
import FormWizard from '@/components/FormWizard.vue';
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from '@/components/ui/number-field';
import FieldInputText from '~/components/FieldInputText.vue';

interface FormValues {
  eventDatetimes?: Array<{ name: string }>
  tickets?: Array<{ name: string }>
}
const formValues = ref<FormValues>({});

interface FormWizardExpose {
  updateFormField: (field: unknown, value: unknown) => void
  errorMessages: (field: string) => string
}

useHead({
  meta: [
    {
      content: 'Create a new event on Galanesia ID',
      name: 'description',
    },
  ],
  title: 'New Event',
});

definePageMeta({
  layout: 'dashboard',
  navTitle: 'Create New Event',
});

const steps = [
  {
    description: 'Add your event details',
    title: 'Event Details',
  },
  {
    description: 'Add your event datetimes and tickets',
    title: 'Datetimes & Tickets',
  },
  {
    description: 'Enter your payment information',
    title: 'Billing Info',
  },
];

const formWizardRef = ref<FormWizardExpose | null>(null);
const eventDatetimesRef = ref<Array<unknown>>([]);
const eventTicketsRef = ref<Array<unknown>>([]);
const currentStep = ref(0);

const eventScaleOptions = ref([
  { label: 'International', value: 'International' },
  { label: 'National', value: 'National' },
  { label: 'Regional', value: 'Regional' },
  { label: 'Local', value: 'Local' },
  { label: 'Internal', value: 'Internal' },
]);

const eventCategories = ref([
  {
    icon: 'mdi:presentation',
    id: 'seminar',
    label: 'Seminar & Konferensi',
  },
  {
    icon: 'mdi:run',
    id: 'olahraga',
    label: 'Olahraga & Kebugaran',
  },
  {
    icon: 'mdi:theater',
    id: 'pertunjukan',
    label: 'Pertunjukan & Hiburan',
  },
  {
    icon: 'mdi:party-popper',
    id: 'parties',
    label: 'Pesta & Perayaan',
  },
  {
    icon: 'mdi:view-gallery',
    id: 'pameran',
    label: 'Pameran & Expo',
  },
  {
    icon: 'mdi:dots-horizontal-circle',
    id: 'other',
    label: 'Lainnya',
  },
]);

// Define the schema for each step
const step1Schema = z.object({
  coverImg: z.any(),
  eventCategory: z
    .string()
    .min(1, 'Event category is required')
    .refine(
      (value) => {
        return eventCategories.value.some(cat => cat.label === value);
      },
      {
        message: 'Please choose a valid event category',
      },
    ),
  eventDescription: z.string().min(10, 'Event description must be at least 10 characters long'),
  eventScale: z
    .string()
    .min(1, 'Event scale is required')
    .refine(
      (value) => {
        return eventScaleOptions.value.some(scale => scale.label === value);
      },
      {
        message: 'Please choose a valid event scale',
      },
    ),
  eventTitle: z.string().min(5, 'Event title must be at least 5 characters long'),
  logo: z
    .string()
    .min(1, 'Logo ID is required')
    .refine(value => value.length > 0, {
      message: 'Please upload your logo',
    }),
  venueAddress: z.string().min(1, 'Venue address is required'),
  venueCity: z.string().min(1, 'Venue city is required'),
  venueCountry: z.string().min(1, 'Venue country is required'),
  venueName: z.string().min(1, 'Venue name is required'),
  venueState: z.string().min(1, 'Venue state is required'),
  website: z.string().url().optional(),
});

const step2Schema = z
  .object({
    eventDatetimes: z
      .array(
        z.object({
          name: z.string().min(1, 'Session Name is required'),
          quota: z.number().int().min(1, 'Quota must be more than 0'),
          rangeDate: z.array(z.string()).length(2, 'Date range is required'),
        }),
      )
      .min(1, 'At least one event datetime is required'),
    tickets: z
      .array(
        z.object({
          name: z.string().min(1, 'Ticket Name is required'),
          price: z.number().min(0, 'Price must be a positive number'),
          quota: z.number().int().min(1, 'Quota must be more than 0'),
          rangeDate: z.array(z.string()).length(2, 'Date range is required'),
          sessions: z.array(z.string()).min(1, 'At least one session is required'),
        }),
      )
      .min(1, 'At least one ticket is required'),
  })
  .superRefine((data, ctx) => {
    // Check for unique session names
    const sessionNames = data.eventDatetimes.map(dt => dt.name);
    const uniqueSessionNames = new Set(sessionNames);
    if (sessionNames.length !== uniqueSessionNames.size) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Session names must be unique',
        path: ['eventDatetimes', 'duplicate'],
      });
    }

    // Check for unique ticket names
    const ticketNames = data.tickets.map(ticket => ticket.name);
    const uniqueTicketNames = new Set(ticketNames);
    if (ticketNames.length !== uniqueTicketNames.size) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Ticket names must be unique',
        path: ['tickets', 'duplicate'],
      });
    }

    // Validate sessions in tickets
    const validSessionNames = new Set(sessionNames);
    const validatedTickets = data.tickets.filter((ticket) => {
      const validSessions = ticket.sessions.filter(session => validSessionNames.has(session));
      return validSessions.length > 0;
    });

    if (validatedTickets.length !== data.tickets.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Some tickets have been removed due to invalid sessions',
        path: ['tickets'],
      });
    }

    return { ...data, tickets: validatedTickets };
  });

const step3Schema = z.object({
  acceptTerms: z.boolean().refine(value => value, {
    message: 'You must agree to the NDA',
  }),
  bankAccount: z.string().min(1, 'Bank account is required'),
  bankName: z.string().min(1, 'Bank name is required'),
});

// Create an array of typed schemas for each step
const validationSchema = [toTypedSchema(step1Schema), toTypedSchema(step2Schema), toTypedSchema(step3Schema)];

const selectCity = (option: { city: string, state: string, country: string }) => {
  formWizardRef.value?.updateFormField('venueCity', option.city);
  formWizardRef.value?.updateFormField('venueState', option.state);
  formWizardRef.value?.updateFormField('venueCountry', option.country);
};

const onSort = (e: SortableEvent, fieldName: 'eventDatetimes' | 'tickets') => {
  const { newIndex, oldIndex } = e;

  if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) {
    return;
  }

  if (!formValues.value?.[fieldName]) {
    return;
  }

  // Clone the array, sort it, and update the form values
  const field = [...formValues.value[fieldName]];
  const [removed] = field.splice(oldIndex, 1);
  field.splice(newIndex, 0, removed);

  formWizardRef.value?.updateFormField(fieldName, field);
};

const isAnySessionExists = computed(() => {
  // Check if there are any event datetimes with non-empty names
  return formValues.value?.eventDatetimes?.some(dt => dt.name.trim() !== '');
});

// Range date picker options
const minDate = ref(startOfDay(new Date()));
const newDateStart = ref(format(startOfDay(new Date()), 'yyyy-MM-dd HH:mm'));
const newDateEnd = ref(format(endOfDay(new Date()), 'yyyy-MM-dd HH:mm'));

const colorMode = useColorMode();

const updateFormValues = (values: FormValues) => {
  formValues.value = values;

  // Update the event datetimes reference
  if (values.eventDatetimes) {
    eventDatetimesRef.value = values.eventDatetimes;
  }

  // Update the event tickets reference
  if (values.tickets) {
    eventTicketsRef.value = values.tickets;
  }
};

// Check if there are any duplicate errors
const hasDuplicateErrors = computed(() => {
  return (
    !!formWizardRef.value?.errorMessages('eventDatetimes.duplicate')
    || !!formWizardRef.value?.errorMessages('tickets.duplicate')
  );
});

const handleStepChange = (step: number) => {
  currentStep.value = step;
};

function onSubmit(formData: FormData) {
  console.warn(JSON.stringify(formData, null, 2));
}
</script>

<template>
  <section class="relative flex h-full">
    <div class="flex grow translate-x-0 flex-col transition-transform duration-300 ease-in-out md:translate-x-0">
      <FormWizard
        id="new-event-form"
        ref="formWizardRef"
        :validation-schema="validationSchema"
        @submit="onSubmit"
        @update:current-step="handleStepChange"
        @form-values-update="updateFormValues"
      >
        <template #form-steps>
          <div class="relative w-full flex-1 overflow-auto">
            <div
              class="mx-auto flex items-center justify-center space-x-0 px-4 py-3 sm:max-w-5xl sm:space-x-6 sm:px-0 sm:py-6"
            >
              <div
                v-for="(step, index) in validationSchema.map((_, i) => steps[i])"
                :key="index"
                class="flex shrink-0 items-center space-x-2"
                :class="[currentStep === index ? '' : 'hidden md:flex']"
              >
                <div
                  class="flex size-6 items-center justify-center rounded-full"
                  :class="[
                    currentStep === index ? 'bg-primary' : 'bg-accent',
                  ]"
                >
                  <span
                    class="text-sm font-medium"
                    :class="{
                      '': currentStep !== index,
                      'text-primary-foreground': currentStep === index,
                    }"
                  >
                    {{ index + 1 }}
                  </span>
                </div>
                <h3
                  class="whitespace-nowrap text-sm font-medium"
                  :class="[
                    currentStep === index ? 'text-primary' : 'text-muted-foreground',
                  ]"
                >
                  {{ step.title }}
                </h3>
              </div>
            </div>
          </div>
        </template>

        <template #form-content>
          <FormStep>
            <div class="relative h-80 w-full overflow-hidden">
              <div class="absolute top-0 size-full">
                <FieldImageUpload
                  id="cover-img-upload"
                  name="coverImg"
                  label="Cover Image"
                  type="cover"
                />
              </div>
            </div>

            <!-- Event Details -->
            <div class="container pb-10">
              <div class="mx-auto max-w-3xl py-10">
                <div class="mx-auto -mt-40 mb-6 text-center sm:-mt-40">
                  <FieldImageUpload
                    id="logo-upload"
                    name="logo"
                    label="Logo"
                    type="logo"
                  />
                </div>

                <div class="space-y-5">
                  <FieldInputText name="eventTitle" label="Event Title" />
                  <FieldTextarea name="eventDescription" label="Event Description" />
                  <FieldRadioGroup
                    name="eventScale"
                    label="Event Scale"
                    :options="eventScaleOptions"
                    layout="horizontal"
                    wrapper-class="grid grid-cols-2 gap-2"
                  />
                  <FieldRadioGroup
                    name="eventCategory"
                    label="Event Category"
                    :options="eventCategories"
                    layout="vertical"
                    wrapper-class="grid grid-cols-2 gap-2 mt-2 sm:grid-cols-3"
                  />
                  <FieldInputText name="website" label="Website" />

                  <div class="grid gap-4 sm:grid-cols-3">
                    <label class="text-sm font-semibold">Venue</label>
                    <FieldInputText name="venueName" label="Venue Name" wrapper-class="sm:col-span-3" />
                    <FieldInputText name="venueAddress" label="Venue Address" wrapper-class="sm:col-span-3" />
                    <FieldComboFilter name="venueCity" label="Venue City" @select="selectCity" />
                    <FieldInputText name="venueState" label="Venue State" disabled />
                    <FieldInputText name="venueCountry" label="Venue Country" disabled />
                  </div>
                </div>
              </div>
            </div>
          </FormStep>
          <FormStep>
            <!-- Event Datetimes and Tickets -->
            <div class="container pb-10">
              <div class="mx-auto max-w-3xl py-10">
                <div class="space-y-6">
                  <div
                    v-if="hasDuplicateErrors"
                    class="mb-4 rounded-lg bg-destructive-foreground p-4 text-sm text-destructive"
                  >
                    <div class="flex items-center gap-1 text-xs">
                      <Icon icon="heroicons-solid:exclamation-circle" class="size-6" />
                      <div>Please fix the errors below</div>
                    </div>
                    <ul class="ml-2.5 list-inside list-disc">
                      <li v-if="formWizardRef?.errorMessages('eventDatetimes.duplicate')">
                        {{ formWizardRef?.errorMessages('eventDatetimes.duplicate') }}
                      </li>
                      <li v-if="formWizardRef?.errorMessages('tickets.duplicate')">
                        {{ formWizardRef?.errorMessages('tickets.duplicate') }}
                      </li>
                    </ul>
                  </div>
                  <div class="">
                    <label class="text-sm font-semibold">Sessions & Datetimes</label>
                    <div class="mt-2 flex flex-col gap-2 md:gap-4">
                      <FieldArray v-slot="{ push, remove }" name="eventDatetimes">
                        <VueDraggable
                          v-model="eventDatetimesRef"
                          :animation="150"
                          handle=".handle"
                          ghost-class="is-ghost"
                          drag-class="is-dragging"
                          @end="onSort($event, 'eventDatetimes')"
                        >
                          <div
                            v-for="(field, index) in eventDatetimesRef"
                            :key="index"
                            class="relative ml-5 flex flex-col items-start gap-2 border-l py-2 pl-3 sm:flex-row sm:flex-wrap"
                          >
                            <Icon
                              icon="mdi:drag-vertical"
                              class="handle absolute -left-6 size-6 cursor-move text-muted-foreground"
                            />
                            <FormField v-slot="{ componentField }" :name="`eventDatetimes[${index}].name`">
                              <FormItem v-auto-animate class="w-full sm:w-1/3 md:w-1/3">
                                <FormLabel>Session Name</FormLabel>
                                <FormControl>
                                  <Input type="text" :placeholder="`Day ${index + 1}`" v-bind="componentField" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            </FormField>
                            <FormField
                              v-slot="{ componentField, value, handleChange, errors }"
                              :name="`eventDatetimes[${index}].rangeDate`"
                            >
                              <FormItem v-auto-animate class="w-full flex-1">
                                <FormLabel>Start - End</FormLabel>
                                <FormControl>
                                  <VueDatePicker
                                    v-bind="componentField"
                                    :model-value="value"
                                    range
                                    multi-calendars
                                    :dark="colorMode.value === 'dark'"
                                    :enable-time-picker="false"
                                    model-type="yyyy-MM-dd HH:mm"
                                    format="d LLL yyyy HH:mm"
                                    :min-date="minDate"
                                    @update:model-value="handleChange"
                                  >
                                    <template #dp-input="{ value: inputValue }">
                                      <input
                                        type="text"
                                        class="form-input w-full"
                                        :class="{
                                          'is-invalid': !!errors.length,
                                        }"
                                        placeholder="Start - End Date & Time"
                                        :value="inputValue"
                                        autocomplete="off"
                                      >
                                    </template>
                                  </VueDatePicker>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            </FormField>
                            <FormField v-slot="{ value, handleChange }" :name="`eventDatetimes[${index}].quota`">
                              <FormItem v-auto-animate class="max-w-32">
                                <FormLabel>Quota</FormLabel>
                                <NumberField
                                  class="gap-2"
                                  :min="0"
                                  :model-value="value"
                                  @update:model-value="handleChange"
                                >
                                  <NumberFieldContent>
                                    <NumberFieldDecrement />
                                    <FormControl>
                                      <NumberFieldInput />
                                    </FormControl>
                                    <NumberFieldIncrement />
                                  </NumberFieldContent>
                                </NumberField>
                                <FormMessage />
                              </FormItem>
                            </FormField>
                            <div class="absolute bottom-0 right-0 sm:static sm:bottom-auto sm:right-auto sm:pt-8">
                              <Button
                                size="icon"
                                class="text-red-500"
                                variant="ghost"
                                @click.prevent="remove(index)"
                              >
                                <Icon icon="material-symbols-light:close-rounded" class="size-6" />
                              </Button>
                            </div>
                          </div>
                        </VueDraggable>
                        <Button
                          class="mt-2 flex gap-1"
                          @click.prevent="
                            push({
                              name: '',
                              rangeDate: [newDateStart, newDateEnd],
                              quota: 0,
                            })
                          "
                        >
                          <Icon icon="heroicons:plus-circle-16-solid" class="size-4" />
                          <span>Add Datetime</span>
                        </Button>
                      </FieldArray>
                    </div>
                  </div>
                  <!-- Tickets -->
                  <div>
                    <label class="text-sm font-semibold">Tickets</label>
                    <div v-if="isAnySessionExists" class="mt-2 flex flex-col gap-2">
                      <FieldArray v-slot="{ fields, push, remove }" name="tickets">
                        <VueDraggable
                          v-model="eventTicketsRef"
                          :animation="150"
                          handle=".handle"
                          ghost-class="is-ghost"
                          drag-class="is-dragging"
                          @end="onSort($event, 'tickets')"
                        >
                          <div
                            v-for="(field, index) in fields"
                            :key="field.key"
                            class="relative ml-5 flex flex-col items-start gap-2 border-l pl-3 sm:flex-row sm:flex-wrap"
                          >
                            <Icon
                              icon="mdi:drag-vertical"
                              class="handle absolute -left-6 size-6 cursor-move text-muted-foreground"
                            />
                            <div class="grid flex-1 grid-cols-12 gap-2">
                              <FormField v-slot="{ componentField }" :name="`tickets[${index}].name`">
                                <FormItem v-auto-animate class="col-span-12">
                                  <FormLabel>Ticket Name</FormLabel>
                                  <FormControl>
                                    <Input type="text" :placeholder="`Category ${index + 1}`" v-bind="componentField" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              </FormField>
                              <FormField
                                v-slot="{ componentField, value, handleChange, errors }"
                                :name="`tickets[${index}].rangeDate`"
                              >
                                <FormItem class="col-span-12 sm:col-span-6 md:col-span-6">
                                  <FormLabel>Selling Period</FormLabel>
                                  <FormControl>
                                    <VueDatePicker
                                      v-bind="componentField"
                                      :model-value="value"
                                      range
                                      multi-calendars
                                      :dark="colorMode.value === 'dark'"
                                      :enable-time-picker="false"
                                      model-type="yyyy-MM-dd HH:mm"
                                      format="d LLL yyyy HH:mm"
                                      :min-date="minDate"
                                      @update:model-value="handleChange"
                                    >
                                      <template #dp-input="{ value: inputValue }">
                                        <input
                                          type="text"
                                          class="form-input w-full"
                                          :class="{
                                            'is-invalid': !!errors.length,
                                          }"
                                          placeholder="Start - End Date & Time"
                                          :value="inputValue"
                                          autocomplete="off"
                                        >
                                      </template>
                                    </VueDatePicker>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              </FormField>
                              <FormField v-slot="{ value, handleChange }" :name="`tickets[${index}].price`">
                                <FormItem class="col-span-7 sm:col-span-3 md:col-span-3">
                                  <FormLabel>Price</FormLabel>
                                  <NumberField
                                    class="gap-2"
                                    :min="0"
                                    :model-value="value"
                                    :format-options="{
                                      style: 'currency',
                                      currency: 'IDR',
                                      currencyDisplay: 'code',
                                      currencySign: 'accounting',
                                      minimumFractionDigits: 0,
                                      maximumFractionDigits: 0,
                                    }"
                                    :step="1000"
                                    @update:model-value="handleChange"
                                  >
                                    <NumberFieldContent>
                                      <NumberFieldDecrement />
                                      <FormControl>
                                        <NumberFieldInput />
                                      </FormControl>
                                      <NumberFieldIncrement />
                                    </NumberFieldContent>
                                  </NumberField>
                                  <FormMessage />
                                </FormItem>
                              </FormField>
                              <FormField v-slot="{ value, handleChange }" :name="`tickets[${index}].quota`">
                                <FormItem v-auto-animate class="col-span-5 sm:col-span-3">
                                  <FormLabel>Quota</FormLabel>
                                  <NumberField
                                    class="gap-2"
                                    :min="0"
                                    :model-value="value"
                                    @update:model-value="handleChange"
                                  >
                                    <NumberFieldContent>
                                      <NumberFieldDecrement />
                                      <FormControl>
                                        <NumberFieldInput />
                                      </FormControl>
                                      <NumberFieldIncrement />
                                    </NumberFieldContent>
                                  </NumberField>
                                  <FormMessage />
                                </FormItem>
                              </FormField>
                              <div class="col-span-9 flex flex-col gap-2 py-2">
                                <label class="w-full text-sm font-semibold">Sessions scope of this ticket</label>
                                <FormField
                                  v-for="datetime in formValues.eventDatetimes"
                                  v-slot="{ value, handleChange }"
                                  :key="datetime.name"
                                  :name="`tickets[${index}].sessions`"
                                  type="checkbox"
                                  :value="datetime.name"
                                >
                                  <template v-if="datetime.name">
                                    <FormItem class="flex flex-row items-start space-x-3 space-y-0">
                                      <!-- Sessions checkboxes -->
                                      <FormControl>
                                        <Checkbox
                                          :checked="value.includes(datetime.name)"
                                          @update:checked="handleChange"
                                        />
                                      </FormControl>
                                      <FormLabel class="font-normal">
                                        {{ datetime.name }}
                                      </FormLabel>
                                    </FormItem>
                                  </template>
                                </FormField>
                              </div>
                            </div>
                            <div class="absolute bottom-0 right-0 sm:static sm:bottom-auto sm:right-auto sm:pt-8">
                              <Button
                                size="icon"
                                class="text-red-500"
                                variant="ghost"
                                @click.prevent="remove(index)"
                              >
                                <Icon icon="material-symbols-light:close-rounded" class="size-6" />
                              </Button>
                            </div>
                          </div>
                        </VueDraggable>
                        <Button
                          type="button"
                          class="mt-2 flex gap-1"
                          @click.prevent="
                            push({
                              name: '',
                              rangeDate: [newDateStart, newDateEnd],
                              price: 0,
                              quota: 0,
                              sessions: [],
                            })
                          "
                        >
                          <Icon icon="heroicons:plus-circle-16-solid" class="size-4" />
                          <span>Add Ticket</span>
                        </Button>
                      </FieldArray>
                    </div>
                    <div v-else>
                      <p class="text-sm text-gray-500">
                        Please add at least one event datetime to add tickets
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FormStep>
          <FormStep>
            <!-- Venue, Billing, and Agreement -->
            <div class="container pb-10">
              <div class="mx-auto max-w-3xl py-10">
                <div class="space-y-6">
                  <FieldInputText name="bankName" label="Bank Name" type="text" />
                  <FieldInputText name="bankAccount" label="Bank Account Number" type="text" />
                  <FormField v-slot="{ value, handleChange }" name="acceptTerms">
                    <FormItem class="flex flex-row items-start gap-x-3 space-y-0 rounded-md border p-4 shadow">
                      <FormControl>
                        <Checkbox :checked="value" @update:checked="handleChange" />
                      </FormControl>
                      <div class="space-y-1 leading-none">
                        <FormLabel>Accept Terms</FormLabel>
                        <FormDescription> I agree to the terms and conditions. </FormDescription>
                        <FormMessage />
                      </div>
                    </FormItem>
                  </FormField>
                </div>
              </div>
            </div>
          </FormStep>
          <FormStep>
            <div class="space-y-6">
              <h2 class="text-2xl font-semibold">
                Preview
              </h2>
              <pre class="text-xs">{{ formValues }}</pre>
            </div>
          </FormStep>
        </template>
      </FormWizard>
    </div>
  </section>
</template>

<style scoped>
.err-msg {
  @apply text-red-500 text-xs;
}

.is-ghost {
  @apply opacity-40 bg-muted;
}

.is-dragging {
  @apply border border-primary bg-primary-foreground rounded-md;
}
</style>
