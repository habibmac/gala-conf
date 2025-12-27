<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type { Reviewer } from '@/types/papers';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/vue';
import Card from '~/components/ui/card/Card.vue';
import CardContent from '~/components/ui/card/CardContent.vue';
import CardHeader from '~/components/ui/card/CardHeader.vue';
import CardTitle from '~/components/ui/card/CardTitle.vue';
import Label from '~/components/ui/label/Label.vue';
import Select from '~/components/ui/select/Select.vue';
import SelectContent from '~/components/ui/select/SelectContent.vue';
import SelectItem from '~/components/ui/select/SelectItem.vue';
import SelectTrigger from '~/components/ui/select/SelectTrigger.vue';
import SelectValue from '~/components/ui/select/SelectValue.vue';

interface Props {
  paperId: string
  currentReviewers: Reviewer[]
}

interface Emits {
  (e: 'assign', reviewerId: string): void
  (e: 'remove', reviewerId: string): void
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { getReviewers } = useReviewers('');
const availableReviewers = ref<Reviewer[]>([]);
const selectedReviewerId = ref('');
const isLoading = ref(false);

const currentReviewerIds = computed(() => new Set(props.currentReviewers.map(r => r.user_id)));

const filterableReviewers = computed(() => {
  return availableReviewers.value.filter(r => !currentReviewerIds.value.has(r.user_id));
});

onMounted(async () => {
  isLoading.value = true;
  try {
    availableReviewers.value = await getReviewers();
  } finally {
    isLoading.value = false;
  }
});

const assignReviewer = () => {
  if (selectedReviewerId.value) {
    emit('assign', selectedReviewerId.value);
    selectedReviewerId.value = '';
  }
};
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Assign Reviewers</CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <!-- Current Reviewers -->
      <div v-if="currentReviewers.length > 0">
        <Label class="text-xs mb-2">Assigned Reviewers</Label>
        <div class="space-y-2">
          <div v-for="reviewer in currentReviewers" :key="reviewer.user_id" class="flex items-center justify-between rounded-lg border bg-card p-3">
            <div>
              <p class="text-sm font-medium">{{ reviewer.name }}</p>
              <p class="text-xs text-muted-foreground">{{ reviewer.email }}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              @click="$emit('remove', reviewer.user_id)"
              class="h-8 w-8 p-0"
            >
              <Icon icon="heroicons:x-mark-solid" class="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <div v-else class="text-sm text-muted-foreground italic">
        No reviewers assigned yet
      </div>

      <!-- Add Reviewer -->
      <div class="border-t pt-4 space-y-3">
        <div class="space-y-2">
          <Label class="text-xs">Add Reviewer</Label>
          <Select v-model="selectedReviewerId" :disabled="isLoading || filterableReviewers.length === 0">
            <SelectTrigger>
              <SelectValue :placeholder="isLoading ? 'Loading...' : filterableReviewers.length === 0 ? 'No reviewers available' : 'Select a reviewer'" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="reviewer in filterableReviewers" :key="reviewer.user_id" :value="reviewer.user_id">
                {{ reviewer.name }} ({{ reviewer.assigned_papers_count }} papers)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="default"
          size="sm"
          :disabled="!selectedReviewerId || isLoading"
          @click="assignReviewer"
          class="w-full"
        >
          <Icon icon="heroicons:plus-solid" class="h-4 w-4 mr-2" />
          Add Reviewer
        </Button>
      </div>
    </CardContent>
  </Card>
</template>
