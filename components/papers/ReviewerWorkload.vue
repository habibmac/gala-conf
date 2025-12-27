<script setup lang="ts">
import type { ReviewerWorkload } from '@/types/papers';
import { Icon } from '@iconify/vue';
import Badge from '~/components/ui/badge/Badge.vue';
import Table from '~/components/ui/table/Table.vue';
import TableBody from '~/components/ui/table/TableBody.vue';
import TableCell from '~/components/ui/table/TableCell.vue';
import TableHead from '~/components/ui/table/TableHead.vue';
import TableHeader from '~/components/ui/table/TableHeader.vue';
import TableRow from '~/components/ui/table/TableRow.vue';

interface Props {
  workload: ReviewerWorkload[]
}

defineProps<Props>();
</script>

<template>
  <div class="space-y-4">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Reviewer</TableHead>
          <TableHead>Email</TableHead>
          <TableHead class="text-center">Assigned</TableHead>
          <TableHead class="text-center">Completed</TableHead>
          <TableHead class="text-center">Pending</TableHead>
          <TableHead class="text-center">Progress</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-if="workload.length === 0">
          <TableCell colspan="6" class="h-20 text-center text-muted-foreground">
            No reviewers found
          </TableCell>
        </TableRow>
        <TableRow v-for="item in workload" :key="item.reviewer.user_id">
          <TableCell>
            <p class="font-medium">{{ item.reviewer.name }}</p>
          </TableCell>
          <TableCell class="text-muted-foreground">
            {{ item.reviewer.email }}
          </TableCell>
          <TableCell class="text-center">
            <Badge variant="secondary">
              {{ item.assigned_count }}
            </Badge>
          </TableCell>
          <TableCell class="text-center">
            <Badge variant="default" class="bg-green-100 text-green-800 hover:bg-green-100">
              {{ item.completed_count }}
            </Badge>
          </TableCell>
          <TableCell class="text-center">
            <Badge variant="default" class="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
              {{ item.pending_count }}
            </Badge>
          </TableCell>
          <TableCell class="text-center">
            <div class="flex items-center justify-center gap-2">
              <div class="h-2 w-20 rounded-full bg-secondary">
                <div
                  :style="{ width: `${item.assigned_count > 0 ? (item.completed_count / item.assigned_count) * 100 : 0}%` }"
                  class="h-full rounded-full bg-green-500 transition-all"
                />
              </div>
              <span class="text-xs font-medium text-muted-foreground">
                {{ item.assigned_count > 0 ? Math.round((item.completed_count / item.assigned_count) * 100) : 0 }}%
              </span>
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>
