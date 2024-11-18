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
import { format } from 'date-fns';
import { Icon } from '@iconify/vue';
import { formatThousands } from '@/utils';
import type { ColumnConfig, Billing, BillingFilters, StatusConfig } from '@/types';
import { useBillings } from '~/composables/useBillings';
import BillingCards from '~/components/partials/billings/BillingCards.vue';

useHead({
  title: 'Billings',
});

definePageMeta({
  title: 'Billings',
  showInMenu: true,
  order: 1,
  icon: 'solar:wallet-money-bold-duotone',
  group: 'billings',
  layout: 'dashboard-with-sidebar',
  requiresSelectedEvent: true,
  packages: ['starter', 'smart', 'optima'],
  roles: ['administrator', 'ee_event_organizer'],
  capabilities: ['ee_read_billings'],
});

const props = withDefaults(
  defineProps<{
    search?: string;
    status?: string;
    dateStart?: string;
    dateEnd?: string;
    page?: string;
    perPage?: string;
    sortBy?: string;
    order?: string;
  }>(),
  {
    search: '',
    status: '',
    dateStart: '',
    dateEnd: '',
    page: '1',
    perPage: '10',
    sortBy: 'date',
    order: 'desc',
  }
);

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
  search: props.search || '',
  status: props.status || '',
  date_start: props.dateStart || '',
  date_end: props.dateEnd || '',
});

const sorting = ref<SortingState>([
  {
    id: props.sortBy || 'date',
    desc: props.order ? props.order.toLowerCase() === 'desc' : true,
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
    key: 'request_date',
    header: 'Date',
    isVisible: true,
    isHideable: true,
    width: 15,
  },
  {
    key: 'amount',
    header: 'Amount',
    isVisible: true,
    isHideable: true,
    width: 10,
  },
  {
    key: 'status',
    header: 'Status',
    isVisible: true,
    isHideable: true,
    width: 10,
  },
  {
    key: 'transferred_date',
    header: 'Transferred Date',
    isVisible: true,
    isHideable: true,
    width: 15,
  },
   {
    key: 'notes',
    header: 'Notes',
    isVisible: true,
    isHideable: true,
    width: 15,
  },
]);

// Add status config
const statusConfig: StatusConfig = {
  completed: {
    icon: 'material-symbols:check-circle',
    color: 'text-green-500',
    bgColor: 'bg-green-50',
  },
  pending: {
    icon: 'material-symbols:pending',
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
  },
};

// Define columns
const columnHelper = createColumnHelper<Billing>();
const columns = computed(() => {
  return columnConfigs.value
    .filter((config) => config.isVisible)
    .map((config) => {
      return columnHelper.accessor(config.key as keyof Billing, {
        header: config.header,
        size: config.width * 10,
        cell: (info) => {
          const value = info.getValue();

          switch (config.key) {
            case 'request_date':
            case 'transferred_date': {
              if (!value) return '-';
              return format(new Date(value), 'dd MMM yyyy');
            }
            case 'amount':
              return formatThousands(Number(value));
            case 'status': {
              const status = value as string;
              const config = statusConfig[status] || {
                icon: 'material-symbols:help',
                color: 'text-gray-500',
                bgColor: 'bg-gray-50',
              };
              return h(
                'div',
                {
                  class: 'flex items-center gap-2',
                },
                [
                  h(Icon, {
                    icon: config.icon,
                    class: config.color,
                  }),
                  h('span', {}, status.charAt(0).toUpperCase() + status.slice(1)),
                ]
              );
            }
            case 'notes':
              return value || '-';
            default:
              return value;
          }
        },
      });
    });
});

// Get billing data using composable
const {
  billingData,
  totalData,
  totalPages,
  isLoading: isDataLoading,
} = useBillings(eventId, pagination, sorting, filters);

