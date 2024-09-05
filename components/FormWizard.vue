<script setup lang="ts">
import { useForm } from "vee-validate";
import { ref, computed, provide, type PropType } from "vue";
import { Icon } from "@iconify/vue";

const props = defineProps({
  validationSchema: {
    type: Array as PropType<ReturnType<typeof toTypedSchema>[]>,
    required: true,
  },
});

const emit = defineEmits(["submit", "update:currentStep", "formValuesUpdate"]);
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

const { values, handleSubmit, errors } = useForm({
  validationSchema: currentSchema,
  keepValuesOnUnmount: true,
});

const onSubmit = handleSubmit((values) => {
  if (!isLastStep.value) {
    currentStepIdx.value++;
    emit("update:currentStep", currentStepIdx.value);
    return;
  }

  emit("submit", values);
});

function goToPrev() {
  if (currentStepIdx.value === 0) {
    return;
  }

  currentStepIdx.value--;
  emit("update:currentStep", currentStepIdx.value);
}

provide("STEP_COUNTER", stepCounter);
provide("CURRENT_STEP_INDEX", currentStepIdx);

watch(values, (newValues) => {
  emit('formValuesUpdate', newValues);
}, { deep: true });


</script>
<template>
  <form @submit="onSubmit" class="grow flex flex-col">
    <header
      class="bg-card sticky backdrop-blur-sm w-full px-4 py-5 border-b"
    >
      <div class="flex justify-between items-center">
         <slot name="form-back-link">
          <div></div>
        </slot>
        <slot name="form-steps">
          <div></div>
        </slot>
        <div class="flex items-center space-x-2">
          <Button v-if="hasPrevious" @click.prevent="goToPrev" variant="outline">
            Previous
          </Button>
          <Button type="submit">
            {{ isLastStep ? "Submit" : "Next" }}
          </Button>
        </div>
      </div>
    </header>

    <div class="flex-1 grow">
      <div class="container pt-5 pb-40">
        <div class="mx-auto max-w-2xl py-10">
          <div v-if="errors.length" class="mb-4">
            {{errors}}
            <div class="bg-red-100 text-red-500 p-4 rounded-lg mb-4">
              <Icon icon="akar-icons:warning" class="w-6 h-6" />
              <span class="ml-2">Please fix the errors below</span>
              <ul>
                <li v-for="error in errors" :key="error">{{ error }}</li>
              </ul>
            </div>
          </div>
          <slot name="form-content" />
        </div>
      </div>
    </div>
  </form>
</template>
