<script setup lang="ts">
import { computed } from 'vue';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const props = defineProps<{
  name: string
  label: string
  type?: string
  placeholder?: string
  wrapperClass?: string
}>();

const inputComponent = computed(() => {
  switch (props.type) {
    case 'textarea':
      return Textarea;
    default:
      return Input;
  }
});
</script>

<template>
  <FormField v-slot="{ componentField }" :name="name">
    <FormItem v-auto-animate :class="wrapperClass">
      <FormLabel>{{ label }}</FormLabel>
      <FormControl>
        <component :is="inputComponent" :type="type" :placeholder="placeholder" v-bind="componentField" />
      </FormControl>
      <FormMessage />
    </FormItem>
  </FormField>
</template>
