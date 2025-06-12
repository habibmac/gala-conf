<script setup lang="ts">
import type { SortableEvent } from 'vue-draggable-plus';

import { Icon } from '@iconify/vue';
import VueDatePicker from '@vuepic/vue-datepicker';
import { useColorMode } from '@vueuse/core';
import { ref } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';

import { Button } from '@/components/ui/button';
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from '@/components/ui/number-field';

import FieldInput from './FieldInput.vue';

interface EventDatetime {
  name: string
  rangeDate: string[]
  quota: number
}

const props = defineProps<{
  modelValue: EventDatetime[]
  minDate: Date
  newDateStart: string
  newDateEnd: string
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: EventDatetime[]): void
}>();

const colorMode = useColorMode();

const eventDatetimesRef = ref(props.modelValue);

const onSort = (e: SortableEvent) => {
  const { newIndex, oldIndex } = e;

  if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) {
    return;
  }

  if (!eventDatetimesRef.value) {
    return;
  }

  // Clone the array, sort it, and update the form values
  const field = [...eventDatetimesRef.value];
  const [removed] = field.splice(oldIndex, 1);
  field.splice(newIndex, 0, removed);

  // This should update the eventDatetimesRef and emit the change
  emit('update:modelValue', field);
};

watch(
  eventDatetimesRef,
  (newValue) => {
    emit('update:modelValue', newValue);
  },
  { deep: true },
);
</script>

<template>
  <div>
    <label class="text-sm font-semibold">Sessions & Datetimes</label>
    <div class="mt-2 flex flex-col gap-2 md:gap-4">
      <FieldArray v-slot="{ push, remove }" name="eventDatetimes">
        <VueDraggable
          v-model="eventDatetimesRef"
          :animation="150"
          handle=".handle"
          ghost-class="is-ghost"
          drag-class="is-dragging"
          @end="onSort($event)"
        >
          <div
            v-for="(inputField, index) in eventDatetimesRef"
            :key="index"
            class="relative ml-5 flex flex-col items-start gap-2 border-l py-2 pl-3 sm:flex-row sm:flex-wrap"
          >
            <Icon icon="mdi:drag-vertical" class="handle absolute -left-6 size-6 cursor-move text-muted-foreground" />
            <FieldInput
              :name="`eventDatetimes[${index}].name`"
              label="Session Name"
              type="text"
              :placeholder="`Day ${index + 1}`"
              wrapper-class="w-full sm:w-1/3 md:w-1/3"
            />
            <FormField v-slot="{ field, value, handleChange, errors }" :name="`eventDatetimes[${index}].rangeDate`">
              <FormItem v-auto-animate class="w-full flex-1">
                <FormLabel>Start - End</FormLabel>
                <FormControl>
                  <VueDatePicker
                    v-bind="field"
                    :model-value="value"
                    range
                    multi-calendars
                    :dark="colorMode === 'dark'"
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
                        :class="{ 'is-invalid': !!errors.length }"
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
          type="button"
          variant="ghost"
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
</template>

<style scoped>
.is-ghost {
  @apply opacity-40 bg-muted;
}

.is-dragging {
  @apply border border-primary bg-primary-foreground rounded-md;
}
</style>
