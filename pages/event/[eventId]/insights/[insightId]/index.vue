<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  FlexRender,
  getCoreRowModel,
  useVueTable,
  createColumnHelper,
  type SortingState,
  type PaginationState,
} from '@tanstack/vue-table';
import { useInsight } from '@/composables/useInsight';
import { fromUnixTime, format } from 'date-fns';
import { formatThousands } from '@/utils';
import { Icon } from '@iconify/vue';

import type { Reg, ColumnConfig } from '@/types';
import TablePagination from '@/components/TablePagination.vue';
import { Badge } from '@/components/ui/badge';
import NoData from '@/components/partials/registrations/NoData.vue';
import { exportToCSV, exportToXLSX } from '@/lib/export-data';

interface TicketGroup {
  id: string;
  name: string;
  tickets: TicketList[];
  count: number;
}

interface TicketList {
  id: string;
  name: string;
}

interface CustomField {
  key: string;
  label: string;
  slug: string;
}

interface Answer {
  qst_id: number;
  qst: string;
  ans: string;
}

useHead({
  title: 'Insight',
});

definePageMeta({
  title: 'Insight',
  showInMenu: false,
  order: 1,
  icon: 'solar:users-group-two-rounded-bold-duotone',
  group: 'reports',
  requiresSelectedEvent: true,
  packages: ['smart', 'optima'],
  roles: ['administrator', 'ee_event_organizer', 'ee_event_operator'],
  capabilities: ['ee_read_insights'],
  layout: 'dashboard-with-sidebar',
});

const props = defineProps<{
  search?: string;
  group?: string;
  page?: string;
  perPage?: string;
  sortBy?: string;
  order?: string;
}>();

const { search, group, page, perPage, sortBy, order } = toRefs(props);

const route = useRoute();
const router = useRouter();

const { event } = useEvent();
const eventId = computed(() => event.value?.id);
const insightId = route.params.insightId as string;

// Pagination configs
const INITIAL_PAGE_SIZE = 10;
const pageSizes: (number | string)[] = [10, 20, 30, 40, 50];

// Safely extract and use query parameters with type assertion
const pagination = ref<PaginationState>({
  pageIndex: page.value ? Number(page.value) - 1 : 0,
  pageSize: perPage.value ? Number(perPage.value) : INITIAL_PAGE_SIZE,
});

const filters = ref({
  search: search.value || '',
  group: group.value || '',
});

// Define parseDesc to accept a string and return a boolean
const parseDesc = (order: string): boolean => order.toLowerCase() === 'desc';
const sorting = ref<SortingState>([
  {
    id: sortBy.value || 'code',
    desc: parseDesc(order.value || 'asc'),
  },
]);

const {
  insightData,
  regData,
  ticketGroups,
  fetchAllData,
  totalData,
  totalPages,
  isMetaLoading,
  isDataLoading,
  metaError,
  dataError,
} = useInsight(eventId, insightId, pagination, sorting, filters);

// Table configuration
const columnConfigs = computed<ColumnConfig[]>(() => {
  const baseColumns = [
    {
      key: 'date',
      header: 'Date',
      isVisible: false,
      isHideable: true,
      width: 10,
    },
    {
      key: 'code',
      header: 'Reg Code',
      isVisible: true,
      isHideable: false,
      width: 10,
    },
    {
      key: 'fullname',
      header: 'Full Name',
      isVisible: true,
      isHideable: false,
      width: 20,
    },
    {
      key: 'ticket_name',
      header: 'Ticket',
      isVisible: false,
      isHideable: true,
      width: 15,
    },
    {
      key: 'email',
      header: 'Email',
      isVisible: true,
      isHideable: true,
      width: 15,
    },
    {
      key: 'phone',
      header: 'Phone',
      isVisible: true,
      isHideable: true,
      width: 15,
    },
  ];

  const customFields = getCustomFieldsColumns(insightData.value?.fields ?? []);
  return [...baseColumns, ...customFields];
});

