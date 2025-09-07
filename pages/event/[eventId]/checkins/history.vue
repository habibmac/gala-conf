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
import { toast } from 'vue-sonner';

import type { CheckinColumnConfig, CheckinItem } from '@/types';

import RegPanel from '@/components/partials/registrations/RegPanel.vue';
import RegCode from '@/components/statuses/RegCode.vue';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate } from '@/utils';
import CheckinTabs from '~/components/partials/checkins/CheckinTabs.vue';
import { useCheckins } from '~/composables/useCheckins';
import { useDatetimes } from '~/composables/useDatetimes';

const props = withDefaults(
  defineProps<{
    search?: string
    dateStart?: string
    dateEnd?: string
    page?: string
    perPage?: string
    sortBy?: string
    order?: string
    datetime?: string // Add datetime prop
  }>(),
  {
    dateEnd: '',
    dateStart: '',
    order: 'desc',
    page: '1',
    perPage: '10',
    search: '',
    sortBy: 'check_time',
    datetime: '', // Default to empty (all sessions)
  },
);

useHead({
  title: 'Check-ins - History',
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
  showInMenu: false, // Don't show in menu since it's a sub-page
  title: 'Check-ins - History',
});

const route = useRoute();
const router = useRouter();

// Flag to prevent infinite loops between watchers
const isUpdatingFromQuery = ref(false);

const eventId = ref<string>(route.params.eventId as string);

const endpoint = 'checkins';

// Add datetime filter using the composable
const {
  datetimes,
  selectedDatetime,
  selectedDatetimeInfo,
  setSelectedDatetime,
  isLoading: isDatetimesLoading,
} = useDatetimes(eventId);

// Initialize datetime from URL
onMounted(() => {
  if (props.datetime) {
    setSelectedDatetime(props.datetime);
  }
});

// Selected registration ID for details modal
const selectedRegId = ref<string>((route.query.details as string) || '');

// Pagination configs
const INITIAL_PAGE_SIZE = 10;
const pageSizes = [10, 20, 30, 40, 50];

const pagination = ref<PaginationState>({
  pageIndex: props.page ? Number(props.page) - 1 : 0,
  pageSize: props.perPage ? Number(props.perPage) : INITIAL_PAGE_SIZE,
});

// Create separate refs for each filter
const searchFilter = ref(props.search || '');
const dateStartFilter = ref(props.dateStart || '');
const dateEndFilter = ref(props.dateEnd || '');
const actionTypeFilter = ref<'all' | 'checkin' | 'checkout'>('all');
const ticketNameFilter = ref<string[]>([]);

// Use computed to combine all filters - this automatically updates when selectedDatetime changes
const filters = computed(() => ({
  datetime_end: dateEndFilter.value,
  datetime_start: dateStartFilter.value,
  search: searchFilter.value, // Search in all fields (reg code, notes, etc.)
  datetime: selectedDatetime.value, // Automatically reactive
  action_type: actionTypeFilter.value,
  ticket_name: ticketNameFilter.value,
}));

const sorting = ref<SortingState>([
  {
    desc: props.order ? props.order.toLowerCase() === 'desc' : true,
    id: props.sortBy || 'check_time',
  },
]);

const dateRange = computed(() => {
  if (dateStartFilter.value && dateEndFilter.value) {
    return [new Date(dateStartFilter.value), new Date(dateEndFilter.value)];
  }
  return null;
});

// Handle datetime filter change
const handleDatetimeChange = (datetimeId: string) => {
  setSelectedDatetime(datetimeId); // This automatically updates filters.datetime

  pagination.value.pageIndex = 0; // Reset pagination

  // Update URL
  const query = { ...route.query, datetime: datetimeId || undefined };
  if (!datetimeId) {
    delete query.datetime;
  }
  router.push({ query });
};

// Export state
const { exportData } = useExport();
const isExporting = ref(false);

// Table configurations
const columnConfigs = ref<CheckinColumnConfig[]>([
  {
    header: 'Check Time',
    isHideable: true,
    isVisible: true,
    key: 'check_time',
    width: 15,
  },
  {
    header: 'Action',
    isHideable: true,
    isVisible: true,
    key: 'action',
    width: 10,
  },
  {
    header: 'Session',
    isHideable: true,
    isVisible: true,
    key: 'session',
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
    header: 'Notes',
    isHideable: true,
    isVisible: true,
    key: 'notes',
    width: 10,
  },
]);

