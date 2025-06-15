<!-- pages/[eventId]/checkins/index.vue -->
<script setup lang="ts">
import type { PaginationState, SortingState } from '@tanstack/vue-table';

import {
  createColumnHelper,
  FlexRender,
  getCoreRowModel,

  useVueTable,
} from '@tanstack/vue-table';
import { format } from 'date-fns';
import { computed, ref } from 'vue';

import type { CheckinColumnConfig, CheckinData, CheckinItem } from '@/types';

import RegDetails from '@/components/partials/registrations/RegDetails.vue';
import { formatDate } from '@/utils';
import { getStatusInfo } from '@/utils/status-map';
import CheckinStats from '~/components/partials/checkins/CheckinStats.vue';
import { useCheckins } from '~/composables/useCheckins';

const props = withDefaults(
  defineProps<{
    search?: string
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
    sortBy: 'check_time',
  },
);

useHead({
  title: 'Check-ins',
});

definePageMeta({
  capabilities: ['ee_read_checkins'],
  group: 'tools',
  icon: 'solar:bill-check-bold-duotone',
  layout: 'dashboard-with-sidebar',
  order: 1,
  packages: ['starter', 'smart', 'optima'],
  requiresSelectedEvent: true,
  roles: ['administrator', 'ee_event_organizer', 'ee_event_operator'],
  showInMenu: true,
  title: 'Check-ins',
});

const { event } = useEvent();
const eventId = computed(() => event.value?.id);

const route = useRoute();
const router = useRouter();

const endpoint = 'checkins';

// Selected registration ID for details modal
const selectedRegId = ref<string>((route.query.details as string) || '');

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
  date_end: props.dateEnd || '',
  date_start: props.dateStart || '',
  search: props.search || '',
});

const sorting = ref<SortingState>([
  {
    desc: props.order ? props.order.toLowerCase() === 'desc' : true,
    id: props.sortBy || 'check_time',
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
    header: 'Time',
    isHideable: true,
    isVisible: true,
    key: 'first_check_time',
    width: 15,
  },
  {
    header: 'Name',
    isHideable: true,
    isVisible: true,
    key: 'name',
    width: 20,
  },
  {
    header: 'Reg Code',
    isHideable: true,
    isVisible: true,
    key: 'code',
    width: 15,
  },
  {
    header: 'Ticket',
    isHideable: true,
    isVisible: true,
    key: 'ticket',
    width: 15,
  },
  {
    header: 'City',
    isHideable: true,
    isVisible: true,
    key: 'city',
    width: 15,
  },
  {
    header: 'History',
    isHideable: true,
    isVisible: true,
    key: 'checkin_data',
    width: 20,
  },
]);

// Define columns
const columnHelper = createColumnHelper<CheckinItem>();
const columns = computed(() => {
  return columnConfigs.value
    .filter(config => config.isVisible)
    .map((config) => {
      return columnHelper.accessor(config.key, {
        cell: (cellProps) => {
          switch (config.key) {
            case 'first_check_time': {
              const value = cellProps.getValue() as string;

              if (!value || value === '' || value === '-') {
                return h('div', { class: 'text-right text-slate-400' }, '-');
              }

              try {
                return h(
                  'div',
                  {
                    class: 'text-right text-slate-900 dark:text-slate-300 text-xs xl:text-sm',
                  },
                  [
                    h('div', { class: 'whitespace-nowrap' }, formatDate(value, 'd MMM yyyy')),
                    h(
                      'div',
                      {
                        class: 'text-xs text-slate-400 dark:text-slate-600',
                      },
                      formatDate(value, 'HH:mm'),
                    ),
                  ],
                );
              }
              catch (error) {
                console.error('Error formatting first_check_time:', value, error);
                return h('div', { class: 'text-right text-slate-400' }, 'Format error');
              }
            }
            case 'checkin_data': {
              const value = cellProps.getValue() as CheckinData[];

              if (!value || !Array.isArray(value) || value.length === 0) {
                return h('div', { class: 'text-xs text-slate-400' }, 'No history');
              }

              // Create a container div that holds all the history items
              const historyItems = value
                .filter((item: CheckinData) => item.time && item.time !== '' && item.time !== '-')
                .map((item: CheckinData, index: number) => {
                  try {
                    const date = new Date(item.time);

                    if (Number.isNaN(date.getTime())) {
                      throw new TypeError('Invalid date');
                    }

                    return h(
                      'div',
                      {
                        key: index,
                        class: 'text-xs text-slate-900 dark:text-slate-300 mb-1',
                      },
                      `${format(date, 'd MMM yyyy HH:mm')} - ${item.type}`,
                    );
                  }
                  catch (error) {
                    console.error('Error formatting checkin_data time:', item.time, item.type, error);
                    return null;
                  }
                })
                .filter(Boolean);

              // Return a single container div with all history items
              return h(
                'div',
                { class: 'space-y-1' },
                historyItems,
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
                h(
                  'span',
                  {
                    class: `text-status group-hover:underline ${getStatusInfo(stt_id).color}`,
                  },
                  cellProps.getValue() as string,
                ),
              );
            }
            default:
              return cellProps.getValue();
          }
        },
        header: config.header,
        size: config.width * 10, // Adjust size for better display
      });
    });
});

