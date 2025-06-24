<script setup lang="ts">
import type { PaginationState, SortingState } from '@tanstack/vue-table';

import { Icon } from '@iconify/vue';
import {
  createColumnHelper,
  FlexRender,
  getCoreRowModel,
  useVueTable,
} from '@tanstack/vue-table';
import { format } from 'date-fns';
import { computed, h, ref, toRefs, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { toast } from 'vue-sonner';

import type { ColumnConfig, Filter, RegItem } from '@/types';

import Datepicker from '@/components/Datepicker.vue';
import DropdownStatusFilter from '@/components/DropdownStatusFilter.vue';
import DropdownTicketFilter from '@/components/DropdownTicketFilter.vue';
import RegCards from '@/components/partials/registrations/RegCards.vue';
import RegDetails from '@/components/partials/registrations/RegDetails.vue';
import RegCode from '@/components/statuses/RegCode.vue';
import StatusBadge from '@/components/statuses/StatusBadge.vue';
import TablePagination from '@/components/TablePagination.vue';
import TableResetBtn from '@/components/TableResetBtn.vue';
import TableSearchForm from '@/components/TableSearchForm.vue';
import { useRegs } from '@/composables/useRegs';
import { calculateMinWidth, formatThousands } from '@/utils';
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

const route = useRoute();
const router = useRouter();

const eventId = computed(() => route.params.eventId as string || '');

const endpoint = 'registrations';

// Export state
const { exportData } = useExport();
const isExporting = ref(false);

// Selected registration ID for details modal
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
]);

// State management
const pagination = ref<PaginationState>({
  pageIndex: page.value ? Number(page.value) - 1 : 0,
  pageSize: perPage.value ? Number(perPage.value) : INITIAL_PAGE_SIZE,
});

const filters = ref<Filter>({
  date_end: dateEnd.value ? String(dateEnd.value) : '',
  date_start: dateStart.value ? String(dateStart.value) : '',
  search: search.value ? String(search.value) : '',
  status: status.value ? [String(status.value)] : [],
  ticket_name: ticketName.value ? [String(ticketName.value)] : [],
});

const parseDesc = (order: string): boolean => order.toLowerCase() === 'desc';
const sorting = ref<SortingState>([
  {
    desc: parseDesc(order.value || 'desc'),
    id: sortBy.value || 'date',
  },
]);

const handleOpenDetails = (id: string) => {
  selectedRegId.value = id;
};