// Define columns
const columnHelper = createColumnHelper<CheckinItem>();
const columns = computed(() => {
  return columnConfigs.value
    .filter(config => config.isVisible)
    .map((config) => {
      // Handle special cases for non-direct keys
      const accessor = config.key === 'checkin_data' ? 'checkin_data' : config.key;

      return columnHelper.accessor(accessor as keyof CheckinItem, {
        enableSorting: ['action', 'check_time', 'code', 'name', 'notes', 'session', 'ticket'].includes(config.key),
        cell: (cellProps) => {
          switch (config.key) {
            case 'check_time': {
              const value = cellProps.getValue() as string;

              if (!value || value === '' || value === '-') {
                return h('div', { class: 'text-right text-slate-400' }, '-');
              }

              try {
                return h(
                  'div',
                  {
                    class: 'text-right text-slate-900 dark:text-slate-300  text-sm',
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
                console.error('Error formatting check_time:', value, error);
                return h('div', { class: 'text-right text-slate-400' }, 'Format error');
              }
            }
            case 'action': {
              const action = cellProps.getValue() as string;
              const isCheckin = action === 'checkin';

              return h(
                'div',
                {
                  class: `text-center px-2 py-1 rounded text-xs font-medium ${
                    isCheckin
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`,
                },
                isCheckin ? 'Check In' : 'Check Out',
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
                  class: 'block number text-center group whitespace-nowrap',
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
                    class: 'group-hover:underline',
                  }),
                ],
              );
            }
            case 'ticket': {
              const value = cellProps.getValue() as string;

              return h(
                'div',
                {
                  class: 'font-medium text-slate-900 dark:text-slate-300',
                },
                value || '-',
              );
            }
            case 'notes': {
              const notes = cellProps.getValue() as string;

              if (!notes || notes.trim() === '') {
                return h('div', { class: 'text-xs text-slate-400' }, '-');
              }

              return h(
                'div',
                { class: 'text-xs text-slate-600 dark:text-slate-400 p-2 rounded border-l-2 border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800' },
                notes,
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

// Get checkin data using composable (with updated filters)
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
  enableMultiSort: false,
  getCoreRowModel: getCoreRowModel(),
  manualFiltering: true,
  manualPagination: true,
  manualSorting: true,
  onPaginationChange: (updater) => {
    if (typeof updater === 'function') {
      pagination.value = updater(pagination.value);
    }
    else {
      pagination.value = updater;
    }
  },
  onSortingChange: (updater) => {
    if (typeof updater === 'function') {
      sorting.value = updater(sorting.value);
    }
    else {
      sorting.value = updater;
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

const handleResetFilters = () => {
  searchFilter.value = '';
  dateStartFilter.value = '';
  dateEndFilter.value = '';
  actionTypeFilter.value = 'all';
  ticketNameFilter.value = [];
  setSelectedDatetime(''); // This automatically updates filters.datetime

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
    dateStartFilter.value = '';
    dateEndFilter.value = '';
  }
  else {
    const [start, end] = dateRange;
    if (!start || !end) {
      dateStartFilter.value = '';
      dateEndFilter.value = '';
    }
    else {
      dateStartFilter.value = format(start, 'yyyy-MM-dd HH:mm');
      dateEndFilter.value = format(end, 'yyyy-MM-dd HH:mm');
    }
  }
};

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

// Update to use computed filters
const isAnyFilterActive = computed(() => {
  return searchFilter.value || dateStartFilter.value || dateEndFilter.value || selectedDatetime.value;
});

const handleOpenDetails = (id: string) => {
  selectedRegId.value = id;
};

const handleCloseDetails = () => {
  selectedRegId.value = '';
  const currentQuery = { ...route.query };
  delete currentQuery.details;
};

const handleHeaderClick = (header: any) => {
  if (header.column.getCanSort()) {
    try {
      header.column.toggleSorting();
    }
    catch (error) {
      console.error('Error toggling sort:', error);
    }
  }
};

// Watchers
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

// Add watchers to sync state with URL (similar to other pages)
watch(
  [filters, pagination, sorting],
  ([newFilters, newPagination, newSorting]) => {
    if (isUpdatingFromQuery.value) {
      return;
    }

    const query = {
      search: newFilters.search || undefined,
      dateStart: newFilters.datetime_start || undefined,
      dateEnd: newFilters.datetime_end || undefined,
      datetime: newFilters.datetime || undefined,
      actionType: newFilters.action_type !== 'all' ? newFilters.action_type : undefined,
      ticketName: newFilters.ticket_name && newFilters.ticket_name.length > 0 ? newFilters.ticket_name.join(',') : undefined,
      order: newSorting[0]?.desc ? 'desc' : 'asc',
      page: String(newPagination.pageIndex + 1),
      perPage: String(newPagination.pageSize),
      sortBy: newSorting[0]?.id || undefined,
    };
    router.push({ query });
  },
  { deep: true },
);

watch(
  () => route.query,
  (newQuery) => {
    isUpdatingFromQuery.value = true;

    searchFilter.value = (newQuery.search as string) || '';
    dateStartFilter.value = (newQuery.dateStart as string) || '';
    dateEndFilter.value = (newQuery.dateEnd as string) || '';
    actionTypeFilter.value = (newQuery.actionType as 'all' | 'checkin' | 'checkout') || 'all';
    ticketNameFilter.value = newQuery.ticketName ? (newQuery.ticketName as string).split(',') : [];

    if (newQuery.datetime) {
      setSelectedDatetime(newQuery.datetime as string);
    }

    pagination.value = {
      pageIndex: Math.max(0, Number(newQuery.page || 1) - 1),
      pageSize: Number(newQuery.perPage || INITIAL_PAGE_SIZE),
    };

    sorting.value = [
      {
        desc: (newQuery.order as string || 'desc').toLowerCase() === 'desc',
        id: (newQuery.sortBy as string) || 'check_time',
      },
    ];

    selectedRegId.value = (newQuery.details as string) || '';

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
        <div class="flex items-center justify-between gap-4">
          <h1 class="h2">
            Check-ins
          </h1>
          <CheckinTabs />
        </div>

        <!-- Use the new component -->
        <DropdownDatetimeFilter
          :datetimes="datetimes"
          :selected-datetime="selectedDatetime"
          :is-loading="isDatetimesLoading"
          @update:selected-datetime="handleDatetimeChange"
        />
      </header>

      <!-- Alert info -->
      <Card v-if="selectedDatetimeInfo" class="mb-4 border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/50">
        <CardContent class="pt-6">
          <div class="flex items-start space-x-4">
            <div class="rounded-full bg-blue-100 p-2 dark:bg-blue-900">
              <Icon icon="solar:calendar-mark-bold-duotone" class="size-6 text-blue-600" />
            </div>
            <div class="flex-1">
              <h3 class="font-semibold text-blue-700 dark:text-blue-300">
                Showing check-ins for
                <span v-if="selectedDatetimeInfo" class="font-bold">{{ selectedDatetimeInfo.name }}</span>
                <span v-else class="font-bold">all sessions</span>
              </h3>
              <p class="mt-1 text-sm text-blue-600 dark:text-blue-400">
                {{ formatDateRange(selectedDatetimeInfo.date_start, selectedDatetimeInfo.date_end) }}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>

  <div class="container mx-auto space-y-4">
    <section class="space-y-6">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div class="flex flex-col space-y-2 sm:grid sm:grid-flow-col sm:gap-2 sm:space-y-0">
          <!-- Unified search input -->
          <TableSearchForm
            v-model="searchFilter"
            placeholder="Search by reg code, notes..."
            @update:model-value="pagination.pageIndex = 0"
          />

          <!-- Ticket Filter -->
          <DropdownTicketFilter v-model="ticketNameFilter" @update:model-value="pagination.pageIndex = 0" />

          <!-- Action Type Dropdown -->
          <Select v-model="actionTypeFilter" @update:model-value="pagination.pageIndex = 0">
            <SelectTrigger class="h-[42px] w-[140px]">
              <SelectValue placeholder="Action type..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div class="flex items-center">
                  <Icon icon="heroicons:arrows-right-left" class="mr-2 size-4" />
                  All Actions
                </div>
              </SelectItem>
              <SelectItem value="checkin">
                <div class="flex items-center">
                  <Icon icon="heroicons:arrow-right-on-rectangle" class="mr-2 size-4 text-green-600" />
                  Check-ins Only
                </div>
              </SelectItem>
              <SelectItem value="checkout">
                <div class="flex items-center">
                  <Icon icon="heroicons:arrow-left-on-rectangle" class="mr-2 size-4 text-red-600" />
                  Check-outs Only
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <Datepicker
            :date-range="dateRange"
            :enable-time-picker="true"
            format="d MMM yyyy HH:mm"
            class="w-full sm:min-w-[320px]"
            @update:date-range="handleSetDateRange"
            @update:model-value="pagination.pageIndex = 0"
          />

          <TableResetBtn v-if="isAnyFilterActive" @reset-filters="handleResetFilters" />
        </div>
        <div>
          <!-- Export Dropdown -->
          <DropdownMenu v-if="!isDataLoading">
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
                <Icon icon="tabler:file-type-csv" class="mr-2 size-4 text-muted-foreground" />
                Export to CSV
              </DropdownMenuItem>
              <DropdownMenuItem :disabled="isExporting" @click="handleExport('xlsx')">
                <Icon icon="tabler:file-type-xls" class="mr-2 size-4 text-muted-foreground" />
                Export to XLSX
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </section>

    <!-- Table section -->
    <section class=" relative mb-20" :class="{ 'scroll-area overflow-auto': !isDataLoading }">
      <Card>
        <CardHeader class="flex justify-between">
          <CardTitle class="flex items-center justify-between gap-2 text-sm">
            <div class="flex items-center gap-2">
              <h2 class=" font-medium tracking-normal ">
                Check-in Records
              </h2>
              <span v-if="selectedDatetimeInfo" class="text-muted-foreground">
                - {{ selectedDatetimeInfo.name }}
              </span>
            </div>
            <!-- Total records -->
            <div>
              <span v-if="!isDataLoading" class="text-xs text-slate-500 dark:text-slate-400">
                {{ totalData }} record{{ totalData !== 1 ? 's' : '' }}
              </span>
              <span v-else class="text-xs text-slate-500 dark:text-slate-400">
                Loading...
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent class="overflow-x-auto p-0">
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
                    :class="[
                      header.column.getCanSort() ? 'cursor-pointer select-none hover:bg-slate-200 dark:hover:bg-slate-700' : '',
                    ]"
                    @click="handleHeaderClick(header)"
                  >
                    <div class="flex items-center gap-2">
                      <FlexRender :render="header.column.columnDef.header" :props="header.getContext()" />
                      <Icon
                        v-if="header.column.getCanSort()"
                        :icon="
                          header.column.getIsSorted() === 'desc'
                            ? 'heroicons:chevron-down'
                            : header.column.getIsSorted() === 'asc'
                              ? 'heroicons:chevron-up'
                              : 'heroicons:chevron-up-down'
                        "
                        class="size-3 transition-colors"
                        :class="[
                          header.column.getIsSorted()
                            ? 'text-slate-900 dark:text-slate-100'
                            : 'text-slate-400 dark:text-slate-600',
                        ]"
                      />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200 text-sm dark:divide-slate-800">
                <template v-if="!table.getRowModel().rows.length">
                  <template v-if="isDataLoading">
                    <tr v-for="index in 3" :key="index">
                      <td v-for="(_, index2) in columns" :key="index2" class="p-2">
                        <Skeleton class="h-6 w-full rounded" />
                      </td>
                    </tr>
                  </template>
                  <tr v-else>
                    <td :colspan="columns.length" class="py-10 text-center">
                      <EmptyState
                        title="No check-ins found"
                        description="There are no check-ins matching your criteria."
                        icon="solar:sleeping-square-bold-duotone"
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
        </CardContent>
        <CardFooter v-if="!isDataLoading" class="border-t p-0">
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
  </div>

  <div class="mb-20">
    <RegPanel
      :reg-details-open="selectedRegId !== ''"
      :evt-id="eventId"
      :reg-id="selectedRegId ? selectedRegId : undefined"
      @close-reg-details="handleCloseDetails"
    />
  </div>
</template>
