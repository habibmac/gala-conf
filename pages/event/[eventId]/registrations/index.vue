<script setup lang="ts">
import type { PaginationState, SortingState } from '@tanstack/vue-table';

import {
  createColumnHelper,
  FlexRender,
  getCoreRowModel,
  useVueTable,
} from '@tanstack/vue-table';
import { format, fromUnixTime } from 'date-fns';
import { computed, h, ref, toRefs, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import type { ColumnConfig, Filter, Reg } from '@/types';

import Datepicker from '@/components/Datepicker.vue';
import DropdownStatusFilter from '@/components/DropdownStatusFilter.vue';
import DropdownTicketFilter from '@/components/DropdownTicketFilter.vue';
import RegCards from '@/components/partials/registrations/RegCards.vue';
import RegDetails from '@/components/partials/registrations/RegDetails.vue';
import TablePagination from '@/components/TablePagination.vue';
import TableResetBtn from '@/components/TableResetBtn.vue';
import TableSearchForm from '@/components/TableSearchForm.vue';
import TableStatusTooltip from '@/components/TableStatusTooltip.vue';
import { useRegs } from '@/composables/useRegs';
import { calculateMinWidth, formatThousands, getStatusInfo } from '@/utils';
import DropdownTableFilter from '~/components/DropdownColumnFilter.vue';

const props = defineProps<{
  search?: string
  ticketName?: string
  status?: string
  dateStart?: string
  dateEnd?: string
  page?: string
  perPage?: string
  sortBy?: string
  order?: string
  detail?: string
}>();

useHead({
  title: 'Registrations',
});

definePageMeta({
  capabilities: ['ee_read_registrations'],
  group: 'reports',
  icon: 'solar:users-group-two-rounded-bold-duotone',
  layout: 'dashboard-with-sidebar',
  order: 1,
  packages: ['starter', 'smart', 'optima'],
  requiresSelectedEvent: true,
  roles: ['administrator', 'ee_event_organizer', 'ee_event_operator'],
  showInMenu: true,
  title: 'Registrations',
});

const { dateEnd, dateStart, order, page, perPage, search, sortBy, status, ticketName } = toRefs(props);

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
    header: 'Date',
    isHideable: true,
    isVisible: true,
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
    header: 'Price',
    isHideable: true,
    isVisible: true,
    key: 'ticket_price',
    width: 10,
  },
  {
    header: 'Paid',
    isHideable: true,
    isVisible: true,
    key: 'paid',
    width: 10,
  },
  {
    header: 'Status',
    isHideable: false,
    isVisible: true,
    key: 'status',
    width: 10,
  },
  {
    header: 'Email',
    isHideable: true,
    isVisible: false,
    key: 'email',
    width: 15,
  },
  {
    header: 'Phone',
    isHideable: true,
    isVisible: false,
    key: 'phone',
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
  date_end: dateEnd.value ? String(dateEnd.value) : '',
  date_start: dateStart.value ? String(dateStart.value) : '',
  search: search.value ? String(search.value) : '',
  status: status.value ? [String(status.value)] : [], // Initialize as an array
  ticket_name: ticketName.value ? [String(ticketName.value)] : [],
});

// Define parseDesc to accept a string and return a boolean
const parseDesc = (order: string): boolean => order.toLowerCase() === 'desc';
const sorting = ref<SortingState>([
  {
    desc: parseDesc(order.value || 'desc'),
    id: sortBy.value || 'date',
  },
]);

const handleOpenDetails = (id: string) => {
  selectedRegId.value = id; // Update the selected registration ID
};