// Create table instance
const table = useVueTable({
  get columns() {
    return columns.value;
  },
  get data() {
    return billingData.value;
  },
  state: {
    pagination: pagination.value,
    get sorting() {
      return sorting.value;
    },
  },
  getCoreRowModel: getCoreRowModel(),
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
    search: '',
    status: '',
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

// Update your date range handler
const handleSetDateRange = (dateRange: [Date | null, Date | null] | null) => {
  if (dateRange === null) {
    filters.value.date_start = '';
    filters.value.date_end = '';
  } else {
    const [start, end] = dateRange;
    if (!start || !end) {
      filters.value.date_start = '';
      filters.value.date_end = '';
    } else {
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
    .filter((config) => config.isVisible)
    .reduce((total, config) => total + config.width * 15, 0); // Multiply by a factor to get reasonable width

  // Return the greater of the calculated width or minimum width (e.g., 1000px)
  return Math.max(totalWidth, 1000);
}

// Add watchers to sync state with URL
watch(
  [filters, pagination, sorting],
  ([newFilters, newPagination, newSorting]) => {
    const query = {
      search: newFilters.search || undefined,
      status: newFilters.status || undefined,
      dateStart: newFilters.date_start || undefined,
      dateEnd: newFilters.date_end || undefined,
      // Always use 1-based page numbers in the URL
      page: String(newPagination.pageIndex + 1),
      perPage: String(newPagination.pageSize),
      sortBy: newSorting[0]?.id || undefined,
      order: newSorting[0]?.desc ? 'desc' : 'asc',
    };
    router.push({ query });
  },
  { deep: true }
);

// Watch for URL changes and update the state
watch(
  () => route.query,
  (newQuery) => {
    filters.value = {
      search: (newQuery.search as string) || '',
      status: (newQuery.status as string) || '',
      date_start: (newQuery.dateStart as string) || '',
      date_end: (newQuery.dateEnd as string) || '',
    };

    pagination.value = {
      // Convert 1-based URL page number to 0-based pageIndex
      pageIndex: Math.max(0, Number(newQuery.page || 1) - 1),
      pageSize: Number(newQuery.perPage || INITIAL_PAGE_SIZE),
    };

    sorting.value = [
      {
        id: (newQuery.sortBy as string) || 'date',
        desc: parseDesc((newQuery.order as string) || 'desc'),
      },
    ];
  },
  { deep: true }
);
</script>

<template>
  <div class="container mx-auto flex flex-col gap-5 2xl:mx-0">
    <div class="flex flex-col">
      <header class="pt-10 mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <h1 class="h2">Billings</h1>
      </header>
      <BillingCards />
    </div>
  </div>

  <section>
    <div class="container 2xl:mx-0 py-4">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div class="flex flex-col space-y-2 sm:gap-2 sm:grid sm:grid-flow-col sm:space-y-0">
          <TableSearchForm v-model="filters.search" placeholder="Search billings..." />
          <Datepicker :date-range="dateRange" @update:date-range="handleSetDateRange" />
          <TableResetBtn v-if="isAnyFilterActive" @click.prevent="handleResetFilters" />
        </div>
      </div>
    </div>
  </section>

  <section class="relative" :class="{ 'overflow-x-auto scroll-area': !isDataLoading }">
    <div class="w-full">
      <div :style="{ minWidth: `${calculateMinWidth()}px` }">
        <table class="w-full bg-white dark:bg-transparent dark:text-slate-300/90">
          <thead
            class="border-b border-t border-slate-200 bg-slate-100 text-xs uppercase dark:border-slate-900/50 dark:bg-slate-800/50 dark:text-slate-400"
          >
            <tr v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
              <th
                v-for="header in headerGroup.headers"
                :key="header.id"
                :colSpan="header.colSpan"
                :style="{ width: `${header.column.columnDef.size}px` }"
                class="whitespace-nowrap px-2 py-3 text-slate-500 dark:text-slate-400 first:pl-5 last:pr-5 text-xs"
              >
                <FlexRender :render="header.column.columnDef.header" :props="header.getContext()" />
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 text-sm dark:divide-slate-800">
            <template v-if="!table.getRowModel().rows.length">
              <template v-if="isDataLoading">
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
                    description="There are no data matching your criteria."
                    :img="{ src: '/images/empty-state/empty-c.svg', 
                      alt: 'No data found', 
                      class: 'w-20' }"
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
