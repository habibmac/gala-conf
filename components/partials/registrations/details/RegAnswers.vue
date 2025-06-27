<script setup lang="ts">
import { Icon } from '@iconify/vue';

import type { Answer, RegistrationDetails } from '~/types';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';

interface Props {
  registration: RegistrationDetails
}

const props = defineProps<Props>();

const isExpanded = ref(true);

// Group answers by category for better organization
const groupedAnswers = computed(() => {
  const groups: Record<string, typeof props.registration.ans> = {
    'Personal Information': [],
    'Emergency Contact': [],
    'Event Specific': [],
    'Medical Information': [],
    'Social Media': [],
    'Other': [],
  };

  props.registration.ans.forEach((answer: Answer) => {
    if (!answer.ans)
      return; // Skip empty answers

    const question = answer.qst.toLowerCase();

    if (question.includes('birth') || question.includes('gender') || question.includes('nationality') || question.includes('ktp') || question.includes('passport')) {
      groups['Personal Information'].push(answer);
    }
    else if (question.includes('emergency')) {
      groups['Emergency Contact'].push(answer);
    }
    else if (question.includes('running') || question.includes('marathon') || question.includes('time') || question.includes('bib') || question.includes('shirt')) {
      groups['Event Specific'].push(answer);
    }
    else if (question.includes('medical') || question.includes('blood')) {
      groups['Medical Information'].push(answer);
    }
    else if (question.includes('facebook') || question.includes('twitter') || question.includes('social')) {
      groups['Social Media'].push(answer);
    }
    else {
      groups.Other.push(answer);
    }
  });

  // Remove empty groups
  return Object.entries(groups).filter(([_, answers]) => answers.length > 0);
});
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <Icon icon="solar:documents-bold-duotone" class="size-5 text-violet-500" />
        Registration Information
        <Badge variant="secondary">
          {{ registration.ans.filter(a => a.ans).length }}
        </Badge>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <Collapsible v-model:open="isExpanded">
        <CollapsibleContent class="mt-4">
          <div class="space-y-6">
            <div v-for="[groupName, answers] in groupedAnswers" :key="groupName" class="space-y-3">
              <h4 class="border-b pb-1 text-sm font-semibold text-muted-foreground">
                {{ groupName }}
              </h4>
              <div class="space-y-0.5">
                <div v-for="answer in answers" :key="answer.qst_id" class="flex items-start justify-between rounded-md p-2 hover:bg-muted/50">
                  <span class="flex-1 pr-4 text-sm text-muted-foreground">{{ answer.qst }}</span>
                  <span class="text-right text-sm font-medium">{{ answer.ans || 'Not provided' }}</span>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </CardContent>
  </Card>
</template>
