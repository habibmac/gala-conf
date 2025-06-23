<script setup lang="ts">
import type { PaginationState, SortingState } from '@tanstack/vue-table';

import { Icon } from '@iconify/vue';
import {
  createColumnHelper,
  FlexRender,
  getCoreRowModel,

  useVueTable,
} from '@tanstack/vue-table';
import { format, fromUnixTime } from 'date-fns';
import { computed, ref } from 'vue';
import { toast } from 'vue-sonner';

import type { Answer, ColumnConfig, CustomField, RegItem, TicketGroup } from '@/types';

import TablePagination from '@/components/TablePagination.vue';
import { Badge } from '@/components/ui/badge';
import { useInsight } from '@/composables/useInsight';
import { formatThousands } from '@/utils';

const props = defineProps<{
  search?: string
  group?: string
  page?: string
  perPage?: string
  sortBy?: string
  order?: string
}>();

useHead({
  title: 'Insight',
});

definePageMeta({
  capabilities: ['ee_read_insights'],
  group: 'reports',
  icon: 'solar:users-group-two-rounded-bold-duotone',
  layout: 'dashboard-with-sidebar',
  order: 1,
  packages: ['smart', 'optima'],
  requiresSelectedEvent: true,
  roles: ['administrator', 'ee_event_organizer', 'ee_event_operator'],
  showInMenu: false,
  title: 'Insight',
});

const { group, order, page, perPage, search, sortBy } = toRefs(props);

const route = useRoute();
const router = useRouter();

const eventId = ref(route.params.eventId as string);
const insightId = route.params.insightId as string;

const endpoint = 'insights';

// Export state
const { exportData } = useExport();
const isExporting = ref(false);

// Pagination configs
const INITIAL_PAGE_SIZE = 10;
const pageSizes: (number | string)[] = [10, 20, 30, 40, 50];

// Safely extract and use query parameters with type assertion
const pagination = ref<PaginationState>({
  pageIndex: page.value ? Number(page.value) - 1 : 0,
  pageSize: perPage.value ? Number(perPage.value) : INITIAL_PAGE_SIZE,
});

const filters = ref({
  group: group.value || '',
  search: search.value || '',
});

// Define parseDesc to accept a string and return a boolean
const parseDesc = (order: string): boolean => order.toLowerCase() === 'desc';
const sorting = ref<SortingState>([
  {
    desc: parseDesc(order.value || 'asc'),
    id: sortBy.value || 'code',
  },
]);

const { insightData, isDataLoading, isMetaLoading, regData, ticketGroups, totalData, totalPages }
  = useInsight(eventId, insightId, pagination, sorting, filters);

// Table configuration
const columnConfigs = computed<ColumnConfig[]>(() => {
  const baseColumns = [
    {
      header: 'Date',
      isHideable: true,
      isVisible: false,
      key: 'date',
      width: 10,
    },
    {
      header: 'Reg Code',
      isHideable: false,
      isVisible: true,
      key: 'code',
      width: 10,
    },
    {
      header: 'Full Name',
      isHideable: false,
      isVisible: true,
      key: 'fullname',
      width: 20,
    },
    {
      header: 'Ticket',
      isHideable: true,
      isVisible: true,
      key: 'ticket_name',
      width: 15,
    },
    {
      header: 'Email',
      isHideable: true,
      isVisible: true,
      key: 'email',
      width: 15,
    },
    {
      header: 'Phone',
      isHideable: true,
      isVisible: true,
      key: 'phone',
      width: 15,
    },
  ];

  const customFields = getCustomFieldsColumns(insightData.value?.fields ?? []);
  return [...baseColumns, ...customFields];
});

