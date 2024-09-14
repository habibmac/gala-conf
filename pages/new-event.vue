<script setup lang="ts">
import { Field, ErrorMessage } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";
import VueDatePicker from "@vuepic/vue-datepicker";
import { VueDraggable, type SortableEvent } from "vue-draggable-plus";
import { Icon } from "@iconify/vue";
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/ui/number-field";

import FormWizard from "@/components/FormWizard.vue";
import FormStep from "@/components/FormStep.vue";
import { startOfDay, format, endOfDay } from "date-fns";
import { useCitySearch } from "@/composables/useCitySearch";

import FieldInput from "@/components/FieldInput.vue";
import ComboCityFilter from "@/components/ComboCityFilter.vue";

interface FormValues {
  eventDatetimes?: Array<{ name: string }>;
  tickets?: Array<{ name: string }>;
}
const formValues = ref<FormValues>({});

interface FormWizardExpose {
  updateFormField: (field: any, value: any) => void;
  errorMessages: (field: string) => string;
}

definePageMeta({
  title: "New Event",
  navTitle: "Create New Event",
  description: "Create a new event",
  layout: "dashboard",
});

const steps = [
  {
    title: "Event Details",
    description: "Add your event details",
  },
  {
    title: "Datetimes & Tickets",
    description: "Add your event datetimes and tickets",
  },
  {
    title: "Billing Info",
    description: "Enter your payment information",
  },
];

const formWizardRef = ref<FormWizardExpose | null>(null);
const eventDatetimesRef = ref<Array<any>>([]);
const eventTicketsRef = ref<Array<any>>([]);
const currentStep = ref(0);
const { venueCity } = useCitySearch();

const eventScaleOptions = ref([
  { label: "International", value: "International" },
  { label: "National", value: "National" },
  { label: "Regional", value: "Regional" },
  { label: "Local", value: "Local" },
  { label: "Internal", value: "Internal" },
]);

const eventCategories = ref([
  {
    id: "seminar",
    label: "Seminar & Konferensi",
    icon: "mdi:presentation",
  },
  {
    id: "olahraga",
    label: "Olahraga & Kebugaran",
    icon: "mdi:run",
  },
  {
    id: "pertunjukan",
    label: "Pertunjukan & Hiburan",
    icon: "mdi:theater",
  },
  {
    id: "parties",
    label: "Pesta & Perayaan",
    icon: "mdi:party-popper",
  },
  {
    id: "pameran",
    label: "Pameran & Expo",
    icon: "mdi:view-gallery",
  },
  {
    id: "other",
    label: "Lainnya",
    icon: "mdi:dots-horizontal-circle",
  },
]);

// Define the schema for each step
const step1Schema = z.object({
  eventTitle: z.string().min(1, "Event title is required"),
  eventDescription: z
    .string()
    .min(10, "Event description must be at least 10 characters long"),
  eventScale: z
    .string()
    .min(1, "Event scale is required")
    .refine(
      (value) => {
        return eventScaleOptions.value.some((scale) => scale.label === value);
      },
      {
        message: "Please choose a valid event scale",
      }
    ),
  eventCategory: z
    .string()
    .min(1, "Event category is required")
    .refine(
      (value) => {
        return eventCategories.value.some((cat) => cat.label === value);
      },
      {
        message: "Please choose a valid event category",
      }
    ),
  website: z.string().url("Invalid URL"),
  logo: z.any(),
  backgroundImage: z.any(),
  venueName: z.string().min(1, "Venue name is required"),
  venueAddress: z.string().min(1, "Venue address is required"),
  venueCity: z.string().min(1, "Venue city is required"),
  venueState: z.string().min(1, "Venue state is required"),
  venueCountry: z.string().min(1, "Venue country is required"),
});

