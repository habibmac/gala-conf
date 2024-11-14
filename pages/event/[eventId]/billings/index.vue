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
import { formatThousands } from '@/utils';
import type { Billing, BillingFilters } from '@/types';
import { useBillings } from '~/composables/useBillings';

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
  roles: ['administrator', 'ee_event_organizer', 'ee_event_operator'],
  capabilities: ['ee_read_billings'],
});

const { event } = useEvent();
const eventId = computed(() => event.value?.id);

// Table configurations
const columnConfigs = ref([
  {
    key: 'date',
    header: 'Date',
    isVisible: true,
    isHideable: true,
    width: 15,
  },
  {
    key: 'description',
    header: 'Description',
    isVisible: true,
    isHideable: false,
    width: 30,
  },
  {
    key: 'type',
    header: 'Type',
    isVisible: true,
    isHideable: true,
    width: 15,
  },
  {
    key: 'amount',
    header: 'Amount',
    isVisible: true,
    isHideable: false,
    width: 15,
  },
  {
    key: 'status',
    header: 'Status',
    isVisible: true,
    isHideable: false,
    width: 15,
  },
]);

// Pagination configs
const INITIAL_PAGE_SIZE = 10;
const pageSizes = [10, 20, 30, 40, 50];

// Pagination state
const pagination = ref<PaginationState>({
  pageIndex: 0,
  pageSize: INITIAL_PAGE_SIZE,
});

// Filters
const filters = ref<BillingFilters>({
  search: '',
  type: '',
  status: '',
  date_start: '',
  date_end: '',
});

// Sorting state
const sorting = ref<SortingState>([
  {
    id: 'date',
    desc: true,
  },
]);

// Define columns
const columnHelper = createColumnHelper<Billing>();
const columns = computed(() => {
  return columnConfigs.value
    .filter((config) => config.isVisible)
    .map((config) => {
      return columnHelper.accessor(config.key, {
        header: config.header,
        size: config.width * 10,
        cell: (info) => {
          const value = info.getValue();
          
          switch (config.key) {
            case 'date':
              return format(new Date(value), 'dd MMM yyyy');
            case 'amount':
              return formatThousands(value);
            case 'status':
              return value ? value.charAt(0).toUpperCase() + value.slice(1) : '';
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
  summary,
  isLoading 
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
  pagination.value.pageIndex = pageNumber - 1;
};
</script>

<template>
  <div class="container mx-auto 2xl:mx-0">
    <header class="pt-10 mb-5">
      <h1 class="h2">Billings</h1>
    </header>

    <section>
      <div class="flex flex-col justify-between items-center min-h-12 w-full gap-2 bg-slate-50 px-4 py-2 sm:flex-row sm:px-6 sm:py-2 dark:bg-slate-950">
        <div>
          <TableSearchForm v-model="filters.search" placeholder="Search billings..." />
        </div>
      </div>
    </section>

    {{billingData}}

    <section class="relative overflow-x-auto">
      <table class="w-full bg-white dark:bg-transparent dark:text-slate-300/90">
        <thead class="border-b border-t border-slate-200 bg-slate-100 text-xs uppercase dark:border-slate-900/50 dark:bg-slate-800/50 dark:text-slate-400">
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
          <tr
            v-for="row in table.getRowModel().rows"
            :key="row.id"
            class="hover:bg-slate-50 dark:hover:bg-slate-950/20"
          >
            <td
              v-for="cell in row.getVisibleCells()"
              :key="cell.id"
              class="px-2 py-3 first:pl-5 last:pr-5"
            >
              <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <TablePagination
      v-if="table.getRowModel().rows.length > 0"
      :currentPage="table.getState().pagination.pageIndex + 1"
      :pageCount="Math.ceil(billingData.length / pagination.pageSize)"
      :pageSizes="pageSizes"
      :pageSize="table.getState().pagination.pageSize"
      :totalData="billingData.length"
      @update:pageSize="handlePageSizeChange"
      @update:currentPage="handleNavigation"
    />
  </div>
</template>