// Get checkin data using composable
const {
  checkinData,
  isLoading: isDataLoading,
  totalData,
  totalPages,
} = useCheckins(eventId, pagination, sorting, filters);

// Create table instance
const table = useVueTable({
  get columns() {
    return columns.value;
  },
  get data() {
    return checkinData.value;
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
    date_end: '',
    date_start: '',
    search: '',
  };
  pagination.value = {
    pageIndex: 0,
    pageSize: INITIAL_PAGE_SIZE,
  };
  sorting.value = [
    {
      desc: true,
      id: 'check_time',
    },
  ];
};

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

const isAnyFilterActive = computed(() => {
  return filters.value.search || filters.value.date_start || filters.value.date_end;
});

const handleOpenDetails = (id: string) => {
  selectedRegId.value = id;
};

const handleCloseDetails = () => {
  selectedRegId.value = '';
  const currentQuery = { ...route.query };
  delete currentQuery.details;
};

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
    selectedRegId.value = (newQuery.details as string) || '';
  },
  { deep: true },
);
</script>

<!-- Add the template section from the next message due to length -->
<template>
  <div class="container mx-auto flex flex-col gap-5 2xl:mx-0">
    <div class="flex flex-col">
      <header class="mb-5 flex flex-col gap-2 pt-10 sm:flex-row sm:items-start sm:justify-between">
        <h1 class="h2">
          Check-ins
        </h1>
      </header>
      <CheckinStats />
    </div>
  </div>

  <section>
    <div class="container py-4 2xl:mx-0">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div class="flex flex-col space-y-2 sm:grid sm:grid-flow-col sm:gap-2 sm:space-y-0">
          <TableSearchForm v-model="filters.search" placeholder="Search by name, reg code, or ticket..." />
          <Datepicker :date-range="dateRange" @update:date-range="handleSetDateRange" />
          <TableResetBtn v-if="isAnyFilterActive" @reset-filters="handleResetFilters" />
        </div>
      </div>
    </div>
  </section>

  <section class="relative" :class="{ 'scroll-area overflow-x-auto': !isDataLoading }">
    <div class="w-full">
      <div :style="{ minWidth: `${calculateMinWidth()}px` }">
      <div :style="{ minWidth: `${calculateMinWidth(toRef(columnConfigs), totalData)}px` }">
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
              <template v-if="isDataLoading">
                <tr v-for="index in 3" :key="index">
                  <td v-for="(column, index2) in columns" :key="index2" class="p-2">
                    <Skeleton class="h-6 w-full rounded" />
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
  <RegDetails
    :reg-details-open="selectedRegId !== ''"
    :evt-id="eventId"
    :reg-id="selectedRegId ? selectedRegId : undefined"
    @close-reg-details="handleCloseDetails"
  />
</template>
