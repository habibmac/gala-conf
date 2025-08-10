<script setup lang="ts">
import type { RegistrationData } from '~/types';

interface Props {
  lookupResult: RegistrationData
}

const props = defineProps<Props>();

// Show all answers that have values
const customAnswers = computed(() => {
  if (!props.lookupResult.ans) return [];
  
  return props.lookupResult.ans.filter((answer: any) => {
    return answer.ans && answer.ans !== '' && answer.ans !== '-';
  });
});

const customAnswersColumns = [
  { key: 'qst', label: '', class: 'w-1/3' },
  { key: 'ans', label: '' },
];
</script>

<template>
  <TableCard
    v-if="customAnswers.length > 0"
    title="Custom Questions"
    :data="customAnswers"
    :columns="customAnswersColumns"
    :show-table-header="false"
    class="w-full"
  >
    <!-- Style the questions (left column) -->
    <template #cell-qst="{ value }">
      <span class="font-medium text-muted-foreground">{{ value }}</span>
    </template>

    <!-- Style the answers (right column) -->
    <template #cell-ans="{ value }">
      <span class="font-medium">{{ value }}</span>
    </template>
  </TableCard>
</template>