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
import { computed, nextTick, ref, watch } from 'vue';

import type { Billing, BillingFilters, ColumnConfig } from '@/types';

import { calculateMinWidth, formatThousands } from '@/utils';
import BillingCards from '~/components/partials/billings/BillingCards.vue';
import { useBillings } from '~/composables/useBillings';

const props = withDefaults(
  defineProps<{
    search?: string
    status?: string
    dateStart?: string
    dateEnd?: string
    page?: string
    perPage?: string
    sortBy?: string
    order?: string
  }>(),
  {
    dateEnd: '',
    dateStart: '',
    order: 'desc',
    page: '1',
    perPage: '10',
    search: '',
    sortBy: 'request_date',
    status: '',
  },
);

useHead({
  title: 'Billings',
});

definePageMeta({
  capabilities: ['ee_read_billings'],
  group: 'billings',
  icon: 'solar:wallet-money-bold-duotone',
  layout: 'dashboard-with-sidebar',
  order: 1,
  packages: ['starter', 'smart', 'optima'],
  requiresSelectedEvent: true,
  roles: ['administrator', 'ee_event_organizer'],
  showInMenu: true,
  title: 'Billings',
});

// Add route and router
const route = useRoute();
const router = useRouter();

// Flag to prevent infinite loops between watchers
const isUpdatingFromQuery = ref(false);

const eventId = computed(() => route.params.eventId as string || '');

// Pagination configs
const INITIAL_PAGE_SIZE = 10;
const pageSizes = [10, 20, 30, 40, 50];

const initialPage = Number(route.query.page || 1);
const initialPerPage = Number(route.query.perPage || INITIAL_PAGE_SIZE);

const pagination = ref<PaginationState>({
  pageIndex: Math.max(0, initialPage - 1), // Convert 1-based to 0-based
  pageSize: initialPerPage,
});

const filters = ref<BillingFilters>({
  date_end: props.dateEnd || '',
  date_start: props.dateStart || '',
  search: props.search || '',
  status: props.status || '',
});

const sorting = ref<SortingState>([
  {
    desc: props.order ? props.order.toLowerCase() === 'desc' : true,
    id: props.sortBy || 'request_date',
  },
]);

const dateRange = computed(() => {
  if (filters.value.date_start && filters.value.date_end) {
    return [new Date(filters.value.date_start), new Date(filters.value.date_end)];
  }

  return null;
});

// Add helper function for parsing sort order
const parseDesc = (order: string): boolean => order.toLowerCase() === 'desc';

// Table configurations
const columnConfigs = ref<ColumnConfig[]>([
  {
    header: 'Date',
    isHideable: true,
    isVisible: true,
    key: 'request_date',
    width: 15,
  },
  {
    header: 'Amount',
    isHideable: true,
    isVisible: true,
    key: 'amount',
    width: 10,
  },
  {
    header: 'Status',
    isHideable: true,
    isVisible: true,
    key: 'status',
    width: 10,
  },
  {
    header: 'Transferred Date',
    isHideable: true,
    isVisible: true,
    key: 'transferred_date',
    width: 15,
  },
  {
    header: 'Notes',
    isHideable: true,
    isVisible: true,
    key: 'notes',
    width: 15,
  },
]);

// Add status config
const statusConfig = (status: string) => {
  switch (status) {
    case 'pending':
      return {
        bgColor: 'bg-yellow-50 dark:bg-yellow-950',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
        color: 'text-yellow-600 dark:text-yellow-400',
        icon: 'material-symbols:pending',
      };
    case 'completed':
      return {
        bgColor: 'bg-green-50 dark:bg-green-950',
        borderColor: 'border-green-200 dark:border-green-800',
        color: 'text-green-600 dark:text-green-400',
        icon: 'tabler:circle-check-filled',
      };
    case 'rejected':
      return {
        bgColor: 'bg-red-50 dark:bg-red-950',
        borderColor: 'border-red-200 dark:border-red-800',
        color: 'text-red-600 dark:text-red-400',
        icon: 'material-symbols:error',
      };
    default:
      return {
        bgColor: 'bg-gray-50 dark:bg-gray-950',
        borderColor: 'border-gray-200 dark:border-gray-800',
        color: 'text-gray-500 dark:text-gray-400',
        icon: 'material-symbols:help',
      };
  }
};