// Define columns
const columnHelper = createColumnHelper<Reg>();
const columns = computed(() => {
  return columnConfigs.value
    .filter((config) => config.isVisible)
    .map((config) => {
      return columnHelper.accessor(
        (row: Reg) => {
          // Handle custom fields by checking if there's an accessor function
          if (config.accessor) {
            return config.accessor(row);
          }
          // Handle regular fields
          return row[config.key as keyof Reg];
        },
        {
          id: config.key,
          header: config.header,
          size: config.width * 10,
          cell: (cellProps: any) => {
            // Here you can add specific cell rendering logic based on the column key
            switch (config.key) {
              case 'date':
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
                      format(date, 'hh:mm')
                    ),
                  ]
                );
              case 'code':
                const stt_id = cellProps.row.original.stt_id;
                return h(
                  'span',
                  {
                    class: `text-status ${getStatusInfo(stt_id).color}`,
                  },
                  cellProps.getValue()
                );
              case 'fullname':
                return h(
                  'div',
                  {
                    class: 'font-semibold text-left text-slate-700 dark:text-slate-300 w-full',
                  },
                  cellProps.getValue()
                );
              default:
                return h('div', { class: 'text-left' }, cellProps.getValue());
            }
          },
        }
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
  get pageCount() {
    return totalPages.value ?? -1;
  },
  state: {
    pagination: pagination.value,
    get sorting() {
      return sorting.value;
    },
  },
  manualPagination: true,
  manualSorting: true,
  manualFiltering: true,
  enableMultiSort: false,
  onPaginationChange: (updater) => {
    if (typeof updater === 'function') {
      setPagination(
        updater({
          pageIndex: pagination.value.pageIndex,
          pageSize: pagination.value.pageSize,
        })
      );
    } else {
      setPagination(updater);
    }
  },
  onSortingChange: (updater) => {
    if (typeof updater === 'function') {
      setSorting(updater(sorting.value));
    } else {
      setSorting(updater);
    }
  },
  getCoreRowModel: getCoreRowModel(),
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
  return fields.map((field) => ({
    key: field.slug,
    header: field.label,
    isVisible: true,
    isHideable: true,
    width: 10,
    // Add accessor function to get the answer value
    accessor: (row: Reg) => {
      const answer = row.ans?.find((a: Answer) => a.qst === field.label);
      return answer?.ans || '';
    },
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

function calculateMinWidth(): number {
  const totalWidth = columnConfigs.value
    .filter((config) => config.isVisible)
    .reduce((total, config) => total + config.width * 15, 0); // Multiply by a factor to get reasonable width

  // Return the greater of the calculated width or minimum width (e.g., 1000px)
  return Math.max(totalWidth, 1000);
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
    search: '',
    group: ticketGroups.value?.[0]?.name || '', // Reset to first group
  };

  pagination.value = {
    pageIndex: 0,
    pageSize: INITIAL_PAGE_SIZE,
  };

  sorting.value = [
    {
      id: 'date',
      desc: true,
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

function formatExportData(data: Reg[]) {
  return data.map((row) => {
    const formattedRow: { [key: string]: any } = {
      Date: format(fromUnixTime(Number(row.date)), 'dd MMM yyyy HH:mm'),
      'Reg Code': row.code,
      'Full Name': row.fullname,
      Ticket: row.ticket_name,
      Email: row.email,
      Phone: row.phone,
    };

    // Add custom fields
    row.ans?.forEach((answer: Answer) => {
      formattedRow[answer.qst] = answer.ans;
    });

    return formattedRow;
  });
}

const isExporting = ref(false);

async function handleExport(type: 'csv' | 'xlsx') {
  if (!insightData.value) return;

  try {
    isExporting.value = true;

    // Fetch all data
    const allData = await fetchAllData();

    // Format the data
    const formattedData = formatExportData(allData);
    const filename = `${insightData.value.title || 'export'}_${format(new Date(), 'yyyy-MM-dd')}`;

    if (type === 'csv') {
      exportToCSV(formattedData, filename);
    } else {
      exportToXLSX(formattedData, filename);
    }
  } catch (error) {
    console.error('Export failed:', error);
    // You might want to show an error message to the user
  } finally {
    isExporting.value = false;
  }
}

// Watch for changes in filters, pagination, and sorting, and update the route query
watch(
  [filters, pagination, sorting],
  ([newFilters, newPagination, newSorting]) => {
    const query = {
      search: newFilters.search || undefined,
      group: newFilters.group.length > 0 ? newFilters.group : undefined,
      page: newPagination.pageIndex + 1 || undefined,
      perPage: newPagination.pageSize || undefined,
      sortBy: newSorting[0]?.id || undefined,
      order: newSorting[0]?.desc ? 'desc' : 'asc',
    };
    router.push({ query });
  },
  { deep: true }
);

// Watch for route query changes to update filters
watch(
  () => route.query,
  (newQuery) => {
    filters.value = {
      ...filters.value,
      search: (newQuery.search as string) || '',
      group: (newQuery.group as string) || '',
    };
    table.getState().pagination.pageIndex = pagination.value.pageIndex;
    table.getState().pagination.pageSize = pagination.value.pageSize;
    pagination.value = {
      pageIndex: newQuery.page ? Number(newQuery.page) - 1 : 0,
      pageSize: newQuery.perPage ? Number(newQuery.perPage) : INITIAL_PAGE_SIZE,
    };
    sorting.value = [
      {
        id: (newQuery.sortBy as string) || 'reg_date',
        desc: parseDesc((newQuery.order as string) || 'desc'),
      },
    ];
  },
  { deep: true }
);
</script>

<template>
  <div class="container mx-auto 2xl:mx-0">
    <header class="pt-5">
      <NuxtLink
        :to="`/event/${eventId}/insights`"
        class="pb-5 inline-flex hover:underline text-xs items-center space-x-1 text-slate-500"
      >
        <Icon icon="heroicons-outline:arrow-left" class="w-3 h-3" />
        <span>Back to All Insights</span>
      </NuxtLink>
      <!-- subtitle -->
      <h2 class="text-slate-500 font-medium">Insight</h2>
      <h1 class="h2 mb-5">{{ insightData?.title }}</h1>
    </header>
  </div>

  <section>
    <div class="container mx-auto 2xl:mx-0 relative">
      <div v-if="isMetaLoading" class="grid gap-4 grid-cols-12">
        <Skeleton v-for="i in 2" class="h-28 rounded-xl col-span-12 md:col-span-6 bg-muted-foreground/10" />
      </div>
      <div
        class="relative flex w-full max-w-sm p-1 bg-slate-200 dark:bg-slate-700/40 rounded-md mx-auto sm:mx-0"
        v-else-if="ticketGroups"
      >
        <span class="absolute inset-0 m-1 pointer-events-none" aria-hidden="true">
          <span
            class="absolute inset-0 bg-white dark:bg-slate-950/70 rounded-md transition-transform duration-150 ease-in-out"
            :style="{ width: tabIndicatorWidth, transform: tabIndicatorClass }"
          ></span>
        </span>
        <button
          v-for="(tab, index) in ticketGroups"
          :key="index"
          class="relative flex-1 justify-center items-center z-10 flex text-sm font-medium p-1 duration-150 ease-in-out"
          :class="tab.name === activeTab && 'text-slate-900 dark:text-slate-100'"
          @click.prevent="handleTabChange(tab.name)"
        >
          {{ tab.name }}
          <Badge
            v-if="tab.count"
            :variant="tab.name === activeTab ? 'default' : 'outline'"
            class="ml-2 scale-90 flex text-xs h-6 min-w-6 px-1.5 shrink-0 items-center justify-center rounded-full"
          >
            {{ tab.count }}
          </Badge>
        </button>
      </div>
    </div>
  </section>

  <section>
    <div class="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between sm:px-8">
      <div class="shrink-0">
        <h3>
          Group:
          <span class="font-semibold text-slate-950 dark:text-slate-200">
            {{ activeTab }}
          </span>
        </h3>

        <ul class="flex flex-wrap gap-2 items-start" v-if="ticketGroups">
          <li>Tickets:</li>
          <li
            v-for="ticket in ticketGroups.find((group: TicketGroup) => group.name === activeTab)?.tickets"
            :key="ticket.id"
            class="text-xs border border-slate-300 rounded-lg font-medium px-2 py-1 dark:text-slate-300 dark:border-slate-600"
          >
            {{ ticket.name }}
          </li>
        </ul>
      </div>

      <DropdownMenu v-if="!isMetaLoading && !isDataLoading">
        <DropdownMenuTrigger as-child>
          <Button variant="outline" class="bg-card" :disabled="isExporting">
            <Icon
              :icon="isExporting ? 'svg-spinners:ring-resize' : 'heroicons:arrow-right-start-on-rectangle'"
              class="text-muted-foreground w-5 h-5 mr-2"
            />
            {{ isExporting ? 'Exporting...' : 'Export' }}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem @click="handleExport('csv')" :disabled="isExporting">
            <Icon icon="ph:file-csv" class="text-muted-foreground w-5 h-5 mr-2" />
            Export to CSV
          </DropdownMenuItem>
          <DropdownMenuItem @click="handleExport('xlsx')" :disabled="isExporting">
            <Icon icon="ph:file-xls" class="text-muted-foreground w-5 h-5 mr-2" />
            Export to XLSX
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </section>

  <section>
    <div
      class="flex flex-col justify-between items-center min-h-12 w-full gap-2 bg-slate-50 px-4 py-2 sm:flex-row sm:px-6 sm:py-2 dark:bg-slate-950"
    >
      <div class="">
        <TableSearchForm v-model="filters.search" placeholder="Search Registrant..." />
      </div>

      <div v-if="!isMetaLoading && !isDataLoading" class="number shrink-0 text-slate-500 text-sm">
        <template v-if="totalData"
          >Found
          <span class="font-semibold text-slate-900 dark:text-slate-300">{{ formatThousands(totalData) }}</span>
          results.</template
        >
        <div v-else>No data found.</div>
      </div>
    </div>
  </section>

  <section class="relative" :class="{ 'overflow-x-auto scroll-area': !isDataLoading }">
    <div class="w-full">
      <div :style="{ minWidth: `${calculateMinWidth()}px` }">
        <template v-if="isDataLoading">
          <div class="absolute z-10 h-full w-full bg-card/10 ring-0"></div>
        </template>
        <table class="relative w-full bg-white dark:bg-transparent dark:text-slate-300/90">
          <thead
            class="border-b border-t border-slate-200 bg-slate-100 text-xs uppercase dark:border-slate-900/50 dark:bg-slate-800/50 dark:text-slate-400"
          >
            <tr v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
              <th
                v-for="header in headerGroup.headers"
                :key="header.id"
                :colSpan="header.colSpan"
                :style="{
                  minWidth: `${header.column.columnDef.size ?? 20}px`,
                }"
                class="whitespace-nowrap px-2 py-3 text-slate-500 dark:text-slate-400 hover:bg-blue-200/20 dark:hover:bg-slate-900/50 first:pl-5 last:pr-5 text-xs"
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
          <tbody class="divide-y divide-slate-200 text-sm 2xl:text-sm dark:divide-slate-800 border-b">
            <template v-if="!table.getRowModel().rows.length">
              <tr v-if="isDataLoading" v-for="index in 10" :key="index">
                <td v-for="column in columns" :key="index" class="px-2 py-2">
                  <Skeleton class="w-full h-6 rounded" />
                </td>
              </tr>
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
                  'text-slate-600 bg-blue-50/50 dark:bg-slate-600/20 dark:text-slate-300': cell.column.getIsSorted(),
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
    :currentPage="table.getState().pagination.pageIndex + 1"
    :pageCount="table.getPageCount()"
    :pageSizes="pageSizes"
    :pageSize="table.getState().pagination.pageSize"
    :totalData="totalData"
    @update:pageSize="handlePageSizeChange"
    @update:currentPage="handleNavigation"
  />
</template>