// Table columns configuration
const columnHelper = createColumnHelper<RegItem>();
const columns = computed(() => {
  return columnConfigs.value
    .filter(config => config.isVisible)
    .map((config) => {
      return columnHelper.accessor(config.key, {
        cell: (cellProps) => {
          switch (config.key) {
            case 'date': {
              return h(
                'div',
                {
                  class: 'text-right text-slate-900 dark:text-slate-300 text-xs xl:text-sm',
                },
                [
                  h('div', { class: 'whitespace-nowrap' }, formatDate(cellProps.getValue(), 'd MMM yyyy')),
                  h(
                    'div',
                    {
                      class: 'text-xs text-slate-400 dark:text-slate-600',
                    },
                    formatDate(cellProps.getValue(), 'HH:mm'),
                  ),
                ],
              );
            }
            case 'code': {
              const stt_id = cellProps.row.original.stt_id;
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
                [
                  h(RegCode, {
                    code: cellProps.getValue() as string,
                    statusId: stt_id,
                    size: 'sm',
                    class: 'group-hover:underline transition-all duration-200',
                  }),
                ],
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
            case 'status': {
              const stt_id = cellProps.row.original.stt_id;

              return h(StatusBadge, {
                statusId: stt_id,
                variant: 'dot',
                size: 'sm',
                withIcon: false,
                iconOnly: true,
                noTooltip: false, // Enable tooltip
                class: 'justify-center',
              });
            }
            default:
              return h('div', { class: 'text-left' }, cellProps.getValue());
          }
        },
        header: config.header,
        size: config.width * 10,
      });
    });
});

// Data fetching
const { isLoading, regData, totalData, totalPages, refetch } = useRegs(eventId, endpoint, pagination, sorting, filters);

// Table setup
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

// Export functionality
const handleExport = async (format: 'csv' | 'xlsx') => {
  try {
    isExporting.value = true;

    await exportData(
      eventId.value,
      endpoint,
      format,
      filters.value,
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

// Helper functions
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
    filters.value.date_start = '';
    filters.value.date_end = '';
  }
  else {
    const [start, end] = dateRange;
    if (!start || !end) {
      filters.value.date_start = '';
      filters.value.date_end = '';
    }
    else {
      filters.value.date_start = format(start, 'yyyy-MM-dd');
      filters.value.date_end = format(end, 'yyyy-MM-dd');
    }
  }
}

const dateRange = computed({
  get: () => {
    if (filters.value.date_start === '' || filters.value.date_end === '') {
      return null;
    }
    return [new Date(filters.value.date_start), new Date(filters.value.date_end)];
  },
  set: (newValue: [Date | null, Date | null] | null) => {
    if (newValue === null) {
      filters.value.date_start = '';
      filters.value.date_end = '';
    }
    else {
      [filters.value.date_start, filters.value.date_end] = newValue.map(date =>
        date ? format(date, 'yyyy-MM-dd') : '',
      );
    }
  },
});

const handleNavigation = (pageNumber: number) => {
  const currentPageIndex = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();

  if (pageNumber === currentPageIndex + 1) {
    return;
  }

  const newPageIndex = Math.max(0, Math.min(pageNumber - 1, pageCount - 1));
  table.setPageIndex(newPageIndex);

  router.push({
    query: {
      ...route.query,
      page: newPageIndex + 1,
    },
  });
};

const handleCloseDetails = () => {
  selectedRegId.value = '';
  const currentQuery = { ...route.query };
  delete currentQuery.details;
};

const isAnyFilterActive = computed(() => {
  return (
    filters.value.search
    || filters.value.ticket_name.length > 0
    || filters.value.status.length > 0
    || filters.value.date_start
    || filters.value.date_end
  );
});

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

// Active filters for display
const activeFilters = computed(() => {
  const active = [];

  if (filters.value.search) {
    active.push({
      type: 'search',
      label: 'Search',
      value: filters.value.search,
    });
  }

  if (filters.value.date_start && filters.value.date_end) {
    active.push({
      type: 'date_range',
      label: 'Date Range',
      value: `${format(new Date(filters.value.date_start), 'dd MMM yyyy')} - ${format(new Date(filters.value.date_end), 'dd MMM yyyy')}`,
    });
  }

  filters.value.status.forEach((status) => {
    active.push({
      type: 'status',
      label: 'Status',
      value: status,
    });
  });

  filters.value.ticket_name.forEach((ticket) => {
    active.push({
      type: 'ticket',
      label: 'Ticket',
      value: ticket,
    });
  });

  return active;
});

const handleRemoveFilter = (filterToRemove: any) => {
  switch (filterToRemove.type) {
    case 'search':
      filters.value.search = '';
      break;
    case 'date_range':
      filters.value.date_start = '';
      filters.value.date_end = '';
      dateRange.value = null;
      break;
    case 'status':
      filters.value.status = filters.value.status.filter(s => s !== filterToRemove.value);
      break;
    case 'ticket':
      filters.value.ticket_name = filters.value.ticket_name.filter(t => t !== filterToRemove.value);
      break;
  }
};

// Watchers
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

watch(
  () => route.query.details,
  (newDetails) => {
    selectedRegId.value = (newDetails as string) || '';
  },
  { immediate: true },
);

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
  <div class="container mx-auto">
    <header class="mb-5 flex flex-col gap-2 pt-10 sm:flex-row sm:items-start sm:justify-between">
      <h1 class="h2">
        Registrations
      </h1>
      <div class="flex shrink-0 space-x-2 justify-self-end">
        <div class="min-w-64 grow">
          <Datepicker :date-range="dateRange" @update:date-range="handleSetDateRange" />
        </div>
      </div>
    </header>
    <RegCards />
  </div>

  <section>
    <div class="container py-4">
      <div class="flex flex-col flex-wrap gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div class="flex flex-col space-y-2 sm:grid sm:grid-flow-col sm:gap-2 sm:space-y-0">
          <TableSearchForm v-model="filters.search" placeholder="Search Registrant..." />
          <DropdownTicketFilter v-model="filters.ticket_name" />
          <DropdownStatusFilter v-model="filters.status" />

          <TableResetBtn v-if="isAnyFilterActive" @click.prevent="handleResetFilters" />
        </div>
        <div class="flex shrink-0 space-x-2 justify-self-end">
          <DropdownTableFilter v-model="columnConfigs" />
          <!-- Export Dropdown -->
          <DropdownMenu v-if="!isLoading">
            <DropdownMenuTrigger as-child>
              <Button variant="outline" class="h-[42px] bg-card dark:bg-background" :disabled="isExporting">
                <Icon
                  :icon="isExporting ? 'svg-spinners:ring-resize' : 'heroicons:arrow-down-tray'"
                  class="mr-2 size-4 text-muted-foreground"
                />
                {{ isExporting ? 'Exporting...' : 'Export' }}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              <DropdownMenuItem :disabled="isExporting" @click="handleExport('csv')">
                <Icon icon="ph:file-csv" class="mr-2 size-4 text-muted-foreground" />
                Export to CSV
              </DropdownMenuItem>
              <DropdownMenuItem :disabled="isExporting" @click="handleExport('xlsx')">
                <Icon icon="ph:file-xls" class="mr-2 size-4 text-muted-foreground" />
                Export to XLSX
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  </section>

  <section class="bg-slate-50 dark:bg-slate-900/60">
    <div class="container mx-auto 2xl:max-w-none">
      <div
        class="flex min-h-12 w-full flex-wrap items-center justify-between gap-2 py-3 sm:flex-row sm:py-3"
        :class="[isAnyFilterActive ? 'flex-col items-start' : 'flex-row  items-center justify-between']"
      >
        <div class="flex grow flex-wrap items-center gap-2">
          <div v-if="activeFilters.length > 0" class="flex flex-wrap items-center gap-2">
            <h3 class="font-semibold text-slate-950 dark:text-slate-100">
              Result for:
            </h3>
            <Button
              v-for="(filter, index) in activeFilters"
              :key="`${filter.type}-${filter.value}-${index}`"
              variant="outline"
              size="sm"
              class="cursor-pointer hover:bg-card hover:text-card-foreground"
              @click="handleRemoveFilter(filter)"
            >
              {{ filter.label }}: {{ filter.value }}
              <Icon icon="heroicons:x-mark" class="ml-1 size-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              class=" hover:bg-card hover:text-card-foreground"
              @click="handleResetFilters"
            >
              <Icon icon="heroicons:arrow-path" class="mr-1 size-3" />
              Clear all
            </Button>
          </div>
          <span v-else class="font-semibold text-slate-950 dark:text-slate-200">All Registrations</span>
        </div>
        <div class="number shrink-0 text-sm text-muted-foreground">
          <template v-if="isLoading">
            <span class="text-slate-900 dark:text-slate-100">Loading...</span>
          </template>
          <template v-else-if="totalData > 0">
            {{ isAnyFilterActive ? 'Found' : 'Total' }}
            <span class="font-semibold text-slate-900 dark:text-slate-100">{{ formatThousands(totalData) }}</span>
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
      <div :style="{ minWidth: `${calculateMinWidth(toRef(columnConfigs), totalData)}px` }">
        <template v-if="isLoading">
          <div class="absolute z-10 size-full ring-0" />
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
                    title="No data found"
                    description="There are no registrations matching your criteria."
                    :img="{ src: '/images/empty-state/empty-c.svg' }"
                    :cta="{
                      label: 'Retry',
                      action: () => {
                        table.setPageIndex(0);
                        refetch();
                      },
                      icon: 'tabler:refresh',
                    }"
                    :cta2="{ label: 'Clear Filters', action: handleResetFilters, icon: 'tabler:filter-x' }"
                  />
                </td>
              </tr>
            </template>
            <tr
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              class="hover:bg-slate-50 dark:hover:bg-slate-600/20"
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
  <div v-else class="h-40" />
  <RegDetails
    :reg-details-open="selectedRegId !== ''"
    :evt-id="eventId"
    :reg-id="selectedRegId ? selectedRegId : undefined"
    @close-reg-details="handleCloseDetails"
  />
</template>
