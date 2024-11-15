<!-- pages/[eventId]/checkins/index.vue -->
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
import CheckinStats from '~/components/partials/checkins/CheckinStats.vue';
import type { CheckinItem, CheckinColumnConfig } from '@/types';
import { useCheckins } from '~/composables/useCheckins';

useHead({
  title: 'Check-ins',
});

definePageMeta({
  title: 'Check-ins',
  showInMenu: true,
  order: 1,
  icon: 'solar:bill-check-bold-duotone',
  group: 'tools',
  layout: 'dashboard-with-sidebar',
  requiresSelectedEvent: true,
  packages: ['starter', 'smart', 'optima'],
  roles: ['administrator', 'ee_event_organizer', 'ee_event_operator'],
  capabilities: ['ee_read_checkins'],
});

const props = withDefaults(
  defineProps<{
    search?: string;
    dateStart?: string;
    dateEnd?: string;
    page?: string;
    perPage?: string;
    sortBy?: string;
    order?: string;
  }>(),
  {
    search: '',
    dateStart: '',
    dateEnd: '',
    page: '1',
    perPage: '10',
    sortBy: 'check_time',
    order: 'desc',
  }
);

const { event } = useEvent();
const eventId = computed(() => event.value?.id);

const route = useRoute();
const router = useRouter();

// Pagination configs
const INITIAL_PAGE_SIZE = 10;
const pageSizes = [10, 20, 30, 40, 50];

const initialPage = Number(route.query.page || 1);
const initialPerPage = Number(route.query.perPage || INITIAL_PAGE_SIZE);

const pagination = ref<PaginationState>({
  pageIndex: Math.max(0, initialPage - 1),
  pageSize: initialPerPage,
});

const filters = ref({
  search: props.search || '',
  date_start: props.dateStart || '',
  date_end: props.dateEnd || '',
});

const sorting = ref<SortingState>([
  {
    id: props.sortBy || 'check_time',
    desc: props.order ? props.order.toLowerCase() === 'desc' : true,
  },
]);

const dateRange = computed(() => {
  if (filters.value.date_start && filters.value.date_end) {
    return [new Date(filters.value.date_start), new Date(filters.value.date_end)];
  }
  return null;
});

// Table configurations
const columnConfigs = ref<CheckinColumnConfig[]>([
  {
    key: 'REG_code',
    header: 'Reg Code',
    isVisible: true,
    isHideable: true,
    width: 15,
  },
  {
    key: 'name',
    header: 'Name',
    isVisible: true,
    isHideable: true,
    width: 20,
  },
  {
    key: 'ticket',
    header: 'Ticket',
    isVisible: true,
    isHideable: true,
    width: 15,
  },
  {
    key: 'city',
    header: 'City',
    isVisible: true,
    isHideable: true,
    width: 15,
  },
  {
    key: 'first_check_time',
    header: 'First Check-in',
    isVisible: true,
    isHideable: true,
    width: 15,
  },
  {
    key: 'data',
    header: 'History',
    isVisible: true,
    isHideable: true,
    width: 20,
  },
]);

// Define columns
const columnHelper = createColumnHelper<CheckinItem>();
const columns = computed(() => {
  return columnConfigs.value
    .filter((config) => config.isVisible)
    .map((config) => {
      switch (config.key) {
        case 'first_check_time':
          return columnHelper.accessor('first_check_time', {
            header: config.header,
            size: config.width * 10,
            cell: (info) => format(new Date(info.getValue()), 'dd MMM yyyy HH:mm'),
          });
        case 'data':
          return columnHelper.accessor('data', {
            header: config.header,
            size: config.width * 10,
            cell: (info) =>
              info
                .getValue()
                .map((item) => `${format(new Date(item.time), 'HH:mm')} ${item.type}`)
                .join(', '),
          });
        default:
          return columnHelper.accessor(config.key as keyof CheckinItem, {
            header: config.header,
            size: config.width * 10,
            cell: (info) => info.getValue(),
          });
      }
    });
});

// Get checkin data using composable
const {
  checkinData,
  totalData,
  totalPages,
  isLoading: isDataLoading,
} = useCheckins(eventId, pagination, sorting, filters);

// Create table instance
const table = useVueTable({
  get columns() {
    return columns.value;
  },
  get data() {
    return checkinData.value;
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
  pagination.value.pageIndex = pageNumber - 1;
  router.push({
    query: {
      ...route.query,
      page: String(pageNumber),
      perPage: String(pagination.value.pageSize),
    },
  });
};

const handleResetFilters = () => {
  filters.value = {
    search: '',
    date_start: '',
    date_end: '',
  };
  pagination.value = {
    pageIndex: 0,
    pageSize: INITIAL_PAGE_SIZE,
  };
  sorting.value = [
    {
      id: 'check_time',
      desc: true,
    },
  ];
};

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

const isAnyFilterActive = computed(() => {
  return filters.value.search || filters.value.date_start || filters.value.date_end;
});

function calculateMinWidth(): number {
  const totalWidth = columnConfigs.value
    .filter((config) => config.isVisible)
    .reduce((total, config) => total + config.width * 15, 0); // Multiply by a factor to get reasonable width

  // Return the greater of the calculated width or minimum width (e.g., 1000px)
  return Math.max(totalWidth, 1000);
}
</script>

<!-- Add the template section from the next message due to length -->
<template>
  <div class="container mx-auto flex flex-col gap-5 2xl:mx-0">
    <div class="flex flex-col">
      <header class="pt-10 mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <h1 class="h2">Check-ins</h1>
      </header>

      <CheckinStats />

    </div>
  </div>

  <section>
    <div class="container 2xl:mx-0 py-4">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div class="flex flex-col space-y-2 sm:gap-2 sm:grid sm:grid-flow-col sm:space-y-0">
          <TableSearchForm v-model="filters.search" placeholder="Search by name, reg code, or ticket..." />
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
                <tr v-for="index in 3" :key="index">
                  <td v-for="(column, index2) in columns" :key="index2" class="px-2 py-2">
                    <Skeleton class="w-full h-6 rounded" />
                  </td>
                </tr>
              </template>
              <tr v-else>
                <td :colspan="columns.length" class="py-10 text-center">
                  <EmptyState
                    title="No check-ins found"
                    description="There are no check-ins matching your criteria."
                    :img="{
                      src: '/images/empty-state/empty-c.svg',
                      alt: 'No check-ins found',
                      class: 'w-20',
                    }"
                    :cta="{
                      label: 'Clear Filters',
                      action: handleResetFilters,
                      icon: 'heroicons:arrow-path-solid',
                    }"
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