const step2Schema = z
  .object({
    eventDatetimes: z
      .array(
        z.object({
          name: z.string().min(1, "Name is required"),
          rangeDate: z.array(z.string()).length(2, "Date range is required"),
          quota: z.number().int().min(1, "Quota must be more than 0"),
        })
      )
      .min(1, "At least one event datetime is required"),
    tickets: z
      .array(
        z.object({
          name: z.string().min(1, "Name is required"),
          rangeDate: z.array(z.string()).length(2, "Date range is required"),
          price: z.number().min(0, "Price must be a positive number"),
          quota: z.number().int().min(1, "Quota must be more than 0"),
          sessions: z
            .array(z.string())
            .min(1, "At least one session is required"),
        })
      )
      .min(1, "At least one ticket is required"),
  })
  .superRefine((data, ctx) => {
    // Check for unique session names
    const sessionNames = data.eventDatetimes.map((dt) => dt.name);
    const uniqueSessionNames = new Set(sessionNames);
    if (sessionNames.length !== uniqueSessionNames.size) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Session names must be unique",
        path: ["eventDatetimes", "duplicate"],
      });
    }

    // Check for unique ticket names
    const ticketNames = data.tickets.map((ticket) => ticket.name);
    const uniqueTicketNames = new Set(ticketNames);
    if (ticketNames.length !== uniqueTicketNames.size) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ticket names must be unique",
        path: ["tickets", "duplicate"],
      });
    }

    // Validate sessions in tickets
    const validSessionNames = new Set(sessionNames);
    const validatedTickets = data.tickets.filter((ticket) => {
      const validSessions = ticket.sessions.filter((session) =>
        validSessionNames.has(session)
      );
      return validSessions.length > 0;
    });

    if (validatedTickets.length !== data.tickets.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Some tickets have been removed due to invalid sessions",
        path: ["tickets"],
      });
    }

    return { ...data, tickets: validatedTickets };
  });

const step3Schema = z.object({
  bankName: z.string().min(1, "Bank name is required"),
  bankAccount: z.string().min(1, "Bank account is required"),
  acceptTerms: z.boolean().refine((value) => value, {
    message: "You must agree to the NDA",
  }),
});

// Create an array of typed schemas for each step
const validationSchema = [
  toTypedSchema(step1Schema),
  toTypedSchema(step2Schema),
  toTypedSchema(step3Schema),
];

const selectCity = (option: {
  city: string;
  state: string;
  country: string;
}) => {
  formWizardRef.value?.updateFormField("venueCity", option.city);
  formWizardRef.value?.updateFormField("venueState", option.state);
  formWizardRef.value?.updateFormField("venueCountry", option.country);
  venueCity.value = option.city;
};

const onSort = (e: SortableEvent, fieldName: "eventDatetimes" | "tickets") => {
  const { oldIndex, newIndex } = e;

  if (
    oldIndex === undefined ||
    newIndex === undefined ||
    oldIndex === newIndex
  ) {
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
  return formValues.value?.eventDatetimes?.some((dt) => dt.name.trim() !== "");
});

// Range date picker options
const minDate = ref(startOfDay(new Date()));
const newDateStart = ref(format(startOfDay(new Date()), "yyyy-MM-dd HH:mm"));
const newDateEnd = ref(format(endOfDay(new Date()), "yyyy-MM-dd HH:mm"));

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
    !!formWizardRef.value?.errorMessages("eventDatetimes.duplicate") ||
    !!formWizardRef.value?.errorMessages("tickets.duplicate")
  );
});

function onSubmit(formData: FormData) {
  console.log(JSON.stringify(formData, null, 2));
}
</script>

