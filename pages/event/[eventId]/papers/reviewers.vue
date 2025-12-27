<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import { Icon } from '@iconify/vue';
import {
  createColumnHelper,
  FlexRender,
  getCoreRowModel,
  useVueTable,
} from '@tanstack/vue-table';
import { computed, ref, toRef } from 'vue';
import type { ReviewerWorkload, ColumnConfig } from '@/types/papers';
import { calculateMinWidth } from '@/utils';
import Badge from '~/components/ui/badge/Badge.vue';

useHead({
  title: 'Reviewer Management',
});

definePageMeta({
  group: 'conf',
  icon: 'solar:users-group-two-rounded-bold-duotone',
  layout: 'dashboard-with-sidebar',
  order: 2,
  requiresSelectedEvent: true,
  roles: ['administrator', 'ee_event_organizer', 'ee_event_operator'],
  showInMenu: true,
  title: 'Reviewers',
});

const route = useRoute();
const eventId = computed(() => route.params.eventId as string);

const { getReviewerWorkload } = useReviewers(eventId.value);

// Fetch data with TanStack Query
const { data, isLoading } = useQuery({
  enabled: !!eventId.value,
  queryFn: () => getReviewerWorkload(),
  queryKey: ['reviewerWorkload', eventId],
  staleTime: 1000 * 60, // 1 minute
});

const workload = computed(() => data.value || []);

// Table configurations
const columnConfigs = ref<ColumnConfig[]>([
  {
    header: 'Reviewer',
    isHideable: false,
    isVisible: true,
    key: 'reviewer',
    width: 25,
  },
  {
    header: 'Email',
    isHideable: true,
    isVisible: true,
    key: 'email',
    width: 25,
  },
  {
    header: 'Assigned',
    isHideable: false,
    isVisible: true,
    key: 'assigned_count',
    width: 10,
  },
  {
    header: 'Completed',
    isHideable: true,
    isVisible: true,
    key: 'completed_count',
    width: 10,
  },
  {
    header: 'Pending',
    isHideable: true,
    isVisible: true,
    key: 'pending_count',
    width: 10,
  },
  {
    header: 'Progress',
    isHideable: false,
    isVisible: true,
    key: 'progress',
    width: 20,
  },
]);

// Define columns
const columnHelper = createColumnHelper<ReviewerWorkload>();
const columns = computed(() => {
  return columnConfigs.value
    .filter(config => config.isVisible)
    .map((config) => {
      return columnHelper.accessor(config.key as any, {
        cell: (info) => {
          const item = info.row.original;

          switch (config.key) {
            case 'reviewer':
              return h('p', { class: 'font-medium' }, item.reviewer.name);
            case 'email':
              return h('p', { class: 'text-muted-foreground text-sm' }, item.reviewer.email);
            case 'assigned_count':
              return h('div', { class: 'text-center' }, [
                h(Badge, { variant: 'secondary' }, () => String(item.assigned_count)),
              ]);
            case 'completed_count':
              return h('div', { class: 'text-center' }, [
                h(Badge, {
                  variant: 'default',
                  class: 'bg-green-100 text-green-800 hover:bg-green-100'
                }, () => String(item.completed_count)),
              ]);
            case 'pending_count':
              return h('div', { class: 'text-center' }, [
                h(Badge, {
                  variant: 'default',
                  class: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                }, () => String(item.pending_count)),
              ]);
            case 'progress': {
              const percentage = item.assigned_count > 0
                ? Math.round((item.completed_count / item.assigned_count) * 100)
                : 0;
              return h('div', { class: 'flex items-center justify-center gap-2' }, [
                h('div', { class: 'h-2 w-20 rounded-full bg-secondary' }, [
                  h('div', {
                    style: `width: ${percentage}%`,
                    class: 'h-full rounded-full bg-green-500 transition-all'
                  }),
                ]),
                h('span', { class: 'text-xs font-medium text-muted-foreground' }, `${percentage}%`),
              ]);
            }
            default:
              return info.getValue();
          }
        },
        header: config.header,
        size: config.width * 10,
      });
    });
});

// Create table instance
const table = useVueTable({
  get columns() {
    return columns.value;
  },
  get data() {
    return workload.value;
  },
  getCoreRowModel: getCoreRowModel(),
});
</script>

<template>
  <div class="container mx-auto flex flex-col gap-5">
    <div class="flex flex-col">
      <header class="mb-5 flex flex-col gap-2 pt-10 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 class="h2 mb-2">
            Reviewer Management
          </h1>
          <p class="text-muted-foreground">
            Monitor reviewer workload and review progress
          </p>
        </div>
      </header>
    </div>
  </div>

  <section class="container relative mx-auto mb-20" :class="{ 'scroll-area overflow-x-auto': !isLoading }">
    <Card class="w-full">
      <CardHeader class="flex flex-row items-center justify-between space-y-0">
        <CardTitle class="font-medium tracking-normal">
          Reviewer Workload
        </CardTitle>
      </CardHeader>
      <CardContent class="scroll-area overflow-x-auto p-0">
        <div>
          <table class="w-full bg-white dark:bg-transparent dark:text-slate-300/90">
            <thead class="border-y border-slate-200 bg-slate-100 dark:border-slate-900/50 dark:bg-slate-800/50 dark:text-slate-400">
              <tr v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
                <th
                  v-for="header in headerGroup.headers"
                  :key="header.id"
                  :colSpan="header.colSpan"
                  :style="{ width: `${header.column.columnDef.size}px` }"
                  class="whitespace-nowrap px-2 py-3 text-sm font-normal text-slate-400 first:pl-5 last:pr-5 dark:text-slate-400"
                >
                  <FlexRender :render="header.column.columnDef.header" :props="header.getContext()" />
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <template v-if="!table.getRowModel().rows.length">
                <template v-if="isLoading">
                  <tr v-for="index in 10" :key="index">
                    <td v-for="(_, index2) in columns" :key="index2" class="p-2">
                      <Skeleton class="h-6 w-full rounded" />
                    </td>
                  </tr>
                </template>
                <tr v-else>
                  <td colspan="6" class="py-10 text-center">
                    <EmptyState
                      title="No reviewers found"
                      description="There are no reviewers assigned yet."
                      icon="heroicons:user-group-solid"
                    />
                  </td>
                </tr>
              </template>
              <tr
                v-for="row in table.getRowModel().rows"
                :key="row.id"
                class="hover:bg-slate-50 dark:hover:bg-slate-950/20"
              >
                <td v-for="cell in row.getVisibleCells()" :key="cell.id" class="px-2 py-3 first:pl-5 last:pr-5">
                  <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  </section>
</template>
