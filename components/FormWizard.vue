<script setup lang="ts">
import { useForm } from 'vee-validate';
import { ref, computed, provide, type PropType } from 'vue';
import { Icon } from '@iconify/vue';
import { onBeforeRouteLeave } from 'vue-router';

const props = defineProps({
  validationSchema: {
    type: Array as PropType<ReturnType<typeof toTypedSchema>[]>,
    required: true,
  },
});

const emit = defineEmits(['submit', 'update:currentStep', 'formValuesUpdate']);

const currentStepIdx = ref(0);
const stepCounter = ref(0);

const isLastStep = computed(() => {
  return currentStepIdx.value === stepCounter.value - 1;
});

const hasPrevious = computed(() => {
  return currentStepIdx.value > 0;
});

const currentSchema = computed(() => {
  return props.validationSchema[currentStepIdx.value];
});

const { values, handleSubmit, errors, meta, setFieldValue } = useForm({
  validationSchema: currentSchema,
  keepValuesOnUnmount: true,
});

function updateFormField(field: string, value: unknown) {
  setFieldValue(field, value);
}

function errorMessages(field: string) {
  return errors.value[field];
}

// Expose the method to the parent component
defineExpose({ updateFormField, errorMessages });

const onSubmit = handleSubmit((values) => {
  if (!isLastStep.value) {
    currentStepIdx.value++;
    emit('update:currentStep', currentStepIdx.value);
    return;
  }
  emit('submit', values);
});

function goToPrev() {
  if (currentStepIdx.value === 0) {
    return;
  }
  currentStepIdx.value--;
  emit('update:currentStep', currentStepIdx.value);
}

provide('STEP_COUNTER', stepCounter);
provide('CURRENT_STEP_INDEX', currentStepIdx);

watch(
  values,
  (newValues) => {
    emit('formValuesUpdate', newValues);
  },
  { deep: true }
);

onBeforeRouteLeave((to, from, next) => {
  if (meta.value.dirty) {
    const answer = window.confirm('You have unsaved changes. Do you really want to leave?');
    if (answer) {
      next();
    } else {
      next(false);
    }
  } else {
    next();
  }
});
</script>
<template>
  <form class="grow flex flex-col" @submit="onSubmit">
    <header class="bg-muted/30 sticky backdrop-blur-sm w-full px-4 py-5 border-b">
      <div class="relative flex justify-between items-center gap-2">
        <div class="absolute top-1/2 -translate-y-1/2 hidden lg:block lg:left-5 z-10">
          <Button as-child variant="link" class="flex shrink-0 text-muted-foreground">
            <NuxtLink to="/my-events" class="items-center flex gap-1">
              <Icon icon="heroicons:arrow-long-left" class="size-5" />
              <span class="hidden lg:inline-block"> Back to My Events </span>
            </NuxtLink>
          </Button>
        </div>

        <slot name="form-steps">
          <div />
        </slot>

        <div class="absolute w-full lg:w-auto lg:right-0 top-1/2 -translate-y-1/2 flex justify-center">
          <div class="flex w-full justify-between gap-3">
            <Button
              v-if="hasPrevious"
              variant="outline"
              class="flex items-center justify-center gap-1"
              @click.prevent="goToPrev"
            >
              <Icon icon="heroicons:chevron-left" class="size-4 sm:hidden" />
              <span class="hidden sm:inline-block">Previous</span>
            </Button>
            <div v-else />
            <Button type="submit" class="flex left-auto items-center justify-center gap-1">
              <span class="hidden sm:inline-block">{{ isLastStep ? 'Save draft' : 'Next' }}</span>
              <Icon icon="heroicons:chevron-right" class="size-4 sm:hidden" />
            </Button>
          </div>
        </div>
      </div>
    </header>

    <!-- <pre>{{ values }}</pre> -->

    <div class="flex-1 grow pb-32">
      <slot name="form-content" />
    </div>
  </form>
</template>
