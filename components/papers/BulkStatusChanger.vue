<script setup lang="ts">
import { ref } from 'vue';
import type { Paper } from '@/types/papers';
import { Button } from '@/components/ui/button';
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
  paperIds: string[]
}

interface Emits {
  (e: 'status-changed', status: Paper['status']): void
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const selectedStatus = ref<Paper['status'] | ''>('');
const isLoading = ref(false);

const statusOptions: Array<{ value: Paper['status'], label: string }> = [
  { value: 'pending', label: 'Pending' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
];

const changeStatus = async () => {
  if (!selectedStatus.value) return;

  isLoading.value = true;
  try {
    // TODO: Call API to change status
    console.log('Changing status to:', selectedStatus.value, 'for papers:', props.paperIds);
    emit('status-changed', selectedStatus.value as Paper['status']);
    selectedStatus.value = '';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Change Status</CardTitle>
      <p class="text-sm text-muted-foreground">
        {{ paperIds.length }} paper{{ paperIds.length !== 1 ? 's' : '' }} selected
      </p>
    </CardHeader>
    <CardContent class="space-y-3">
      <div class="space-y-2">
        <Label class="text-xs">New Status</Label>
        <Select v-model="selectedStatus" :disabled="isLoading">
          <SelectTrigger>
            <SelectValue placeholder="Select a new status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="option in statusOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        variant="default"
        :disabled="!selectedStatus || isLoading"
        @click="changeStatus"
        class="w-full"
      >
        <span v-if="isLoading">Processing...</span>
        <span v-else>Update Status</span>
      </Button>
    </CardContent>
  </Card>
</template>
