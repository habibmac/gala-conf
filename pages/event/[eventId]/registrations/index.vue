<script setup lang="ts">
import { ref, computed, h, watch, toRefs } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { fromUnixTime, format } from 'date-fns';
import {
  FlexRender,
  getCoreRowModel,
  useVueTable,
  createColumnHelper,
  type SortingState,
  type PaginationState,
} from '@tanstack/vue-table';

import { useRegs } from '@/composables/useRegs';
import { formatThousands, getStatusInfo } from '@/utils';
import type { Reg, Filter, ColumnConfig } from '@/types';

import RegCards from '@/components/partials/registrations/RegCards.vue';
import DropdownTicketFilter from '@/components/DropdownTicketFilter.vue';
import DropdownStatusFilter from '@/components/DropdownStatusFilter.vue';
import DropdownTableFilter from '~/components/DropdownColumnFilter.vue';
import TableSearchForm from '@/components/TableSearchForm.vue';
import TablePagination from '@/components/TablePagination.vue';
import TableStatusTooltip from '@/components/TableStatusTooltip.vue';
import TransactionPanel from '@/components/partials/registrations/TransactionPanel.vue';
import TableResetBtn from '@/components/TableResetBtn.vue';
import Datepicker from '@/components/Datepicker.vue';

useHead({
  title: 'Registrations',
});

definePageMeta({
  title: 'Registrations',
  showInMenu: true,
  order: 1,
  icon: 'solar:users-group-two-rounded-bold-duotone',
  group: 'reports',
  layout: 'dashboard-with-sidebar',
  requiresSelectedEvent: true,
  packages: ['starter', 'smart', 'optima'],
  roles: ['administrator', 'ee_event_organizer', 'ee_event_operator'],
  capabilities: ['ee_read_registrations'],
});

const props = defineProps<{
  search?: string;
  ticketName?: string;
  status?: string;
  dateStart?: string;
  dateEnd?: string;
  page?: string;
  perPage?: string;
  sortBy?: string;
  order?: string;
  detail?: string;
}>();

const { search, ticketName, status, dateStart, dateEnd, page, perPage, sortBy, order, detail } = toRefs(props);

const { event } = useEvent();
const eventId = computed(() => event.value?.id);

const route = useRoute();
const router = useRouter();

const endpoint = 'registrations';

// Selected registration ID and details panel state
const selectedRegId = ref<string>((route.query.details as string) || '');

// Pagination configs
const INITIAL_PAGE_SIZE = 10;
const pageSizes: (number | string)[] = [10, 20, 30, 40, 50];

// Table configurations
const columnConfigs = ref<ColumnConfig[]>([
  {
    key: 'date',
    header: 'Date',
    isVisible: true,
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
    isVisible: true,
    isHideable: true,
    width: 15,
  },
  {
    key: 'ticket_price',
    header: 'Price',
    isVisible: true,
    isHideable: true,
    width: 10,
  },
  {
    key: 'paid',
    header: 'Paid',
    isVisible: true,
    isHideable: true,
    width: 10,
  },
  {
    key: 'status',
    header: 'Status',
    isVisible: true,
    isHideable: false,
    width: 10,
  },
  {
    key: 'email',
    header: 'Email',
    isVisible: false,
    isHideable: true,
    width: 15,
  },
  {
    key: 'phone',
    header: 'Phone',
    isVisible: false,
    isHideable: true,
    width: 15,
  },
  // Add more columns as needed
]);

// Safely extract and use query parameters with type assertion
const pagination = ref<PaginationState>({
  pageIndex: page.value ? Number(page.value) - 1 : 0,
  pageSize: perPage.value ? Number(perPage.value) : INITIAL_PAGE_SIZE,
});

const filters = ref<Filter>({
  search: search.value ? String(search.value) : '',
  ticket_name: ticketName.value ? [String(ticketName.value)] : [],
  status: status.value ? [String(status.value)] : [], // Initialize as an array
  date_start: dateStart.value ? String(dateStart.value) : '',
  date_end: dateEnd.value ? String(dateEnd.value) : '',
});

