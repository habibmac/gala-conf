<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { HTMLAttributes } from "vue";
import { useField, useFieldError } from "vee-validate";
import { cn } from "@/lib/utils";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const props = defineProps<{
  name: string;
  defaultValue?: string;
  modelValue?: string;
  class?: HTMLAttributes["class"];
  label?: string;
  placeholder?: string;
  wrapperClass?: string;
}>();

const emits = defineEmits<{
  (e: "update:modelValue", payload: string): void;
}>();

const { value, validate, resetField, handleChange } = useField(
  props.name,
  undefined,
  {
    initialValue: props.defaultValue,
  }
);

const error = useFieldError(props.name);

const inputRef = ref<HTMLInputElement | null>(null);
const isInteracting = ref(false);
const placeholder = computed(() => props.placeholder || props.label);
const showLabel = computed(
  () => (isInteracting.value && !!value.value) || value.value
);
const showPlaceholder = computed(
  () => error || (isInteracting.value && !value.value)
);

const focusInput = () => {
  inputRef.value?.focus();
};

const handleInput = () => {
  isInteracting.value = true;
  handleChange;
};

const handleFocus = () => {
  isInteracting.value = true;
};

const handleBlur = async () => {
  isInteracting.value = false;
  await validate();
};

watch(value, (newValue) => {
  if (newValue === "") {
    resetField();
  }
});
</script>

<template>
  <FormField :name="name">
    <FormItem :class="wrapperClass">
      <div
        class="group relative transition-all duration-200"
        @click="focusInput"
      >
        <FormLabel
          :for="props.name"
          :class="
            cn(
              'pointer-events-none absolute z-10 px-3 font-medium text-xs text-muted-foreground transition-all duration-200',
              showLabel ? 'opacity-100 -translate-y-4 top-5' : 'opacity-0 top-5'
            )
          "
        >
          {{ props.label }}
        </FormLabel>
        <FormControl>
          <div
            :class="
              cn(
                'z-1 grid cursor-text rounded-md border min-h-[50px] transition-all duration-200 ease-in-out border-input shadow-sm',
                {'border-destructive': error},
                {'border-primary': isInteracting},
              )
            "
          >
            <textarea
              :id="props.name"
              v-model="value"
              :name="props.name"
              :placeholder="showPlaceholder ? placeholder : ''"
              @input="handleInput"
              @focus="handleFocus"
              @blur="handleBlur"
              :class="
                cn(
                  'text-sm w-full bg-background appearance-none transition-all duration-200 ease-in-out rounded-md p-3 border-none outline-none focus:outline-none focus:ring-2 ring-primary focus:border-none text-ellipsis placeholder:text-muted-foreground shadow-sm',
                  showLabel
                    ? 'pt-5 pb-1 placeholder:opacity-0'
                    : 'placeholder:opacity-100',
                  props.class
                )
              "
            ></textarea>
          </div>
        </FormControl>
      </div>
      <Transition
        name="fade">
        <FormMessage v-if="error && !isInteracting" :message="error" />
      </Transition>
    </FormItem>
  </FormField>
</template>
