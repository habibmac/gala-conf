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

definePageMeta({
  title: 'Insight',
  showInMenu: false,
  order: 1,
  icon: 'solar:users-group-two-rounded-bold-duotone',
  group: 'reports',
  layout: 'dashboard-with-sidebar',
});

const props = defineProps<{
  search?: string;
  ticket_name?: string;
  page?: string;
  perPage?: string;
  sortBy?: string;
  order?: string;
}>();

const { search, ticket_name, page, perPage, sortBy, order } = toRefs(props);

const route = useRoute();
const router = useRouter();
const eventId = computed(() => route.params.eventId as string);
const insightId = computed(() => route.params.insightId as string);

const activeTab = computed(() => {
  // Get first tab from insightData
  const firstTab = insightData.value?.groups[0]?.name;

  // Get the tab from the query or use the first tab
  return route.query.group ?? firstTab;
});

// Pagination configs
const INITIAL_PAGE_SIZE = 10;
const pageSizes: (number | string)[] = [10, 20, 30, 40, 50];

const pagination = ref({ pageIndex: 0, pageSize: 10 });
const filters = ref({
  search: search.value || '',
  ticket_name: ticket_name.value || '',
  status: 'approved',
});

// Define parseDesc to accept a string and return a boolean
const parseDesc = (order: string): boolean => order.toLowerCase() === 'desc';
const sorting = ref<SortingState>([
  {
    id: sortBy.value || 'date',
    desc: parseDesc(order.value || 'desc'),
  },
]);

const { insightData, regData, ticketGroups, totalData, totalPages, error, isLoading } = useInsight(
  eventId,
  route.params.insightId as string,
  pagination,
  sorting,
  filters
);

// Table configuration
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
  ...getCustomFieldsColumns(insightData.value?.fields ?? []),
]);

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
    ticket_name: '',
    status: 'Approved',
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
  router.push({
    query: {
      ...route.query,
      group: tab,
    },
  });
  // Update filter.ticket_name based on the selected tab
  filters.value.ticket_name =
    ticketGroups.value
      .find((group: TicketGroup) => group.name === tab)
      ?.tickets.map((ticket: TicketList) => ticket.name)
      .join(',') ?? '';
};

const tabIndicatorClass = computed(() => {
  const index = ticketGroups.value?.findIndex((group: TicketGroup) => group.name === activeTab.value) ?? 0;
  return `translate(${index * 100}%)`;
});

const tabIndicatorWidth = computed(() => {
  const tabCount = ticketGroups.value?.length ?? 1;
  return `calc(100% / ${tabCount})`;
});
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
      <div v-if="isLoading" class="grid gap-4 grid-cols-12">
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
    </div>
  </section>

  <section>
    <div
      class="flex flex-col justify-between items-center min-h-12 w-full gap-2 bg-slate-50 px-4 py-2 sm:flex-row sm:px-6 sm:py-2 dark:bg-slate-950"
    >
      <div class="">
        <TableSearchForm v-model="filters.search" placeholder="Search Registrant..." />
      </div>

      <div v-if="!isLoading && !isLoading" class="number shrink-0 text-slate-500 text-sm">
        <template v-if="totalData"
          >Found
          <span class="font-semibold text-slate-900 dark:text-slate-300">{{ formatThousands(totalData) }}</span>
          results.</template
        >
        <div v-else>No data found.</div>
      </div>
    </div>
  </section>

  <section class="relative" :class="{ 'overflow-x-auto scroll-area': !isLoading }">
    <div
      class="w-full overflow-x-auto scroll-area scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700"
    >
      <div :style="{ minWidth: `${calculateMinWidth()}px` }">
        <template v-if="isLoading">
          <div class="absolute z-10 h-full w-full bg-slate-500/10 dark:bg-slate-950/20 ring-0"></div>
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
              <tr class="">
                <td colspan="10" class="py-5 text-center">
                  <div v-if="isLoading" class="mx-auto inline-flex select-none justify-center py-20">
                    <SpinnerRing class="h-10 w-10 text-blue-500 dark:text-blue-400" />
                  </div>
                  <NoData v-else @reset-filters="handleResetFilters" />
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
