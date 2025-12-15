<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { format, parse } from 'date-fns';

import type { Answer, RegistrationDetails } from '~/types';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { getCountryFlagWithName } from '@/utils';

interface Props {
  registration: RegistrationDetails
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'save-answers': [payload: any]
}>();

const isExpanded = ref(true);
const isEditMode = ref(false);
const isSaving = ref(false);
const originalAnswers = ref<Array<{ qst_id: number, ans: string }>>([]);
const editedAnswers = ref<Array<{ qst_id: number, ans: string }>>([]);
const authStore = useAuthStore();

const canEditRegistrations = computed(() => {
  return authStore.userInfo?.user_roles?.some(role =>
    ['administrator', 'ee_event_organizer'].includes(role),
  ) || false;
});

const isChanged = computed(() => {
  if (editedAnswers.value.length !== originalAnswers.value.length)
    return true;
  return editedAnswers.value.some(
    (answer, index) => answer.ans !== originalAnswers.value[index]?.ans,
  );
});

// Get only the answers that have changed
const getChangedAnswers = () => {
  return editedAnswers.value.filter((answer, index) => {
    const original = originalAnswers.value[index];
    return original && answer.ans !== original.ans;
  });
};

// Map Event Espresso question types to HTML input types
const getInputType = (qstType: string): string => {
  const typeMap: Record<string, string> = {
    DATE: 'date',
    EMAIL: 'email',
    TEXT: 'text',
    TEXTAREA: 'textarea',
    NUMBER: 'number',
    TEL: 'tel',
    URL: 'url',
    COUNTRY: 'text',
    RADIO_BTN: 'text', // Will need special handling for radio buttons
    DROPDOWN: 'text', // Will need special handling for dropdowns
    MULTIPLE_SELECT: 'text', // Will need special handling for multi-select
  };

  return typeMap[qstType?.toUpperCase()] || 'text';
};

// Get country display with flag
const getCountryDisplay = (countryCode: string): string => {
  if (!countryCode)
    return '';
  return getCountryFlagWithName(countryCode) || countryCode;
};

// Convert date string to YYYY-MM-DD format for date inputs
const formatDateForInput = (dateString: string, qstType: string): string => {
  if (qstType?.toUpperCase() !== 'DATE' || !dateString)
    return dateString;

  try {
    // Try common date formats
    const formats = [
      'd MMMM yyyy', // 11 April 1997
      'MMMM d, yyyy', // April 11, 1997
      'dd/MM/yyyy', // 11/04/1997
      'MM/dd/yyyy', // 04/11/1997
      'yyyy-MM-dd', // 1997-04-11 (already correct)
    ];

    for (const formatStr of formats) {
      try {
        const date = parse(dateString, formatStr, new Date());
        if (!Number.isNaN(date.getTime())) {
          // Return in YYYY-MM-DD format for HTML date input
          return format(date, 'yyyy-MM-dd');
        }
      }
      catch {
        continue;
      }
    }
  }
  catch (e) {
    console.error('Date parsing error:', e);
    // If all parsing fails, return original
  }

  return dateString;
};

const enterEditMode = () => {
  // Store both original and edited answers in the same format (converted for date inputs)
  // This ensures that unchanged dates aren't detected as modified
  originalAnswers.value = (props.registration.ans || []).map(answer => ({
    qst_id: answer.qst_id || 0,
    ans: formatDateForInput(answer.ans || '', answer.qst_type),
  }));
  editedAnswers.value = (props.registration.ans || []).map(answer => ({
    qst_id: answer.qst_id || 0,
    ans: formatDateForInput(answer.ans || '', answer.qst_type),
  }));
  isEditMode.value = true;
};

const cancelEdit = () => {
  isEditMode.value = false;
  editedAnswers.value = [];
  originalAnswers.value = [];
};

const saveChanges = async () => {
  if (isSaving.value || !isChanged.value)
    return;

  try {
    isSaving.value = true;
    // Only send changed answers
    const changedAnswers = getChangedAnswers();
    await emit('save-answers', { ans: changedAnswers });
    isEditMode.value = false;
  }
  catch (error) {
    console.error('Failed to save answers:', error);
  }
  finally {
    isSaving.value = false;
  }
};

// Group answers by category from backend
const groupedAnswers = computed(() => {
  const groups: Record<string, { answers: typeof props.registration.ans, order: number }> = {};

  props.registration.ans.forEach((answer: Answer) => {
    if (!answer.ans)
      return; // Skip empty answers

    // Use backend-provided group name, fallback to 'Other'
    const groupName = answer.qst_group || 'Other';
    const groupOrder = answer.qst_group_order ?? 999; // Default high order for ungrouped items

    if (!groups[groupName]) {
      groups[groupName] = { answers: [], order: groupOrder };
    }

    groups[groupName].answers.push(answer);
  });

  // Return as array of [groupName, answers] tuples, sorted by group order
  return Object.entries(groups)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([name, data]) => [name, data.answers] as [string, typeof props.registration.ans]);
});
</script>