// Define columns
const columnHelper = createColumnHelper<Billing>();
const columns = computed(() => {
  return columnConfigs.value
    .filter(config => config.isVisible)
    .map((config) => {
      return columnHelper.accessor(config.key as keyof Billing, {
        cell: (info) => {
          const value = info.getValue();

          switch (config.key) {
            case 'request_date':
            case 'transferred_date': {
              if (!value)
                return '-';
              return h('div', {
                class: 'whitespace-nowrap text-right',
              }, [
                format(new Date(value), 'dd MMM yyyy'),
                h('div', {
                  class: 'text-xs text-right text-slate-500 dark:text-slate-400',
                }, format(new Date(value), 'HH:mm')),
              ]);
            }
            case 'amount':
              return h('div', {
                class: 'md:pr-8 font-medium text-right tabular-nums',
              }, formatThousands(Number(value)));
            case 'status': {
              const status = value as string;
              const config = statusConfig(status);
              return h(
                'div',
                {
                  class: 'text-center whitespace-nowrap',
                },
                [
                  h(
                    'span',
                    {
                      class: `inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs border font-medium ${config.bgColor} ${config.borderColor} ${config.color}`,
                    },
                    [
                      h(Icon, { icon: config.icon, class: 'size-4' }),
                      status.charAt(0).toUpperCase() + status.slice(1),
                    ],
                  ),
                ],
              );
            }
            case 'notes':
              return value || '-';
            default:
              return value;
          }
        },
        header: config.header,
        size: config.width * 10,
      });
    });
});

// Get billing data using composable
const {
  billingData,
  isLoading: isDataLoading,
  isRefetching,
  totalData,
  totalPages,
} = useBillings(eventId, pagination, sorting, filters);

// Create table instance
const table = useVueTable({
  get columns() {
    return columns.value;
  },
  get data() {
    return billingData.value;
  },
  getCoreRowModel: getCoreRowModel(),
  state: {
    pagination: pagination.value,
    get sorting() {
      return sorting.value;
    },
  },
});

// Table helper functions
const handlePageSizeChange = (newSize: number) => {
  pagination.value.pageSize = newSize;
};

const handleNavigation = (pageNumber: number) => {
  router.push({
    query: {
      ...route.query,
      page: String(pageNumber),
    },
  });
};

// Add reset filters function
const handleResetFilters = () => {
  filters.value = {
    date_end: '',
    date_start: '',
    search: '',
    status: '',
  };

  pagination.value = {
    pageIndex: 0,
    pageSize: INITIAL_PAGE_SIZE,
  };

  sorting.value = [
    {
      desc: true,
      id: 'request_date',
    },
  ];
};

// Update your date range handler
const handleSetDateRange = (dateRange: [Date | null, Date | null] | null) => {
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
};

// Add computed for checking if any filters are active
const isAnyFilterActive = computed(() => {
  return filters.value.search || filters.value.status || filters.value.date_start || filters.value.date_end;
});

// Add watchers to sync state with URL
watch(
  [filters, pagination, sorting],
  ([newFilters, newPagination, newSorting]) => {
    if (isUpdatingFromQuery.value) {
      return;
    }

    const query = {
      dateStart: newFilters.date_start || undefined,
      dateEnd: newFilters.date_end || undefined,
      order: newSorting[0]?.desc ? 'desc' : 'asc',
      page: String(newPagination.pageIndex + 1),
      perPage: String(newPagination.pageSize),
      search: newFilters.search || undefined,
      sortBy: newSorting[0]?.id || undefined,
      status: newFilters.status || undefined,
    };
    router.push({ query });
  },
  { deep: true },
);

