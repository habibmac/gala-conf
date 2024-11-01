<script setup lang="ts">
import { ref, watch } from 'vue';
import { Icon } from '@iconify/vue';
import VueDatePicker from '@vuepic/vue-datepicker';
import { VueDraggable, type SortableEvent } from 'vue-draggable-plus';
import { Button } from '@/components/ui/button';
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from '@/components/ui/number-field';
import { Checkbox } from '@/components/ui/checkbox';
import FieldInput from './FieldInput.vue';

import { useColorMode } from '@vueuse/core';

const colorMode = useColorMode();

const props = defineProps<{
  modelValue: any[];
  minDate: Date;
  newDateStart: string;
  newDateEnd: string;
  eventDatetimes: any[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: any[]): void;
}>();

const ticketsRef = ref(props.modelValue);

const onSort = (e: SortableEvent) => {
  const { oldIndex, newIndex } = e;

  if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) {
    return;
  }

  if (!ticketsRef.value) {
    return;
  }

  // Clone the array, sort it, and update the form values
  const field = [...ticketsRef.value];
  const [removed] = field.splice(oldIndex, 1);
  field.splice(newIndex, 0, removed);

  // This should update the ticketsRef and emit the change
  emit('update:modelValue', field);
};

watch(
  ticketsRef,
  (newValue) => {
    emit('update:modelValue', newValue);
  },
  { deep: true }
);
</script>
<template>
  <div>
    <label class="text-sm font-semibold">Tickets</label>
    <div class="flex flex-col gap-2 mt-2">
      <FieldArray name="tickets" v-slot="{ fields, push, remove }">
        <VueDraggable
          v-model="ticketsRef"
          :animation="150"
          handle=".handle"
          ghostClass="is-ghost"
          dragClass="is-dragging"
          @end="onSort($event)"
        >
          <div
            v-for="(field, index) in fields"
            class="relative flex items-start gap-2 flex-col sm:flex-row sm:flex-wrap border-l pl-3 ml-5"
          >
            <Icon icon="mdi:drag-vertical" class="handle size-6 absolute -left-6 cursor-move text-muted-foreground" />
            <div class="flex-1 grid grid-cols-12 gap-2">
              <FieldInput
                :name="`tickets[${index}].name`"
                label="Ticket Name"
                type="text"
                :placeholder="`Category ${index + 1}`"
                wrapperClass="col-span-12"
              />
              <FormField v-slot="{ field, value, handleChange, errors }" :name="`tickets[${index}].rangeDate`">
                <FormItem class="col-span-12 sm:col-span-6 md:col-span-6">
                  <FormLabel>Selling Period</FormLabel>
                  <FormControl>
                    <VueDatePicker
                      v-bind="field"
                      :modelValue="value"
                      range
                      multi-calendars
                      :dark="colorMode === 'dark'"
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
                  <NumberField class="gap-2" :min="0" :model-value="value" @update:model-value="handleChange">
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
                <label class="text-sm font-semibold w-full"> Sessions scope of this ticket </label>
                <FormField
                  v-for="datetime in eventDatetimes"
                  :key="datetime.name"
                  v-slot="{ value, handleChange }"
                  :name="`tickets[${index}].sessions`"
                  type="checkbox"
                  :value="datetime.name"
                >
                  <template v-if="datetime.name">
                    <FormItem class="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox :checked="value.includes(datetime.name)" @update:checked="handleChange" />
                      </FormControl>
                      <FormLabel class="font-normal">
                        {{ datetime.name }}
                      </FormLabel>
                    </FormItem>
                  </template>
                </FormField>
              </div>
            </div>
            <div class="absolute sm:static bottom-0 right-0 sm:bottom-auto sm:right-auto sm:pt-8">
              <Button @click.prevent="remove(index)" size="icon" class="text-red-500" variant="ghost">
                <Icon icon="material-symbols-light:close-rounded" class="size-6" />
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
          <Icon icon="heroicons:plus-circle-16-solid" class="size-4" />
          <span>Add Ticket</span>
        </Button>
      </FieldArray>
    </div>
  </div>
</template>
<style scoped>
.is-ghost {
  @apply opacity-40 bg-muted;
}

.is-dragging {
  @apply border border-primary bg-primary-foreground rounded-md;
}
</style>