// Define columns
const columnHelper = createColumnHelper<RegItem>();
const columns = computed(() => {
  return columnConfigs.value
    .filter(config => config.isVisible)
    .map((config) => {
      return columnHelper.accessor(
        (row: RegItem) => {
          // Handle custom fields by checking if there's an accessor function
          if (config.accessor) {
            return config.accessor(row);
          }
          // Handle regular fields
          return row[config.key as keyof RegItem];
        },
        {
          cell: (cellProps) => {
            // Here you can add specific cell rendering logic based on the column key
            switch (config.key) {
              case 'date': {
                const date = fromUnixTime(Number(cellProps.getValue()));
                return h(
                  'div',
                  {
                    class: 'text-right text-slate-900 dark:text-slate-300 text-xs',
                  },
                  [
                    h('div', { class: '' }, format(date, 'd MMM yyyy')),
                    h(
                      'div',
                      {
                        class: 'text-xs text-slate-400 dark:text-slate-600',
                      },
                      format(date, 'HH:mm'),
                    ),
                  ],
                );
              }
              case 'code': {
                const stt_id = cellProps.row.original.stt_id;
                return h(
                  'span',
                  {
                    class: `text-status ${getStatusInfo(stt_id).dotClass}`,
                  },
                  cellProps.getValue(),
                );
              }
              case 'fullname':
                return h(
                  'div',
                  {
                    class: 'font-semibold text-left text-slate-700 dark:text-slate-300 w-full',
                  },
                  cellProps.getValue(),
                );
              default:
                return h('div', { class: 'text-left' }, cellProps.getValue());
            }
          },
          header: config.header,
          id: config.key,
          size: config.width * 10,
          enableSorting: config.enableSorting !== false, // Default to true if not specified
        },
      );
    });
});

// Create the table instance
const table = useVueTable({
  get columns() {
    return columns.value;
  },
  get data() {
    return regData.value ?? [];
  },
  enableMultiSort: false,
  getCoreRowModel: getCoreRowModel(),
  manualFiltering: true,
  manualPagination: true,
  manualSorting: true,
  onPaginationChange: (updater) => {
    if (typeof updater === 'function') {
      setPagination(
        updater({
          pageIndex: pagination.value.pageIndex,
          pageSize: pagination.value.pageSize,
        }),
      );
    }
    else {
      setPagination(updater);
    }
  },
  onSortingChange: (updater) => {
    if (typeof updater === 'function') {
      setSorting(updater(sorting.value));
    }
    else {
      setSorting(updater);
    }
  },
  get pageCount() {
    return totalPages.value ?? -1;
  },
  state: {
    pagination: pagination.value,
    get sorting() {
      return sorting.value;
    },
  },
});

const activeTab = computed({
  get: () => {
    return (route.query.group as string) || filters.value.group || ticketGroups.value?.[0]?.name;
  },
  set: (value: string) => {
    handleTabChange(value);
  },
});

function getCustomFieldsColumns(fields: CustomField[]): ColumnConfig[] {
  return fields.map(field => ({
    accessor: (row: RegItem) => {
      const answer = row.ans?.find((a: Answer) => a.qst === field.label);
      return answer?.ans || '';
    },
    header: field.label,
    isHideable: true,
    isVisible: true,
    key: field.slug,
    width: 10,
    enableSorting: false,
  }));
}

function setPagination({ pageIndex, pageSize }: PaginationState): PaginationState {
  pagination.value.pageIndex = pageIndex;
  pagination.value.pageSize = pageSize;

  return { pageIndex, pageSize };
}

function setSorting(state: SortingState) {
  sorting.value = state;
}

function handlePageSizeChange(newSize: number) {
  pagination.value.pageSize = newSize;
}

const handleNavigation = (pageNumber: number) => {
  const currentPageIndex = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();

  if (pageNumber === currentPageIndex + 1) {
    // No change in page, do nothing
    return;
  }

  // Ensure the page number is within valid range
  const newPageIndex = Math.max(0, Math.min(pageNumber - 1, pageCount - 1));

  // Set the new page index
  table.setPageIndex(newPageIndex);

  // Update the router query
  router.push({
    query: {
      ...route.query,
      page: newPageIndex + 1,
    },
  });
};