// Watch for URL changes and update the state
watch(
  () => route.query,
  (newQuery) => {
    isUpdatingFromQuery.value = true;

    filters.value = {
      date_end: (newQuery.dateEnd as string) || '',
      date_start: (newQuery.dateStart as string) || '',
      search: (newQuery.search as string) || '',
      status: (newQuery.status as string) || '',
    };

    pagination.value = {
      pageIndex: Math.max(0, Number(newQuery.page || 1) - 1),
      pageSize: Number(newQuery.perPage || INITIAL_PAGE_SIZE),
    };

    sorting.value = [
      {
        desc: parseDesc((newQuery.order as string) || 'desc'),
        id: (newQuery.sortBy as string) || 'request_date',
      },
    ];

    nextTick(() => {
      isUpdatingFromQuery.value = false;
    });
  },
  { deep: true, immediate: true },
);
</script>

<template>
  <div class="container mx-auto flex flex-col gap-5">
    <div class="flex flex-col">
      <header class="mb-5 flex flex-col gap-2 pt-10 sm:flex-row sm:items-start sm:justify-between">
        <h1 class="h2">
          Billings
        </h1>
      </header>
      <BillingCards />
    </div>
  </div>

  <section>
    <div class="container py-4">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div class="flex flex-col space-y-2 sm:grid sm:grid-flow-col sm:gap-2 sm:space-y-0">
          <TableSearchForm v-model="filters.search" placeholder="Search billings..." />
          <Datepicker :date-range="dateRange" @update:date-range="handleSetDateRange" />
          <TableResetBtn v-if="isAnyFilterActive" @reset-filters="handleResetFilters" />
        </div>
      </div>
    </div>
  </section>

  <section class="container relative mx-auto mb-20" :class="{ 'scroll-area overflow-x-auto': !isDataLoading }">
    <Card class="w-full">
      <CardHeader class="flex flex-row items-center justify-between space-y-0">
        <CardTitle class="font-medium tracking-normal">
          Withdrawal Requests
        </CardTitle>
      </CardHeader>
      <CardContent class="scroll-area overflow-x-auto p-0">
        <div :style="{ minWidth: `${calculateMinWidth(toRef(columnConfigs), totalData)}px` }">
          <table class="w-full bg-white dark:bg-transparent dark:text-slate-300/90">
            <thead
              class="border-y border-slate-200 bg-slate-100 dark:border-slate-900/50 dark:bg-slate-800/50 dark:text-slate-400"
            >
              <tr v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
                <th
                  v-for="header in headerGroup.headers"
                  :key="header.id"
                  :colSpan="header.colSpan"
                  :style="{ width: `${header.column.columnDef.size}px` }"
                  class="whitespace-nowrap px-2 py-3 text-sm font-normal  text-slate-400 first:pl-5 last:pr-5 dark:text-slate-400"
                >
                  <FlexRender :render="header.column.columnDef.header" :props="header.getContext()" />
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <template v-if="!table.getRowModel().rows.length">
                <template v-if="isDataLoading || isRefetching">
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
                      description="There are no data matching your criteria."
                      icon="solar:sleeping-square-bold-duotone"
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
                <td v-for="cell in row.getVisibleCells()" :key="cell.id" class="px-2 py-3 first:pl-5 last:pr-5">
                  <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
      <CardFooter class="border-t p-0">
        <TablePagination
          v-if="table.getRowModel().rows.length > 0"
          :current-page="Number(route.query.page) || 1"
          :page-count="totalPages"
          :page-sizes="pageSizes"
          :page-size="Number(route.query.perPage) || INITIAL_PAGE_SIZE"
          :total-data="totalData"
          active-page-style="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          @update:page-size="handlePageSizeChange"
          @update:current-page="handleNavigation"
        />
      </CardFooter>
    </Card>
  </section>
</template>
