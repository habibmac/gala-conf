<script setup lang="ts">
import { Field, ErrorMessage } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";
import VueDatePicker from "@vuepic/vue-datepicker";

import { Icon } from "@iconify/vue";

import FormWizard from "@/components/FormWizard.vue";
import FormStep from "@/components/FormStep.vue";
import { startOfDay, format, endOfDay } from "date-fns";

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

const currentStep = ref(0);

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

const step2Schema = z.object({
  eventDatetimes: z
    .array(
      z.object({
        name: z.string().min(1, "Name is required"),
        rangeDate: z.array(z.string()).length(2, "Date range is required"),
        quota: z.number().int().min(1, "Quota must be more than 0"),
      })
    )
    .min(1, "At least one event datetime is required")
    .refine(
      (datetimes) => {
        const names = datetimes.map((dt) => dt.name);
        return new Set(names).size === names.length;
      },
      {
        message: "Event datetime names must be unique",
        path: ["eventDatetimes"],
      }
    ),
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
    .min(1, "At least one ticket is required")
    .refine(
      (tickets) => {
        const names = tickets.map((ticket) => ticket.name);
        return new Set(names).size === names.length;
      },
      {
        message: "Ticket names must be unique",
        path: ["tickets"],
      }
    ),
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

// Range date picker options
const minDate = ref(startOfDay(new Date()));
const newDateStart = ref(format(startOfDay(new Date()), "yyyy-MM-dd HH:mm"));
const newDateEnd = ref(format(endOfDay(new Date()), "yyyy-MM-dd HH:mm"));

interface FormValues {
  eventDatetimes?: Array<{ name: string }>;
  // Add other properties as needed
}

const formValues = ref<FormValues>({});

const currentDatetimes = computed(() => {
  return (
    formValues.value.eventDatetimes?.map((datetime) => ({
      value: datetime.name,
      label: datetime.name,
    })) || []
  );
});

function updateFormValues(newValues: any) {
  formValues.value = newValues;
}

const colorMode = useColorMode();

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
        @submit="onSubmit"
        :validation-schema="validationSchema"
        @update:currentStep="currentStep = $event"
        @formValuesUpdate="updateFormValues"
      >
        <template v-slot:form-back-link>
          <Button as-child variant="link" class="hidden lg:flex">
            <NuxtLink to="/my-events" class="items-center flex space-x-1">
              <Icon icon="heroicons:arrow-long-left" class="size-5" />
              <span> Back to My Events </span>
            </NuxtLink>
          </Button>
        </template>
        <template v-slot:form-steps>
          <div class="flex max-w-5xl py-6 mx-auto justify-between space-x-6">
            <div
              v-for="(step, index) in validationSchema.map((_, i) => steps[i])"
              :key="index"
              class="flex items-center space-x-2"
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
                  'text-sm font-medium select-none',
                  currentStep === index
                    ? 'text-primary'
                    : 'text-muted-foreground',
                ]"
              >
                {{ step.title }}
              </h3>
            </div>
          </div>
        </template>

        <template v-slot:form-content>
          <FormStep>
            <!-- Event Details -->
            <div class="space-y-5">
              <div>
                <label for="eventTitle" class="text-sm font-semibold"
                  >Event Title</label
                >
                <Field
                  name="eventTitle"
                  type="text"
                  id="eventTitle"
                  placeholder="Event Title"
                  v-slot="{ field, meta }"
                >
                  <input
                    v-bind="field"
                    class="form-input w-full !my-1"
                    :class="{ 'is-invalid': !meta.valid }"
                  />
                </Field>
                <ErrorMessage name="eventTitle" class="err-msg" />
              </div>
              <div>
                <label for="eventDescription" class="text-sm font-semibold"
                  >Event Description</label
                >
                <Field
                  name="eventDescription"
                  as="textarea"
                  id="eventDescription"
                  rows="4"
                  placeholder="Event Description"
                  class="form-input w-full !my-1"
                />
                <ErrorMessage name="eventDescription" class="err-msg" />
              </div>
              <div class="space-y-3 mb-8">
                <label for="eventScale" class="text-sm font-semibold"
                  >Event Scale</label
                >
                <Field
                  v-slot="{ field }"
                  name="eventScale"
                  as="div"
                  class="grid grid-cols-2 gap-2"
                >
                  <div v-for="scale in eventScaleOptions" :key="scale.value">
                    <label class="relative block cursor-pointer">
                      <input
                        type="radio"
                        name="eventScale"
                        class="peer sr-only"
                        :checked="field.value === scale.value"
                        :value="scale.value"
                        @change="field.onChange"
                      />
                      <div
                        class="flex items-center bg-card text-sm font-medium px-2 py-2.5 rounded-lg border border-border shadow-sm duration-150 ease-in-out peer-checked:text-blue-600"
                      >
                        <Icon
                          v-if="field.value === scale.value"
                          icon="heroicons:check-circle-20-solid"
                          class="w-5 h-5 mr-2"
                        />
                        <span
                          :class="[
                            field.value === scale.value ? 'text-primary' : '',
                          ]"
                          >{{ scale.label }}</span
                        >
                      </div>
                      <div
                        class="absolute inset-0 border border-transparent peer-checked:border-blue-600 rounded-lg pointer-events-none"
                        aria-hidden="true"
                      ></div>
                    </label>
                  </div>
                </Field>
                <ErrorMessage name="eventScale" class="err-msg" />
              </div>
              <div class="space-y-6 mb-8">
                <label for="eventCategory" class="text-sm font-semibold"
                  >Event Category</label
                >
                <Field name="eventCategory" v-slot="{ field }">
                  <div class="grid grid-cols-2 gap-2 mt-2 sm:grid-cols-3">
                    <div v-for="category in eventCategories" :key="category.id">
                      <label class="relative block cursor-pointer">
                        <input
                          type="radio"
                          name="eventCategory"
                          class="peer sr-only"
                          :value="category.label"
                          :checked="field.value === category.label"
                          @change="field.onChange"
                        />
                        <div
                          class="flex flex-col items-center justify-center bg-card text-sm font-medium p-4 rounded-lg border shadow-sm duration-150 ease-in-out peer-checked:text-blue-600 peer-checked:border-blue-600 gap-2"
                        >
                          <Icon :icon="category.icon" class="size-7" />
                          <span
                            :class="[
                              field.value === category.label
                                ? 'text-primary'
                                : '',
                            ]"
                            >{{ category.label }}</span
                          >
                        </div>
                        <div
                          class="absolute inset-0 border border-transparent peer-checked:border-blue-60 rounded-lg pointer-events-none"
                          aria-hidden="true"
                        ></div>
                      </label>
                    </div>
                  </div>
                </Field>
                <ErrorMessage name="eventCategory" class="err-msg" />
              </div>
              <div>
                <label for="website" class="text-sm font-semibold"
                  >Website</label
                >
                <Field
                  name="website"
                  type="text"
                  id="website"
                  class="form-input w-full !my-1"
                />
                <ErrorMessage name="website" class="err-msg" />
              </div>
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
              <div class="grid grid-cols-3 gap-4">
                <div class="col-span-3">
                  <label for="venueName" class="text-sm font-semibold"
                    >Venue Name</label
                  >
                  <Field
                    name="venueName"
                    type="text"
                    id="venueName"
                    class="form-input w-full !my-1"
                  />
                  <ErrorMessage name="venueName" class="err-msg" />
                </div>
                <div class="col-span-3">
                  <label for="venueAddress" class="text-sm font-semibold"
                    >Venue Address</label
                  >
                  <Field
                    name="venueAddress"
                    type="text"
                    id="venueAddress"
                    class="form-input w-full !my-1"
                  />
                  <ErrorMessage name="venueAddress" class="err-msg" />
                </div>
                <div>
                  <label for="venueCity" class="text-sm font-semibold"
                    >Venue City</label
                  >
                  <Field
                    name="venueCity"
                    type="text"
                    id="venueCity"
                    class="form-input w-full !my-1"
                  />
                  <ErrorMessage name="venueCity" class="err-msg" />
                </div>
                <div>
                  <label for="venueState" class="text-sm font-semibold"
                    >Venue State</label
                  >
                  <Field
                    name="venueState"
                    type="text"
                    id="venueState"
                    class="form-input w-full !my-1"
                  />
                  <ErrorMessage name="venueState" class="err-msg" />
                </div>
                <div>
                  <label for="venueCountry" class="text-sm font-semibold"
                    >Venue Country</label
                  >
                  <Field
                    name="venueCountry"
                    type="text"
                    id="venueCountry"
                    class="form-input w-full !my-1"
                  />
                  <ErrorMessage name="venueCountry" class="err-msg" />
                </div>
              </div>
            </div>
          </FormStep>
          <FormStep>
            <!-- Event Datetimes and Tickets -->
            <div class="space-y-6">
              <!-- Event Datetimes -->
              <div class="">
                <label class="text-sm font-semibold">Event Datetimes</label>
                <div class="flex flex-col gap-2 mt-2">
                  <FieldArray
                    name="eventDatetimes"
                    v-slot="{ fields, push, remove }"
                  >
                    <div
                      v-for="(field, index) in fields"
                      :key="field.key"
                      class="flex items-start gap-x-2"
                    >
                      <div class="flex flex-col gap-1">
                        <label class="text-sm font-semibold">Name</label>
                        <Field
                          :name="`eventDatetimes[${index}].name`"
                          type="text"
                          placeholder="Session Name"
                          class="form-input"
                        />
                        <ErrorMessage
                          :name="`eventDatetimes[${index}].name`"
                          class="err-msg"
                        />
                      </div>
                      <div class="w-2/3 flex flex-col gap-1">
                        <label class="text-sm font-semibold">Date Range</label>
                        <Field
                          :name="`eventDatetimes[${index}].rangeDate`"
                          v-slot="{ field, value, handleChange, errors }"
                        >
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
                        </Field>
                        <ErrorMessage
                          :name="`eventDatetimes[${index}].rangeDate`"
                          class="err-msg"
                        />
                      </div>
                      <div class="flex flex-col gap-1">
                        <label class="text-sm font-semibold">Quota</label>
                        <Field
                          :name="`eventDatetimes[${index}].quota`"
                          type="number"
                          placeholder="Quota"
                          class="form-input w-20"
                        />
                        <ErrorMessage
                          :name="`eventDatetimes[${index}].quota`"
                          class="err-msg whitespace-break-spaces"
                        />
                      </div>
                      <div class="flex pt-7 items-center space-x-2">
                        <Button
                          @click="remove(index)"
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
                    <Button
                      @click="
                        push({
                          name: `Day ${fields.length + 1}`,
                          rangeDate: [newDateStart, newDateEnd],
                          quota: 100,
                        })
                      "
                      variant="outline"
                      class="mt-4 flex gap-1"
                    >
                      <Icon
                        icon="heroicons:plus-circle-16-solid"
                        class="size-5"
                      />
                      <span>Add Datetime</span>
                    </Button>
                  </FieldArray>
                </div>
              </div>
              <!-- Tickets -->
              <div>
                <label class="text-sm font-semibold">Tickets</label>

                <div v-if="!formValues.eventDatetimes?.length">
                  <p class="text-sm text-gray-500">
                    Please add at least one event datetime to add tickets
                  </p>
                </div>
                <div v-else>
                  <FieldArray name="tickets" v-slot="{ fields, push, remove }">
                    <div
                      v-for="(field, index) in fields"
                      :key="field.key"
                      class="flex items-center gap-2 flex-wrap"
                    >
                      <div>
                        <label class="text-sm font-semibold">Ticket name</label>
                        <Field
                          :name="`tickets[${index}].name`"
                          type="text"
                          placeholder="Ticket name"
                          class="form-input"
                        />
                        <ErrorMessage
                          :name="`tickets[${index}].name`"
                          class="err-msg"
                        />
                      </div>
                      <div class="flex flex-col gap-1">
                        <label class="text-sm font-semibold">Date Range</label>
                        <Field
                          :name="`tickets[${index}].rangeDate`"
                          v-slot="{ field, value, handleChange, errors }"
                        >
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
                        </Field>
                        <ErrorMessage
                          :name="`eventDatetimes[${index}].rangeDate`"
                          class="err-msg"
                        />
                      </div>
                      <div>
                        <Field
                          :name="`tickets[${index}].price`"
                          type="number"
                          step="1"
                          placeholder="Price"
                          class="form-input"
                        />
                      </div>
                      <div>
                        <Field
                          :name="`tickets[${index}].quota`"
                          type="number"
                          placeholder="Quota"
                          class="form-input"
                        />
                      </div>
                      <div>
                        <label class="text-sm font-semibold">Sessions</label>
                        <div
                          v-for="datetime in formValues.eventDatetimes"
                          :key="datetime.name"
                        >
                          <label class="flex items-center">
                            <Field
                              :name="`tickets[${index}].sessions`"
                              type="checkbox"
                              :value="datetime.name"
                              class="form-checkbox"
                            />
                            <span class="text-sm ml-2">
                              {{ datetime.name }}</span
                            >
                          </label>
                        </div>
                        <ErrorMessage
                          :name="`tickets[${index}].sessions`"
                          class="err-msg"
                        />
                      </div>
                      <div class="flex pt-7 items-center space-x-2">
                        <Button
                          @click="remove(index)"
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
                    <button
                      type="button"
                      @click="
                        push({
                          name: '',
                          rangeDate: [newDateStart, newDateEnd],
                          price: '',
                          quota: '',
                          sessions: [],
                        })
                      "
                      class="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Add Ticket
                    </button>
                  </FieldArray>
                </div>
              </div>
            </div>
          </FormStep>
          <FormStep>
            <!-- Venue, Billing, and Agreement -->
            <div class="space-y-6">
              <div>
                <label for="bankName" class="text-sm font-semibold"
                  >Bank Name</label
                >
                <Field
                  name="bankName"
                  type="text"
                  id="bankName"
                  class="form-input w-full !my-1"
                />
                <ErrorMessage name="bankName" class="err-msg" />
              </div>
              <div>
                <label for="bankAccount" class="text-sm font-semibold"
                  >Bank Account</label
                >
                <Field
                  name="bankAccount"
                  type="text"
                  id="bankAccount"
                  class="form-input w-full !my-1"
                />
                <ErrorMessage name="bankAccount" class="err-msg" />
              </div>
            </div>
            <div class="flex items-center">
              <Field
                v-slot="{ field }"
                name="acceptTerms"
                type="checkbox"
                :value="true"
                :unchecked-value="false"
              >
                <label>
                  <input type="checkbox" v-bind="field" :value="true" />
                  I agree
                </label>
              </Field>
            </div>
          </FormStep>
          <FormStep>
            <div class="space-y-6">
              <h2 class="text-2xl font-semibold">Preview</h2>
              <pre>{{ formValues }}</pre>
            </div>
          </FormStep>
        </template>
      </FormWizard>
    </div>
  </section>
</template>

<style>
.err-msg {
  @apply text-red-500 text-xs;
}
</style>