// Define parseDesc to accept a string and return a boolean
const parseDesc = (order: string): boolean => order.toLowerCase() === 'desc';
const sorting = ref<SortingState>([
  {
    id: sortBy.value || 'date',
    desc: parseDesc(order.value || 'desc'),
  },
]);

// Define columns
const columnHelper = createColumnHelper<Reg>();
const columns = computed(() => {
  return columnConfigs.value
    .filter((config) => config.isVisible)
    .map((config) => {
      return columnHelper.accessor(config.key, {
        header: config.header,
        size: config.width * 10,
        cell: (cellProps) => {
          // Here you can add specific cell rendering logic based on the column key
          switch (config.key) {
            case 'date': {
              const date = fromUnixTime(Number(cellProps.getValue()));
              return h(
                'div',
                {
                  class: 'text-right text-slate-900 dark:text-slate-300 text-xs xl:text-sm',
                },
                [
                  h('div', { class: 'whitespace-nowrap' }, format(date, 'd MMM yyyy')),
                  h(
                    'div',
                    {
                      class: 'text-xs text-slate-400 dark:text-slate-600',
                    },
                    format(date, 'hh:mm')
                  ),
                ]
              );
            }
            case 'code': {
              const stt_id = cellProps.row.original.stt_id;
              // Add new query parameters to the existing query
              const newParams = {
                ...route.query,
                details: cellProps.row.original.id,
              };
              return h(
                'a',
                {
                  href: `/event/${eventId.value}/${endpoint}?${new URLSearchParams(newParams).toString()}`,
                  class: 'number text-center group inline-block whitespace-nowrap',
                  onClick: (e: Event) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleOpenDetails(cellProps.row.original.id);
                  },
                },
                h(
                  'span',
                  {
                    class: `text-status group-hover:underline ${getStatusInfo(stt_id).color}`,
                  },
                  cellProps.getValue()
                )
              );
            }
            case 'fullname':
              return h(
                'div',
                {
                  class: 'font-semibold text-left text-slate-700 dark:text-slate-300 w-full',
                },
                cellProps.getValue()
              );
            case 'ticket_name':
              return h(
                'div',
                {
                  class: 'text-left',
                },
                cellProps.getValue()
              );

            case 'ticket_price':
            case 'paid':
              return h(
                'div',
                {
                  class: 'text-right pr-4',
                },
                formatThousands(Number(cellProps.getValue()))
              );
            case 'status':
              return h(
                TableStatusTooltip,
                {
                  status: cellProps.row.original.stt_id,
                  size: 'sm',
                  position: 'top',
                },
                {
                  default: () => cellProps.getValue(),
                }
              );
            default:
              return h('div', { class: 'text-left' }, cellProps.getValue());
          }
        },
      });
    });
});

// Fetch data from the API
const { regData, isLoading, totalPages, totalData } = useRegs(eventId, endpoint, pagination, sorting, filters);

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

function handleSetDateRange(dateRange: [Date | null, Date | null] | null) {
  if (dateRange === null) {
    // Reset date range
    filters.value.date_start = '';
    filters.value.date_end = '';
  } else {
    const [start, end] = dateRange;
    if (!start || !end) {
      // Additional safety check if needed
      filters.value.date_start = '';
      filters.value.date_end = '';
    } else {
      // Format to yyyy-MM-dd
      filters.value.date_start = format(start, 'yyyy-MM-dd');
      filters.value.date_end = format(end, 'yyyy-MM-dd');
    }
  }
}

