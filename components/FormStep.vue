<script setup lang="ts">
import { computed, inject, type Ref } from "vue";

const currentIdx = (inject("STEP_COUNTER") as Ref<number>).value++;
const formStepIdx = inject("CURRENT_STEP_INDEX") as Ref<number>;

const shouldShow = computed(() => {
  return currentIdx === formStepIdx.value;
});
</script>
<template>
  <div v-if="shouldShow">
    <slot />
  </div>
</template>
