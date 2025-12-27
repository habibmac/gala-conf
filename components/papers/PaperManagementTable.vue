<script setup lang="ts">
import { computed, ref } from 'vue';
import { formatDistanceToNow } from 'date-fns';
import type { Paper } from '@/types/papers';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/vue';
import Badge from '~/components/ui/badge/Badge.vue';
import Checkbox from '~/components/ui/checkbox/Checkbox.vue';
import Table from '~/components/ui/table/Table.vue';
import TableBody from '~/components/ui/table/TableBody.vue';
import TableCell from '~/components/ui/table/TableCell.vue';
import TableHead from '~/components/ui/table/TableHead.vue';
import TableHeader from '~/components/ui/table/TableHeader.vue';
import TableRow from '~/components/ui/table/TableRow.vue';

interface Props {
  papers: Paper[]
  loading?: boolean
}

interface Emits {
  (e: 'assign-reviewer', paperId: string): void
  (e: 'change-status', paperId: string): void
  (e: 'select', paperId: string): void
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const selectedPapers = ref<Set<string>>(new Set());

const isAllSelected = computed(() => {
  return props.papers.length > 0 && selectedPapers.value.size === props.papers.length;
});

const toggleAll = () => {
  if (isAllSelected.value) {
    selectedPapers.value.clear();
  } else {
    selectedPapers.value.clear();
    props.papers.forEach(p => selectedPapers.value.add(p.paper_id));
  }
};

const togglePaper = (paperId: string) => {
  if (selectedPapers.value.has(paperId)) {
    selectedPapers.value.delete(paperId);
  } else {
    selectedPapers.value.add(paperId);
  }
};
</script>

<template>
  <div class="space-y-4">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead class="w-12">
            <Checkbox
              :checked="isAllSelected"
              @update:checked="toggleAll"
            />
          </TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Topic</TableHead>
          <TableHead>Status</TableHead>
          <TableHead class="text-center">Reviews</TableHead>
          <TableHead>Submitted</TableHead>
          <TableHead class="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-if="loading">
          <TableCell colspan="7" class="h-20 text-center">
            <div class="flex justify-center">
              <Icon icon="svg-spinners:ring-resize" class="h-6 w-6 text-muted-foreground" />
            </div>
          </TableCell>
        </TableRow>
        <TableRow v-else-if="papers.length === 0">
          <TableCell colspan="7" class="h-20 text-center text-muted-foreground">
            No papers found
          </TableCell>
        </TableRow>
        <TableRow v-for="paper in papers" :key="paper.paper_id">
          <TableCell>
            <Checkbox
              :checked="selectedPapers.has(paper.paper_id)"
              @update:checked="togglePaper(paper.paper_id)"
            />
          </TableCell>
          <TableCell>
            <div>
              <NuxtLink :to="`/events/patklin/papers/${paper.paper_id}`" class="font-medium text-primary hover:underline">
                {{ paper.title }}
              </NuxtLink>
              <p class="text-xs text-muted-foreground">{{ paper.authors.map(a => a.name).join(', ') }}</p>
            </div>
          </TableCell>
          <TableCell>{{ paper.topic.name }}</TableCell>
          <TableCell>
            <PaperStatusBadge :status="paper.status" />
          </TableCell>
          <TableCell class="text-center">
            <Badge variant="secondary" class="rounded-full">
              {{ paper.review_count }}
            </Badge>
          </TableCell>
          <TableCell class="text-xs text-muted-foreground">
            {{ formatDistanceToNow(new Date(paper.submitted_at), { addSuffix: true }) }}
          </TableCell>
          <TableCell class="text-right">
            <div class="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                @click="$emit('assign-reviewer', paper.paper_id)"
              >
                Assign
              </Button>
              <Button
                variant="outline"
                size="sm"
                @click="$emit('change-status', paper.paper_id)"
              >
                Status
              </Button>
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>
