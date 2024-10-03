<script setup lang="ts">
import { Field, ErrorMessage } from "vee-validate";
import { Icon } from "@iconify/vue";
import { cn } from "@/lib/utils";

interface RadioOption {
  value?: string;
  label: string;
  id?: string;
  icon?: string;
}

const props = defineProps<{
  name: string;
  label: string;
  options: RadioOption[];
  layout: "horizontal" | "vertical";
  wrapperClass?: string;
}>();

const error = useFieldError(props.name);
const icon = Icon;
</script>
<template>
  <FormField :name="name">
    <FormItem class="space-y-3 mb-8">
      <FormLabel
        :class="
          cn(
            { 'mb-2': layout === 'vertical' },
            error ? 'text-destructive' : 'text-primary'
          )
        "
        >{{ label }}</FormLabel
      >
      <Field v-slot="{ field }" :name="name" as="div" :class="wrapperClass">
        <div v-for="option in options" :key="option.value || option.id">
          <label class="relative block cursor-pointer">
            <input
              type="radio"
              :name="name"
              class="peer sr-only"
              :checked="field.value === (option.value || option.label)"
              :value="option.value || option.label"
              @change="field.onChange"
            />
            <div
              :class="[
                layout === 'horizontal'
                  ? 'flex items-center px-2 py-2.5'
                  : 'flex flex-col items-center justify-center p-4',
                'bg-card text-sm font-medium rounded-lg border-2 shadow-sm duration-100 ease-in-out outline-none',
                field.value === (option.value || option.label)
                  ? 'text-secondary peer-checked:border-secondary'
                  : '',
              ]"
            >
              <template v-if="layout === 'horizontal'">
                <component
                  :is="icon"
                  v-if="field.value === (option.value || option.label)"
                  icon="heroicons:check-circle-20-solid"
                  class="w-5 h-5 mr-2"
                />
              </template>
              <template v-else>
                <component
                  :is="icon"
                  v-if="option.icon"
                  :icon="option.icon"
                  class="size-7 mb-2"
                />
              </template>
              <span
                :class="[
                  field.value === (option.value || option.label)
                    ? 'text-secondary'
                    : '',
                ]"
              >
                {{ option.label }}
              </span>
            </div>
            <div
              class="absolute inset-0 border border-transparent peer-checked:border-secondary rounded-lg pointer-events-none"
              aria-hidden="true"
            ></div>
          </label>
        </div>
      </Field>
      <FormMessage />
    </FormItem>
  </FormField>
</template>