// Reset filters, sorting, and pagination to their initial state
const handleResetFilters = () => {
  filters.value = {
    group: ticketGroups.value?.[0]?.name || '', // Reset to first group
    search: '',
  };

  pagination.value = {
    pageIndex: 0,
    pageSize: INITIAL_PAGE_SIZE,
  };

  sorting.value = [
    {
      desc: true,
      id: 'date',
    },
  ];
};

const handleTabChange = (tab: string) => {
  // Update router query
  router.push({
    query: {
      ...route.query,
      group: tab,
      page: '1', // Reset to first page when changing tabs
    },
  });

  // Update filters
  filters.value = {
    ...filters.value,
    group: tab,
  };

  // Reset pagination
  pagination.value = {
    ...pagination.value,
    pageIndex: 0, // Reset to first page
  };
};

const tabIndicatorClass = computed(() => {
  const index = ticketGroups.value?.findIndex((group: TicketGroup) => group.name === activeTab.value) ?? 0;
  return `translate(${index * 100}%)`;
});

const tabIndicatorWidth = computed(() => {
  const tabCount = ticketGroups.value?.length ?? 1;
  return `calc(100% / ${tabCount})`;
});

const handleExport = async (format: 'csv' | 'xlsx') => {
  try {
    isExporting.value = true;

    await exportData(
      eventId.value,
      endpoint,
      format,
      {
        ...filters.value,
        insight_id: insightId, // Include the insight ID
      },
    );

    toast('Export completed successfully');
  }
  catch (error) {
    console.error('Export failed:', error);
    toast('Export failed. Please try again.');
  }
  finally {
    isExporting.value = false;
  }
};

const currentGroupTickets = computed(() => {
  if (!ticketGroups.value || !activeTab.value)
    return [];

  const currentGroup = ticketGroups.value.find((group: TicketGroup) => group.name === activeTab.value);
  return currentGroup?.tickets || [];
});

const hasTickets = computed(() => currentGroupTickets.value.length > 0);

// Watch for changes in filters, pagination, and sorting, and update the route query
watch(
  [filters, pagination, sorting],
  ([newFilters, newPagination, newSorting]) => {
    const query = {
      group: newFilters.group.length > 0 ? newFilters.group : undefined,
      order: newSorting[0]?.desc ? 'desc' : 'asc',
      page: newPagination.pageIndex + 1 || undefined,
      perPage: newPagination.pageSize || undefined,
      search: newFilters.search || undefined,
      sortBy: newSorting[0]?.id || undefined,
    };
    router.push({ query });
  },
  { deep: true },
);

// Watch for route query changes to update filters
watch(
  () => route.query,
  (newQuery) => {
    filters.value = {
      ...filters.value,
      group: (newQuery.group as string) || '',
      search: (newQuery.search as string) || '',
    };
    table.getState().pagination.pageIndex = pagination.value.pageIndex;
    table.getState().pagination.pageSize = pagination.value.pageSize;
    pagination.value = {
      pageIndex: newQuery.page ? Number(newQuery.page) - 1 : 0,
      pageSize: newQuery.perPage ? Number(newQuery.perPage) : INITIAL_PAGE_SIZE,
    };
    sorting.value = [
      {
        desc: parseDesc((newQuery.order as string) || 'desc'),
        id: (newQuery.sortBy as string) || 'reg_date',
      },
    ];
  },
  { deep: true },
);
</script>