const dateRange = computed({
  get: () => {
    if (filters.value.date_start === '' || filters.value.date_end === '') {
      // Return null to signify "All Time" to VueDatePicker
      return null;
    }
    return [new Date(filters.value.date_start), new Date(filters.value.date_end)];
  },
  set: (newValue) => {
    if (newValue === null) {
      // User clears the date range, set to "All Time"
      filters.value.date_start = '';
      filters.value.date_end = '';
    } else {
      // User selects a new date range
      [filters.value.date_start, filters.value.date_end] = newValue.map((date) =>
        // Format to yyyy-MM-dd hh:mm
        format(date, 'yyyy-MM-dd')
      );
    }
  },
});

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

const handleOpenDetails = (id: string) => {
  selectedRegId.value = id; // Update the selected registration ID
};

const handleCloseDetails = () => {
  selectedRegId.value = ''; // Reset the selected registration ID
  const currentQuery = { ...route.query };
  delete currentQuery.details; // Remove the `details` query parameter
};

const isAnyFilterActive = computed(() => {
  // Check if any filter is active
  return (
    filters.value.search ||
    filters.value.ticket_name.length > 0 ||
    filters.value.status.length > 0 ||
    filters.value.date_start ||
    filters.value.date_end
  );
});

// Reset filters, sorting, and pagination to their initial state
const handleResetFilters = () => {
  filters.value = {
    search: '',
    ticket_name: [],
    status: [],
    date_start: '',
    date_end: '',
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

const totalVisibleWidth = computed(() => {
  const baseWidth = 100; // minimum width percentage
  const visibleWidth = columnConfigs.value
    .filter((config) => config.isVisible)
    .reduce((total, config) => total + config.width, 0);

  // Always return at least 100%, but expand if visible columns need more space
  return Math.max(baseWidth, visibleWidth);
});

// Watch for changes in filters, pagination, and sorting, and update the route query
watch(
  [filters, pagination, sorting, selectedRegId],
  ([newFilters, newPagination, newSorting]) => {
    const query = {
      search: newFilters.search || undefined,
      ticket: newFilters.ticket_name.length > 0 ? newFilters.ticket_name : undefined,
      status: newFilters.status.length > 0 ? newFilters.status : undefined,
      dateStart: newFilters.date_start || undefined,
      dateEnd: newFilters.date_end || undefined,
      page: newPagination.pageIndex + 1 || undefined,
      perPage: newPagination.pageSize || undefined,
      sortBy: newSorting[0]?.id || undefined,
      order: newSorting[0]?.desc ? 'desc' : 'asc',
      details: selectedRegId.value || undefined,
    };
    router.push({ query });
  },
  { deep: true }
);

watch(selectedRegId, () => {
  const newQuery = { ...route.query };
  if (selectedRegId.value) {
    newQuery.details = selectedRegId.value;
  } else {
    delete newQuery.details;
  }
  router.push({ query: newQuery });
});

// Open the details panel when the route query changes
watch(
  () => route.query.details,
  (newDetails) => {
    selectedRegId.value = (newDetails as string) || '';
  },
  { immediate: true }  // This ensures it runs on component mount
);

// Watch for changes in the route query and update the filters ref
watch(
  () => route.query,
  (newQuery) => {
    filters.value = {
      search: (newQuery.search as string) || '',
      ticket_name: Array.isArray(newQuery.ticket)
        ? (newQuery.ticket as string[])
        : newQuery.ticket
          ? [newQuery.ticket as string]
          : [],
      status: Array.isArray(newQuery.status)
        ? (newQuery.status as string[])
        : newQuery.status
          ? [newQuery.status as string]
          : [],
      date_start: (newQuery.dateStart as string) || '',
      date_end: (newQuery.dateEnd as string) || '',
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
    selectedRegId.value = (newQuery.details as string) || '';
  },
  { deep: true }
);
</script>

<template>
  <div class="container mx-auto 2xl:mx-0">
    <header class="pt-10 mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <h1 class="h2">Registrations</h1>
      <div class="flex shrink-0 space-x-2 justify-self-end">
        <div class="min-w-64 grow">
          <!-- Datepicker -->
          <Datepicker :date-range="dateRange" @update:date-range="handleSetDateRange" />
        </div>
      </div>
    </header>
    <RegCards />
  </div>

  <section>
    <!-- Search and filter -->
    <div class="container 2xl:mx-0 py-4">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <!-- Left: Avatars -->
        <div class="flex flex-col space-y-2 sm:gap-2 sm:grid sm:grid-flow-col sm:space-y-0">
          <TableSearchForm v-model="filters.search" placeholder="Search Registrant..." />
          <DropdownTicketFilter v-model="filters.ticket_name" />
          <DropdownStatusFilter v-model="filters.status" />
          <TableResetBtn v-if="isAnyFilterActive" @click.prevent="handleResetFilters" />
        </div>
        <!-- Right: Actions -->
        <div class="flex shrink-0 space-x-2 justify-self-end">
          <DropdownTableFilter v-model="columnConfigs" />
        </div>
      </div>
    </div>
  </section>

  <section class="bg-slate-50 dark:bg-slate-900/60">
    <div class="container 2xl:mx 2xl:max-w-none">
      <div
        class="flex justify-between items-center min-h-12 w-full gap-2 py-3 sm:flex-row sm:py-3"
        :class="[isAnyFilterActive ? 'flex-col items-start' : 'flex-row items-center justify-between']"
      >
        <h3 class="shrink-0">
          <span v-if="isAnyFilterActive" class="font-semibold text-slate-950 dark:text-slate-300"
            >Filtered Registrations
          </span>
          <span v-else class="font-semibold text-slate-950 dark:text-slate-200">All Registrations</span>
        </h3>
        <div v-if="!isLoading" class="number shrink-0 text-slate-500 text-sm">
          <template v-if="totalData"
            >Found
            <span class="font-semibold text-slate-900 dark:text-slate-300">{{ formatThousands(totalData) }}</span>
            results.</template
          >
          <div v-else>No data found.</div>
        </div>
      </div>
    </div>
  </section>

  <section class="relative" :class="{ 'overflow-x-scroll': regData && regData.length > 0 }">
    <template v-if="isLoading && !regData">
      <div class="absolute z-10 h-full w-full ring-0" />
    </template>
    <div :style="{ width: regData && regData.length > 0 ? `${totalVisibleWidth}%` : `100%` }">
      <table class="relative w-full bg-white dark:bg-transparent dark:text-slate-300/90">
        <thead
          class="border-b border-t border-slate-200 bg-slate-100 text-xs uppercase dark:border-slate-900/50 dark:bg-slate-800/50 dark:text-slate-400"
        >
          <template v-if="isLoading || (regData && regData.length > 0)">
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
          </template>
        </thead>
        <tbody class="text-sm 2xl:text-base border-b">
          <template v-if="!table.getRowModel().rows.length">
            <template v-if="isLoading">
              <tr v-for="index in 10" :key="index">
                <td v-for="(column, index2) in columns" :key="index2" class="px-2 py-2">
                  <Skeleton class="w-full h-6 rounded" />
                </td>
              </tr>
            </template>
            <tr v-else>
              <td colspan="10" class="py-10 text-center">
                <EmptyState
                  title="No data found"
                  description="There are no registrations matching your criteria."
                  :img="{ src: '/images/empty-state/empty-c.svg', class: 'w-28' }"
                  :cta="{ label: 'Clear Filters', action: handleResetFilters, icon: 'heroicons:arrow-path-solid' }"
                />
              </td>
            </tr>
          </template>
          <template v-else>
            <tr
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              class="divide-y divide-slate-200 dark:divide-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950/20"
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
          </template>
        </tbody>
      </table>
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
  <div v-else class="h-40" />
  <TransactionPanel
    :transaction-panel-open="selectedRegId !== ''"
    :evt-id="eventId"
    :reg-id="selectedRegId ? selectedRegId : undefined"
    @close-transactionpanel="handleCloseDetails"
  />
</template>