<template>
  <section class="relative flex h-full">
    <div
      class="grow flex flex-col md:translate-x-0 transition-transform duration-300 ease-in-out translate-x-0"
    >
      <FormWizard
        ref="formWizardRef"
        @submit="onSubmit"
        :validation-schema="validationSchema"
        @update:currentStep="currentStep = $event"
        @formValuesUpdate="updateFormValues"
      >
        <template v-slot:form-back-link>
          <Button
            as-child
            variant="link"
            class="hidden sm:flex shrink-0 text-muted-foreground"
          >
            <NuxtLink to="/my-events" class="items-center flex gap-1">
              <Icon icon="heroicons:arrow-long-left" class="size-5" />
              <span class="hidden lg:inline-block"> Back to My Events </span>
            </NuxtLink>
          </Button>
        </template>
        <template v-slot:form-steps>
          <div class="flex-1 relative w-full overflow-auto">
            <div
              class="flex py-3 sm:py-6 px-4 sm:px-0 space-x-4 sm:space-x-6 sm:max-w-5xl sm:justify-center sm:items-center"
            >
              <div
                v-for="(step, index) in validationSchema.map(
                  (_, i) => steps[i]
                )"
                :key="index"
                :class="[
                  currentStep === index ? '' : 'hidden md:flex',
                  'flex items-center space-x-2 shrink-0',
                ]"
              >
                <div
                  :class="[
                    currentStep === index ? 'bg-primary' : 'bg-accent',
                    'flex items-center justify-center size-6 rounded-full',
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
                  :class="[
                    'text-sm font-medium whitespace-nowrap',
                    currentStep === index
                      ? 'text-primary'
                      : 'text-muted-foreground',
                  ]"
                >
                  {{ step.title }}
                </h3>
              </div>
            </div>
          </div>
        </template>

        <template v-slot:form-content>
          <FormStep>
            <!-- Event Details -->
            <div class="space-y-5">
              <FieldInput
                name="eventTitle"
                label="Event Title"
                type="text"
                placeholder="Your event title..."
              />
              <FieldInput
                name="eventDescription"
                label="Event Description"
                type="textarea"
                placeholder="Tell us a bit about your event..."
              />
              <FieldRadioGroup
                name="eventScale"
                label="Event Scale"
                :options="eventScaleOptions"
                layout="horizontal"
                wrapperClass="grid grid-cols-2 gap-2"
              />
              <FieldRadioGroup
                name="eventCategory"
                label="Event Category"
                :options="eventCategories"
                layout="vertical"
                wrapperClass="grid grid-cols-2 gap-2 mt-2 sm:grid-cols-3"
              />
              <FormField v-slot="{ componentField }" name="website">
                <FormItem v-auto-animate>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="https://example.com"
                      v-bind="componentField"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>

              <div>
                <label for="logo" class="text-sm font-semibold">Logo</label>
                <Field
                  name="logo"
                  type="file"
                  id="logo"
                  class="form-input w-full !my-1"
                />
                <ErrorMessage name="logo" class="err-msg" />
              </div>
              <div>
                <label for="backgroundImage" class="text-sm font-semibold"
                  >Background Image</label
                >
                <Field
                  name="backgroundImage"
                  type="file"
                  id="backgroundImage"
                  class="form-input w-full !my-1"
                />
                <ErrorMessage name="backgroundImage" class="err-msg" />
              </div>
              <div class="grid sm:grid-cols-3 gap-4">
                <FieldInput
                  name="venueName"
                  label="Venue Name"
                  type="text"
                  placeholder="Venue Name"
                  wrapperClass="sm:col-span-3"
                />
                <FieldInput
                  name="venueAddress"
                  label="Venue Address"
                  type="text"
                  placeholder="Address..."
                  wrapperClass="sm:col-span-3"
                />
                <FormField v-slot="{ componentField }" name="venueCity">
                  <FormItem v-auto-animate>
                    <FormLabel>Venue City</FormLabel>
                    <FormControl>
                      <ComboCityFilter
                        v-model="venueCity"
                        v-bind="componentField"
                        @select="selectCity"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
                <FieldInput
                  name="venueState"
                  label="Venue State"
                  type="text"
                  placeholder="State..."
                />
                <FieldInput
                  name="venueCountry"
                  label="Venue Country"
                  type="text"
                  placeholder="Country..."
                />
              </div>
            </div>
          </FormStep>
          <FormStep>
            <!-- Event Datetimes and Tickets -->
            <div class="space-y-6">
              <div
                v-if="hasDuplicateErrors"
                class="bg-destructive-foreground text-sm text-destructive p-4 rounded-lg mb-4"
              >
                <div class="flex gap-1 items-center text-xs">
                  <Icon
                    icon="heroicons-solid:exclamation-circle"
                    class="size-6"
                  />
                  <div>Please fix the errors below</div>
                </div>
                <ul class="list-disc list-inside ml-2.5">
                  <li
                    v-if="
                      formWizardRef?.errorMessages('eventDatetimes.duplicate')
                    "
                  >
                    {{
                      formWizardRef?.errorMessages("eventDatetimes.duplicate")
                    }}
                  </li>
                  <li v-if="formWizardRef?.errorMessages('tickets.duplicate')">
                    {{ formWizardRef?.errorMessages("tickets.duplicate") }}
                  </li>
                </ul>
              </div>
              <div class="">
                <label class="text-sm font-semibold"
                  >Sessions & Datetimes</label
                >
                <div class="flex flex-col gap-2 md:gap-4 mt-2">
                  <FieldArray
                    name="eventDatetimes"
                    v-slot="{ fields, push, remove }"
                  >
                    <VueDraggable
                      v-model="eventDatetimesRef"
                      :animation="150"
                      handle=".handle"
                      ghostClass="is-ghost"
                      dragClass="is-dragging"
                      @end="onSort($event, 'eventDatetimes')"
                    >
                      <div
                        v-for="(field, index) in eventDatetimesRef"
                        class="relative flex items-start gap-2 flex-col sm:flex-row sm:flex-wrap border-l pl-3 ml-5 py-2"
                      >
                        <Icon
                          icon="mdi:drag-vertical"
                          class="handle size-6 absolute -left-6 cursor-move text-muted-foreground"
                        />
                        <FormField
                          v-slot="{ componentField }"
                          :name="`eventDatetimes[${index}].name`"
                        >
                          <FormItem
                            v-auto-animate
                            class="w-full sm:w-1/3 md:w-1/3"
                          >
                            <FormLabel>Session Name</FormLabel>
                            <FormControl>
                              <Input
                                type="text"
                                :placeholder="`Day ${index + 1}`"
                                v-bind="componentField"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        </FormField>
                        <FormField
                          v-slot="{ field, value, handleChange, errors }"
                          :name="`eventDatetimes[${index}].rangeDate`"
                        >
                          <FormItem v-auto-animate class="flex-1 w-full">
                            <FormLabel>Start - End</FormLabel>
                            <FormControl>
                              <VueDatePicker
                                v-bind="field"
                                :modelValue="value"
                                range
                                multi-calendars
                                :dark="colorMode.value === 'dark'"
                                :enable-time-picker="false"
                                model-type="yyyy-MM-dd HH:mm"
                                format="d LLL yyyy HH:mm"
                                :min-date="minDate"
                                @update:modelValue="handleChange"
                              >
                                <template #dp-input="{ value }">
                                  <input
                                    type="text"
                                    class="form-input w-full"
                                    :class="{ 'is-invalid': !!errors.length }"
                                    placeholder="Start - End Date & Time"
                                    :value="value"
                                    autocomplete="off"
                                  />
                                </template>
                              </VueDatePicker>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        </FormField>
                        <FormField
                          v-slot="{ value, handleChange }"
                          :name="`eventDatetimes[${index}].quota`"
                        >
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
                        <div
                          class="absolute sm:static bottom-0 right-0 sm:bottom-auto sm:right-auto sm:pt-8"
                        >
                          <Button
                            @click.prevent="remove(index)"
                            size="icon"
                            class="text-red-500"
                            variant="ghost"
                          >
                            <Icon
                              icon="material-symbols-light:close-rounded"
                              class="size-6"
                            />
                          </Button>
                        </div>
                      </div>
                    </VueDraggable>
                    <Button
                      @click.prevent="
                        push({
                          name: '',
                          rangeDate: [newDateStart, newDateEnd],
                          quota: 0,
                        })
                      "
                      variant="ghost"
                      class="mt-2 flex gap-1"
                    >
                      <Icon
                        icon="heroicons:plus-circle-16-solid"
                        class="size-4"
                      />
                      <span>Add Datetime</span>
                    </Button>
                  </FieldArray>
                </div>
              </div>
              <!-- Tickets -->
              <div>
                <label class="text-sm font-semibold">Tickets</label>
                <div v-if="isAnySessionExists" class="flex flex-col gap-2 mt-2">
                  <FieldArray name="tickets" v-slot="{ fields, push, remove }">
                    <VueDraggable
                      v-model="eventTicketsRef"
                      :animation="150"
                      handle=".handle"
                      ghostClass="is-ghost"
                      dragClass="is-dragging"
                      @end="onSort($event, 'tickets')"
                    >
                      <div
                        v-for="(field, index) in fields"
                        :key="field.key"
                        class="relative flex items-start gap-2 flex-col sm:flex-row sm:flex-wrap border-l pl-3 ml-5"
                      >
                        <Icon
                          icon="mdi:drag-vertical"
                          class="handle size-6 absolute -left-6 cursor-move text-muted-foreground"
                        />
                        <div class="flex-1 grid grid-cols-12 gap-2">
                          <FormField
                            v-slot="{ componentField }"
                            :name="`tickets[${index}].name`"
                          >
                            <FormItem v-auto-animate class="col-span-12">
                              <FormLabel>Ticket Name</FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  :placeholder="`Category ${index + 1}`"
                                  v-bind="componentField"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          </FormField>
                          <FormField
                            v-slot="{ field, value, handleChange, errors }"
                            :name="`tickets[${index}].rangeDate`"
                          >
                            <FormItem
                              class="col-span-12 sm:col-span-6 md:col-span-6"
                            >
                              <FormLabel>Selling Period</FormLabel>
                              <FormControl>
                                <VueDatePicker
                                  v-bind="field"
                                  :modelValue="value"
                                  range
                                  multi-calendars
                                  :dark="colorMode.value === 'dark'"
                                  :enable-time-picker="false"
                                  model-type="yyyy-MM-dd HH:mm"
                                  format="d LLL yyyy HH:mm"
                                  :min-date="minDate"
                                  @update:modelValue="handleChange"
                                >
                                  <template #dp-input="{ value }">
                                    <input
                                      type="text"
                                      class="form-input w-full"
                                      :class="{
                                        'is-invalid': !!errors.length,
                                      }"
                                      placeholder="Start - End Date & Time"
                                      :value="value"
                                      autocomplete="off"
                                    />
                                  </template>
                                </VueDatePicker>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          </FormField>
                          <FormField
                            v-slot="{ value, handleChange }"
                            :name="`tickets[${index}].price`"
                          >
                            <FormItem
                              class="col-span-7 sm:col-span-3 md:col-span-3"
                            >
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
                          <FormField
                            v-slot="{ value, handleChange }"
                            :name="`tickets[${index}].quota`"
                          >
                            <FormItem
                              v-auto-animate
                              class="col-span-5 sm:col-span-3"
                            >
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
                          <div class="col-span-9 py-2 flex flex-col gap-2">
                            <label class="text-sm font-semibold w-full"
                              >Sessions scope of this ticket</label
                            >
                            <FormField
                              v-slot="{ value, handleChange }"
                              :name="`tickets[${index}].sessions`"
                              v-for="datetime in formValues.eventDatetimes"
                              :key="datetime.name"
                              type="checkbox"
                              :value="datetime.name"
                            >
                              <template v-if="datetime.name">
                                <FormItem
                                  class="flex flex-row items-start space-x-3 space-y-0"
                                >
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
                        <div
                          class="absolute sm:static bottom-0 right-0 sm:bottom-auto sm:right-auto sm:pt-8"
                        >
                          <Button
                            @click.prevent="remove(index)"
                            size="icon"
                            class="text-red-500"
                            variant="ghost"
                          >
                            <Icon
                              icon="material-symbols-light:close-rounded"
                              class="size-6"
                            />
                          </Button>
                        </div>
                      </div>
                    </VueDraggable>
                    <Button
                      type="button"
                      @click.prevent="
                        push({
                          name: '',
                          rangeDate: [newDateStart, newDateEnd],
                          price: 0,
                          quota: 0,
                          sessions: [],
                        })
                      "
                      variant="ghost"
                      class="mt-2 flex gap-1"
                    >
                      <Icon
                        icon="heroicons:plus-circle-16-solid"
                        class="size-4"
                      />
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
          </FormStep>
          <FormStep>
            <!-- Venue, Billing, and Agreement -->
            <div class="space-y-6">
              <FieldInput
                name="bankName"
                label="Bank Name"
                type="text"
                placeholder="Your bank name..."
              />
              <FieldInput
                name="bankAccount"
                label="Bank Account Number"
                type="text"
                placeholder="Your bank account number..."
              />

              <FormField v-slot="{ value, handleChange }" name="acceptTerms">
                <FormItem
                  class="flex flex-row items-start gap-x-3 space-y-0 rounded-md border p-4 shadow"
                >
                  <FormControl>
                    <Checkbox :checked="value" @update:checked="handleChange" />
                  </FormControl>
                  <div class="space-y-1 leading-none">
                    <FormLabel>Accept Terms</FormLabel>
                    <FormDescription>
                      I agree to the terms and conditions.
                    </FormDescription>
                    <FormMessage />
                  </div>
                </FormItem>
              </FormField>
            </div>
          </FormStep>
          <FormStep>
            <div class="space-y-6">
              <h2 class="text-2xl font-semibold">Preview</h2>
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