// Define columns
const columnHelper = createColumnHelper<Reg>();
const columns = computed(() => {
  return columnConfigs.value
    .filter(config => config.isVisible)
    .map((config) => {
      return columnHelper.accessor(config.key, {
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
                    format(date, 'hh:mm'),
                  ),
                ],
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
                  class: 'number text-center group inline-block whitespace-nowrap',
                  href: `/event/${eventId.value}/${endpoint}?${new URLSearchParams(newParams).toString()}`,
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
                  cellProps.getValue(),
                ),
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
            case 'ticket_name':
              return h(
                'div',
                {
                  class: 'text-left',
                },
                cellProps.getValue(),
              );

            case 'ticket_price':
            case 'paid':
              return h(
                'div',
                {
                  class: 'text-right pr-4',
                },
                formatThousands(Number(cellProps.getValue())),
              );
            case 'status':
              return h(
                TableStatusTooltip,
                {
                  position: 'top',
                  size: 'sm',
                  status: cellProps.row.original.stt_id,
                },
                {
                  default: () => cellProps.getValue(),
                },
              );
            default:
              return h('div', { class: 'text-left' }, cellProps.getValue());
          }
        },
        header: config.header,
        size: config.width * 10,
      });
    });
});

// Fetch data from the API
const { isLoading, regData, totalData, totalPages } = useRegs(eventId, endpoint, pagination, sorting, filters);

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
  }
  else {
    const [start, end] = dateRange;
    if (!start || !end) {
      // Additional safety check if needed
      filters.value.date_start = '';
      filters.value.date_end = '';
    }
    else {
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
    }
    else {
      // User selects a new date range
      [filters.value.date_start, filters.value.date_end] = newValue.map(date =>
        // Format to yyyy-MM-dd hh:mm
        format(date, 'yyyy-MM-dd'),
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

const handleCloseDetails = () => {
  selectedRegId.value = ''; // Reset the selected registration ID
  const currentQuery = { ...route.query };
  delete currentQuery.details; // Remove the `details` query parameter
};

const isAnyFilterActive = computed(() => {
  // Check if any filter is active
  return (
    filters.value.search
    || filters.value.ticket_name.length > 0
    || filters.value.status.length > 0
    || filters.value.date_start
    || filters.value.date_end
  );
});

// Reset filters, sorting, and pagination to their initial state
const handleResetFilters = () => {
  filters.value = {
    date_end: '',
    date_start: '',
    search: '',
    status: [],
    ticket_name: [],
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

// Watch for changes in filters, pagination, and sorting, and update the route query
watch(
  [filters, pagination, sorting, selectedRegId],
  ([newFilters, newPagination, newSorting]) => {
    const query = {
      dateEnd: newFilters.date_end || undefined,
      dateStart: newFilters.date_start || undefined,
      details: selectedRegId.value || undefined,
      order: newSorting[0]?.desc ? 'desc' : 'asc',
      page: newPagination.pageIndex + 1 || undefined,
      perPage: newPagination.pageSize || undefined,
      search: newFilters.search || undefined,
      sortBy: newSorting[0]?.id || undefined,
      status: newFilters.status.length > 0 ? newFilters.status : undefined,
      ticket: newFilters.ticket_name.length > 0 ? newFilters.ticket_name : undefined,
    };
    router.push({ query });
  },
  { deep: true },
);

watch(selectedRegId, () => {
  const newQuery = { ...route.query };
  if (selectedRegId.value) {
    newQuery.details = selectedRegId.value;
  }
  else {
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
  { immediate: true }, // This ensures it runs on component mount
);

// Watch for changes in the route query and update the filters ref
watch(
  () => route.query,
  (newQuery) => {
    filters.value = {
      date_end: (newQuery.dateEnd as string) || '',
      date_start: (newQuery.dateStart as string) || '',
      search: (newQuery.search as string) || '',
      status: Array.isArray(newQuery.status)
        ? (newQuery.status as string[])
        : newQuery.status
          ? [newQuery.status as string]
          : [],
      ticket_name: Array.isArray(newQuery.ticket)
        ? (newQuery.ticket as string[])
        : newQuery.ticket
          ? [newQuery.ticket as string]
          : [],
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
    selectedRegId.value = (newQuery.details as string) || '';
  },
  { deep: true },
);
</script>

<template>
  <div class="container mx-auto 2xl:mx-0">
    <header class="mb-5 flex flex-col gap-2 pt-10 sm:flex-row sm:items-start sm:justify-between">
      <h1 class="h2">
        Registrations
      </h1>
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
    <div class="container py-4 2xl:mx-0">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <!-- Left: Avatars -->
        <div class="flex flex-col space-y-2 sm:grid sm:grid-flow-col sm:gap-2 sm:space-y-0">
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
    <div class="2xl:mx container 2xl:max-w-none">
      <div
        class="flex min-h-12 w-full items-center justify-between gap-2 py-3 sm:flex-row sm:py-3"
        :class="[isAnyFilterActive ? 'flex-col items-start' : 'flex-row items-center justify-between']"
      >
        <h3 class="shrink-0">
          <span v-if="isAnyFilterActive" class="font-semibold text-slate-950 dark:text-slate-300">Filtered Registrations
          </span>
          <span v-else class="font-semibold text-slate-950 dark:text-slate-200">All Registrations</span>
        </h3>
        <div v-if="!isLoading" class="number shrink-0 text-sm text-slate-500">
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
    </div>
  </section>

  <section class="relative" :class="{ 'scroll-area overflow-x-auto': !isLoading }">
    <div class="w-full">
      <div :style="{ minWidth: `${calculateMinWidth(toRef(columnConfigs))}px` }">
        <template v-if="isLoading">
          <div class="absolute z-10 size-full ring-0" />
        </template>
        <table class="relative w-full bg-white dark:bg-transparent dark:text-slate-300/90">
          <thead
            class="border-y border-slate-200 bg-slate-100 text-xs uppercase dark:border-slate-900/50 dark:bg-slate-800/50 dark:text-slate-400"
          >
            <tr v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
              <th
                v-for="header in headerGroup.headers" :key="header.id" :colSpan="header.colSpan" :style="{
                  minWidth: `${header.column.columnDef.size ?? 20}px`,
                }"
                class="whitespace-nowrap px-2 py-3 text-xs text-slate-500 first:pl-5 last:pr-5 hover:bg-blue-200/20 dark:text-slate-400 dark:hover:bg-slate-900/50"
                :class="{
                  'bg-blue-200/20 text-blue-600 dark:bg-slate-800/50': header.column.getIsSorted(),
                  'cursor-pointer select-none': header.column.getCanSort(),
                }" @click="header.column.getCanSort() ? header.column.getToggleSortingHandler()?.($event) : null"
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
              <template v-if="isLoading">
                <tr v-for="index in 10" :key="index">
                  <td v-for="(column, index2) in columns" :key="index2" class="p-2">
                    <Skeleton class="h-6 w-full rounded" />
                  </td>
                </tr>
              </template>
              <tr v-else>
                <td colspan="10" class="py-10 text-center">
                  <EmptyState
                    title="No data found" description="There are no registrations matching your criteria."
                    :img="{ src: '/images/empty-state/empty-c.svg' }"
                    :cta="{ label: 'Clear Filters', action: handleResetFilters, icon: 'heroicons:arrow-path-solid' }"
                  />
                </td>
              </tr>
            </template>
            <tr
              v-for="row in table.getRowModel().rows" :key="row.id"
              class="hover:bg-slate-50 dark:hover:bg-slate-950/20"
            >
              <td
                v-for="cell in row.getVisibleCells()" :key="cell.id"
                class="number px-2 py-3 text-center first:pl-5 last:pr-5" :class="{
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
    v-if="table.getRowModel().rows.length > 0" :current-page="table.getState().pagination.pageIndex + 1"
    :page-count="table.getPageCount()" :page-sizes="pageSizes" :page-size="table.getState().pagination.pageSize"
    :total-data="totalData" @update:page-size="handlePageSizeChange" @update:current-page="handleNavigation"
  />
  <div v-else class="h-40" />
  <RegDetails
    :reg-details-open="selectedRegId !== ''" :evt-id="eventId"
    :reg-id="selectedRegId ? selectedRegId : undefined" @close-reg-details="handleCloseDetails"
  />
</template>