<template>
  <div class="container mx-auto">
    <header class="pt-5">
      <NuxtLink
        :to="`/event/${eventId}/insights`"
        class="inline-flex items-center space-x-1 pb-5 text-xs text-slate-500 hover:underline"
      >
        <Icon icon="heroicons-outline:arrow-left" class="size-3" />
        <span>Back to All Insights</span>
      </NuxtLink>
      <!-- subtitle -->
      <h2 class="font-medium text-slate-500">
        Insight
      </h2>
      <h1 class="h2 mb-5">
        {{ insightData?.title }}
      </h1>
    </header>
  </div>

  <section>
    <div class="container relative mx-auto">
      <div v-if="isMetaLoading" class="grid grid-cols-12 gap-4">
        <Skeleton v-for="i in 2" :key="i" class="col-span-12 h-28 rounded-xl bg-muted-foreground/10 md:col-span-6" />
      </div>
      <div
        v-else-if="ticketGroups"
        class="relative mx-auto flex w-full max-w-sm rounded-md bg-slate-200 p-1 dark:bg-slate-700/40 sm:mx-0"
      >
        <span class="pointer-events-none absolute inset-0 m-1" aria-hidden="true">
          <span
            class="absolute inset-0 rounded-md bg-white transition-transform duration-150 ease-in-out dark:bg-primary"
            :style="{ width: tabIndicatorWidth, transform: tabIndicatorClass }"
          />
        </span>
        <button
          v-for="(tab, index) in ticketGroups"
          :key="index"
          class="relative z-10 flex flex-1 items-center justify-center p-1 text-sm font-medium duration-150 ease-in-out"
          :class="tab.name === activeTab && 'text-slate-900 dark:text-slate-100'"
          @click.prevent="handleTabChange(tab.name)"
        >
          {{ tab.name }}
          <Badge
            v-if="tab.count"
            :variant="tab.name === activeTab ? 'default' : 'outline'"
            class="ml-2 flex h-6 min-w-6 shrink-0 scale-90 items-center justify-center rounded-full px-1.5 text-xs"
          >
            {{ tab.count }}
          </Badge>
        </button>
      </div>
    </div>
  </section>

  <section class="container mx-auto ">
    <div class="flex flex-col gap-2 p-4 sm:flex-row sm:items-end sm:justify-between sm:px-8">
      <div class="w-full grow sm:w-auto">
        <h3>
          Group:
          <span class="font-semibold text-slate-950 dark:text-slate-200">
            {{ activeTab }}
          </span>
        </h3>

        <div class="mt-2 flex flex-col gap-2 sm:flex-row sm:items-start">
          <div>Tickets:</div>
          <template v-if="ticketGroups">
            <!-- Show actual tickets if they exist -->
            <ul v-if="hasTickets" class="flex max-w-xl flex-wrap items-center gap-2">
              <li
                v-for="ticket in currentGroupTickets"
                :key="ticket.id"
                class="inline-flex items-center gap-x-1 rounded-lg border border-slate-300 px-2 py-1 text-sm font-medium dark:border-slate-600 dark:text-slate-300"
              >
                <Icon icon="tabler:ticket" class="size-4 text-slate-500 dark:text-slate-400" />
                <span>{{ ticket.name }}</span>
              </li>
            </ul>
            <!-- Fallback when no tickets -->
            <li
              v-if="!hasTickets"
              class="inline-flex shrink-0 items-center gap-x-1 rounded-lg border border-slate-300 px-2 py-1 text-sm font-medium text-slate-500 dark:border-slate-600 dark:text-slate-400"
            >
              <Icon icon="tabler:ticket" class="size-4 text-slate-500 dark:text-slate-400" />
              <span>All Tickets</span>
            </li>
          </template>
        </div>
      </div>

      <div class="shrink-0">
        <DropdownMenu v-if="!isMetaLoading && !isDataLoading">
          <DropdownMenuTrigger as-child>
            <Button variant="outline" class="bg-card" :disabled="isExporting">
              <Icon
                :icon="isExporting ? 'svg-spinners:ring-resize' : 'heroicons:arrow-right-start-on-rectangle'"
                class="mr-2 size-5 text-muted-foreground"
              />
              {{ isExporting ? 'Exporting...' : 'Export' }}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem :disabled="isExporting" @click="handleExport('csv')">
              <Icon icon="ph:file-csv" class="mr-2 size-5 text-muted-foreground" />
              Export to CSV
            </DropdownMenuItem>
            <DropdownMenuItem :disabled="isExporting" @click="handleExport('xlsx')">
              <Icon icon="ph:file-xls" class="mr-2 size-5 text-muted-foreground" />
              Export to XLSX
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  </section>

  <section>
    <div
      class="flex min-h-12 w-full flex-col items-center justify-between gap-2 bg-slate-50 px-4 py-2 dark:bg-slate-950 sm:flex-row sm:px-6 sm:py-2"
    >
      <div class="w-full sm:w-auto">
        <TableSearchForm v-model="filters.search" placeholder="Search Registrant..." />
      </div>

      <div v-if="!isMetaLoading && !isDataLoading" class="number shrink-0 text-sm text-slate-500">
        <template v-if="totalData">
          Found
          <span class="font-semibold text-slate-900 dark:text-slate-300">{{ formatThousands(totalData) }}</span>
          results.
        </template>
        <div v-else>
          No data found.
        </div>
      </div>
    </div>
  </section>

  <section class="relative" :class="{ 'scroll-area overflow-x-auto': !isDataLoading }">
    <div class="w-full">
      <div :style="{ minWidth: `${calculateMinWidth(toRef(columnConfigs), totalData)}px` }">
        <template v-if="isDataLoading">
          <div class="absolute z-10 size-full bg-card/10 ring-0" />
        </template>
        <table class="relative w-full bg-white dark:bg-transparent dark:text-slate-300/90">
          <thead
            class="border-y border-slate-200 bg-slate-100 text-xs uppercase dark:border-slate-900/50 dark:bg-slate-800/50 dark:text-slate-400"
          >
            <tr v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
              <th
                v-for="header in headerGroup.headers"
                :key="header.id"
                :colSpan="header.colSpan"
                :style="{
                  minWidth: `${header.column.columnDef.size ?? 20}px`,
                }"
                class="whitespace-nowrap px-2 py-3 text-xs text-slate-500 first:pl-5 last:pr-5 hover:bg-blue-200/20 dark:text-slate-400 dark:hover:bg-slate-900/50"
                :class="{
                  'bg-blue-200/20 text-blue-600 dark:bg-slate-800/50': header.column.getIsSorted(),
                  'cursor-pointer select-none': header.column.getCanSort(),
                }"
                @click="header.column.getCanSort() ? header.column.getToggleSortingHandler()?.($event) : null"
              >
                <template v-if="!header.isPlaceholder">
                  <div class="relative">
                    <FlexRender :render="header.column.columnDef.header" :props="header.getContext()" />
                    <span class="absolute right-0 text-blue-500 dark:text-slate-300">
                      <span>
                        {{ { asc: '↑', desc: '↓' }[header.column.getIsSorted() as string] }}
                      </span>
                    </span>
                  </div>
                </template>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 border-b text-sm dark:divide-slate-800 2xl:text-sm">
            <template v-if="!table.getRowModel().rows.length">
              <template v-if="isDataLoading">
                <tr v-for="index in 10" :key="index">
                  <td v-for="(column, index2) in columns" :key="index2" class="p-2">
                    <Skeleton class="h-6 w-full rounded" />
                  </td>
                </tr>
              </template>
              <tr v-else>
                <td colspan="10" class="py-10 text-center">
                  <EmptyState
                    title="No data found"
                    description="There are no registrations matching your criteria."
                    :img="{ src: '/images/empty-state/empty-c.svg' }"
                    :cta="{ label: 'Clear Filters', action: handleResetFilters, icon: 'heroicons:arrow-path-solid' }"
                  />
                </td>
              </tr>
            </template>
            <tr
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              class="hover:bg-slate-50 dark:hover:bg-slate-950/20"
            >
              <td
                v-for="cell in row.getVisibleCells()"
                :key="cell.id"
                class="number px-2 py-3 text-center first:pl-5 last:pr-5"
                :class="{
                  'bg-blue-50/50 text-slate-600 dark:bg-slate-600/20 dark:text-slate-300': cell.column.getIsSorted(),
                }"
              >
                <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
  <TablePagination
    v-if="table.getRowModel().rows.length > 0"
    :current-page="table.getState().pagination.pageIndex + 1"
    :page-count="table.getPageCount()"
    :page-sizes="pageSizes"
    :page-size="table.getState().pagination.pageSize"
    :total-data="totalData"
    @update:page-size="handlePageSizeChange"
    @update:current-page="handleNavigation"
  />
</template>