<template>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between">
      <CardTitle class="flex items-center gap-2">
        <Icon icon="solar:documents-bold-duotone" class="size-5 text-violet-500" />
        Registration Information
        <Badge
          variant="secondary"
          class="flex h-6 min-w-6 shrink-0 scale-90 items-center justify-center rounded-full px-1.5 text-xs"
        >
          {{ registration.ans.filter(a => a.ans).length }}
        </Badge>
        <Icon
          v-if="isEditMode && isChanged"
          icon="heroicons:pencil-square-solid"
          class="size-4 text-amber-600 dark:text-amber-500"
        />
      </CardTitle>
      <Button
        v-if="canEditRegistrations && !isEditMode"
        variant="outline"
        size="sm"
        @click.stop="enterEditMode"
      >
        <Icon icon="tabler:edit" class="mr-2 size-4" />
        Edit
      </Button>
      <Button
        v-if="isEditMode"
        variant="outline"
        size="sm"
        @click.stop="cancelEdit"
      >
        <Icon icon="heroicons:x-mark" class="mr-2 size-4" />
        Close
      </Button>
    </CardHeader>
    <CardContent>
      <Collapsible v-model:open="isExpanded">
        <CollapsibleContent class="mt-2">
          <div class="space-y-4">
            <div v-for="[groupName, answers] in groupedAnswers" :key="groupName" class="space-y-2">
              <h4 class="border-b pb-1 text-sm font-semibold text-muted-foreground">
                {{ groupName }}
              </h4>
              <div class="space-y-1.5">
                <div
                  v-for="answer in answers"
                  :key="answer.qst_id"
                  class="flex flex-col gap-1 rounded-md px-2 py-1 hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                >
                  <span class="flex-1 text-sm text-muted-foreground">{{ answer.qst }}</span>

                  <!-- Edit mode: Dropdown/Select for DROPDOWN type -->
                  <select
                    v-if="isEditMode && answer.qst_type?.toUpperCase() === 'DROPDOWN' && answer.options"
                    :value="editedAnswers.find(a => a.qst_id === answer.qst_id)?.ans || ''"
                    class="w-full rounded border border-input px-2 py-1 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 dark:bg-slate-700 dark:text-slate-100 sm:w-auto sm:flex-1"
                    @change="(e) => {
                      const ansIdx = editedAnswers.findIndex(a => a.qst_id === answer.qst_id);
                      if (ansIdx >= 0) {
                        editedAnswers[ansIdx].ans = (e.target as HTMLSelectElement).value;
                      }
                    }"
                  >
                    <option value="">
                      Select an option
                    </option>
                    <option v-for="option in answer.options" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </option>
                  </select>

                  <!-- Edit mode: Radio buttons for RADIO_BTN type -->
                  <div
                    v-else-if="isEditMode && answer.qst_type?.toUpperCase() === 'RADIO_BTN' && answer.options && answer.options.length > 0"
                    class="flex flex-col gap-1 sm:w-auto sm:flex-1"
                  >
                    <label
                      v-for="option in answer.options"
                      :key="option.value"
                      class="flex cursor-pointer items-center gap-2 text-sm"
                    >
                      <input
                        type="radio"
                        :name="`question-${answer.qst_id}`"
                        :value="option.value"
                        :checked="editedAnswers.find(a => a.qst_id === answer.qst_id)?.ans === option.value"
                        class="size-4 text-amber-600 focus:ring-amber-500"
                        @change="(e) => {
                          const ansIdx = editedAnswers.findIndex(a => a.qst_id === answer.qst_id);
                          if (ansIdx >= 0) {
                            editedAnswers[ansIdx].ans = (e.target as HTMLInputElement).value;
                          }
                        }"
                      >
                      <span>{{ option.label }}</span>
                    </label>
                  </div>

                  <!-- Edit mode: Textarea for TEXTAREA type -->
                  <textarea
                    v-else-if="isEditMode && getInputType(answer.qst_type) === 'textarea'"
                    :value="editedAnswers.find(a => a.qst_id === answer.qst_id)?.ans || ''"
                    class="w-full rounded border border-input px-2 py-1 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 dark:bg-slate-700 dark:text-slate-100 sm:w-auto sm:flex-1"
                    rows="3"
                    @input="(e) => {
                      const ansIdx = editedAnswers.findIndex(a => a.qst_id === answer.qst_id);
                      if (ansIdx >= 0) {
                        editedAnswers[ansIdx].ans = (e.target as HTMLTextAreaElement).value;
                      }
                    }"
                  />

                  <!-- Edit mode: Input field for other types -->
                  <input
                    v-else-if="isEditMode"
                    :value="editedAnswers.find(a => a.qst_id === answer.qst_id)?.ans || ''"
                    :type="getInputType(answer.qst_type)"
                    class="w-full rounded border border-input px-2 py-1 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 dark:bg-slate-700 dark:text-slate-100 sm:w-auto sm:flex-1"
                    @input="(e) => {
                      const ansIdx = editedAnswers.findIndex(a => a.qst_id === answer.qst_id);
                      if (ansIdx >= 0) {
                        editedAnswers[ansIdx].ans = (e.target as HTMLInputElement).value;
                      }
                    }"
                  >

                  <!-- Read-only -->
                  <span v-else class="text-sm font-medium">
                    {{ answer.qst_type?.toUpperCase() === 'COUNTRY' ? getCountryDisplay(answer.ans) : (answer.ans || 'Not provided') }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <!-- Action Buttons -->
      <div v-if="isEditMode && canEditRegistrations" class="mt-6 flex gap-2 border-t border-slate-200 pt-4 dark:border-slate-700">
        <Button class="flex-1" :disabled="isSaving || !isChanged" @click.stop="saveChanges">
          <Icon v-if="isSaving" icon="svg-spinners:ring-resize" class="mr-2 size-4" />
          {{ isSaving ? 'Saving...' : 'Save Changes' }}
        </Button>
        <Button
          class="flex-1"
          variant="outline"
          :disabled="isSaving"
          @click.stop="cancelEdit"
        >
          Cancel
        </Button>
      </div>
    </CardContent>
  </Card>
</template>
