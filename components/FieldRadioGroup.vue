<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { Field } from 'vee-validate';

import { cn } from '@/lib/utils';

interface RadioOption {
  value?: string
  label: string
  id?: string
  icon?: string
}

const props = defineProps<{
  name: string
  label: string
  options: RadioOption[]
  layout: 'horizontal' | 'vertical'
  wrapperClass?: string
}>();

const error = useFieldError(props.name);
const icon = Icon;
</script>

<template>
  <FormField :name="name">
    <FormItem class="mb-8 space-y-3">
      <FormLabel :class="cn({ 'mb-2': layout === 'vertical' }, error ? 'text-destructive' : 'text-body')">
        {{
          label
        }}
      </FormLabel>
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
            >
            <div
              class="rounded-lg border bg-background text-sm font-medium shadow-sm outline-none duration-100 ease-in-out" :class="[
                layout === 'horizontal'
                  ? 'flex items-center px-2 py-2.5'
                  : 'flex flex-col items-center justify-center p-4',
                field.value === (option.value || option.label) ? 'text-primary peer-checked:border-primary' : '',
              ]"
            >
              <template v-if="layout === 'horizontal'">
                <component
                  :is="icon"
                  v-if="field.value === (option.value || option.label)"
                  icon="heroicons:check-circle-20-solid"
                  class="mr-2 size-5"
                />
              </template>
              <template v-else>
                <component :is="icon" v-if="option.icon" :icon="option.icon" class="mb-2 size-7" />
              </template>
              <span :class="[field.value === (option.value || option.label) ? 'text-primary' : '']">
                {{ option.label }}
              </span>
            </div>
            <div
              class="pointer-events-none absolute inset-0 rounded-lg border border-transparent peer-checked:border-primary"
              aria-hidden="true"
            />
          </label>
        </div>
      </Field>
      <FormMessage />
    </FormItem>
  </FormField>
</template>
