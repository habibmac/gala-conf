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
import { computed, ref } from 'vue';

import type { Billing, BillingFilters, ColumnConfig, StatusConfig } from '@/types';

import { formatThousands } from '@/utils';
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
    sortBy: 'date',
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

const { event } = useEvent();
const eventId = computed(() => event.value?.id);

// Add route and router
const route = useRoute();
const router = useRouter();

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
    id: props.sortBy || 'date',
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
const statusConfig: StatusConfig = {
  completed: {
    bgColor: 'bg-green-50',
    color: 'text-green-500',
    icon: 'material-symbols:check-circle',
  },
  pending: {
    bgColor: 'bg-orange-50',
    color: 'text-orange-500',
    icon: 'material-symbols:pending',
  },
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
              return format(new Date(value), 'dd MMM yyyy HH:mm');
            }
            case 'amount':
              return formatThousands(Number(value));
            case 'status': {
              const status = value as string;
              const config = statusConfig[status] || {
                bgColor: 'bg-gray-50',
                color: 'text-gray-500',
                icon: 'material-symbols:help',
              };
              return h(
                'div',
                {
                  class: 'flex items-center gap-2',
                },
                [
                  h(Icon, {
                    class: config.color,
                    icon: config.icon,
                  }),
                  h('span', {}, status.charAt(0).toUpperCase() + status.slice(1)),
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
  // pageNumber is 1-based, convert to 0-based for internal state
  pagination.value.pageIndex = pageNumber - 1;

  router.push({
    query: {
      ...route.query,
      page: String(pageNumber),
      perPage: String(pagination.value.pageSize),
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
      id: 'date',
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

function calculateMinWidth(): number {
  const totalWidth = columnConfigs.value
    .filter(config => config.isVisible)
    .reduce((total, config) => total + config.width * 15, 0); // Multiply by a factor to get reasonable width

  // Return the greater of the calculated width or minimum width (e.g., 1000px)
  return Math.max(totalWidth, 1000);
}

// Add watchers to sync state with URL
watch(
  [filters, pagination, sorting],
  ([newFilters, newPagination, newSorting]) => {
    const query = {
      dateEnd: newFilters.date_end || undefined,
      dateStart: newFilters.date_start || undefined,
      order: newSorting[0]?.desc ? 'desc' : 'asc',
      // Always use 1-based page numbers in the URL
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
    filters.value = {
      date_end: (newQuery.dateEnd as string) || '',
      date_start: (newQuery.dateStart as string) || '',
      search: (newQuery.search as string) || '',
      status: (newQuery.status as string) || '',
    };

    pagination.value = {
      // Convert 1-based URL page number to 0-based pageIndex
      pageIndex: Math.max(0, Number(newQuery.page || 1) - 1),
      pageSize: Number(newQuery.perPage || INITIAL_PAGE_SIZE),
    };

    sorting.value = [
      {
        desc: parseDesc((newQuery.order as string) || 'desc'),
        id: (newQuery.sortBy as string) || 'date',
      },
    ];
  },
  { deep: true },
);
</script>

<template>
  <div class="container mx-auto flex flex-col gap-5 2xl:mx-0">
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
    <div class="container py-4 2xl:mx-0">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div class="flex flex-col space-y-2 sm:grid sm:grid-flow-col sm:gap-2 sm:space-y-0">
          <TableSearchForm v-model="filters.search" placeholder="Search billings..." />
          <Datepicker :date-range="dateRange" @update:date-range="handleSetDateRange" />
          <TableResetBtn v-if="isAnyFilterActive" @reset-filters="handleResetFilters" />
        </div>
      </div>
    </div>
  </section>

  <section class="relative" :class="{ 'scroll-area overflow-x-auto': !isDataLoading }">
    <div class="w-full">
      <div :style="{ minWidth: `${calculateMinWidth()}px` }">
        <table class="w-full bg-white dark:bg-transparent dark:text-slate-300/90">
          <thead
            class="border-y border-slate-200 bg-slate-100 text-xs uppercase dark:border-slate-900/50 dark:bg-slate-800/50 dark:text-slate-400"
          >
            <tr v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
              <th
                v-for="header in headerGroup.headers"
                :key="header.id"
                :colSpan="header.colSpan"
                :style="{ width: `${header.column.columnDef.size}px` }"
                class="whitespace-nowrap px-2 py-3 text-xs text-slate-500 first:pl-5 last:pr-5 dark:text-slate-400"
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
                    :img="{ src: '/images/empty-state/empty-c.svg', alt: 'No data found', class: 'w-20' }"
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
    </div>
  </section>

  <TablePagination
    v-if="table.getRowModel().rows.length > 0"
    :current-page="pagination.pageIndex + 1"
    :page-count="totalPages"
    :page-sizes="pageSizes"
    :page-size="pagination.pageSize"
    :total-data="totalData"
    @update:page-size="handlePageSizeChange"
    @update:current-page="handleNavigation"
  />
</template>
