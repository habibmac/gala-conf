<script setup lang="ts">
import { ref, computed, h, watch, toRefs } from "vue";
import { useRoute, useRouter } from "vue-router";
import { fromUnixTime, format } from "date-fns";

import {
  FlexRender,
  getCoreRowModel,
  useVueTable,
  createColumnHelper,
  type SortingState,
  type PaginationState,
} from "@tanstack/vue-table";

import { useRegs } from "@/composables/useRegs";
import { formatThousands, getStatusInfo } from "@/utils";

import RegCards from "@/components/partials/registrations/RegCards.vue";
import DropdownTicketFilter from "@/components/DropdownTicketFilter.vue";
import DropdownStatusFilter from "@/components/DropdownStatusFilter.vue";
import DropdownTableColumns from "@/components/DropdownTableColumns.vue";
import TableSearchForm from "@/components/TableSearchForm.vue";
import TablePagination from "@/components/TablePagination.vue";
import TableStatusTooltip from "@/components/TableStatusTooltip.vue";
import TransactionPanel from "@/components/partials/registrations/TransactionPanel.vue";
import TableResetBtn from "@/components/TableResetBtn.vue";
import SpinnerRing from "@/components/SpinnerRing.vue";
import BadgeFilter from "@/components/BadgeFilter.vue";
import Datepicker from "@/components/Datepicker.vue";

definePageMeta({
  title: "Registrations",
  showInMenu: true,
  order: 1,
  icon: "solar:users-group-two-rounded-bold-duotone",
  group: "reports",
  layout: "dashboard-with-sidebar",
});

interface Filter {
  search: string;
  ticket_name: string;
  status: string;
  date_start: string; // Allow undefined
  date_end: string; // Allow undefined
}

interface Reg {
  id: string;
  code: string;
  date: string;
  fullname: string;
  ticket_name: string;
  ticket_price: string;
  total: string;
  paid: string;
  status: string;
  stt_id: string;
  [key: string]: any;
}

interface ColumnConfig {
  key: string;
  header: string;
  isVisible: boolean;
  isHideable: boolean;
  width: number; // Width in percentage
}

const props = defineProps<{
  search?: string;
  ticket_name?: string;
  status?: string;
  dateStart?: string;
  dateEnd?: string;
  page?: string;
  perPage?: string;
  sortBy?: string;
  order?: string;
  detail?: string;
}>();

const {
  search,
  ticket_name,
  status,
  dateStart,
  dateEnd,
  page,
  perPage,
  sortBy,
  order,
  detail,
} = toRefs(props);

const { event } = useEvent();
const eventId = computed(() => event.value?.id);

const route = useRoute();
const router = useRouter();

const endpoint = "registrations";

// Selected registration ID and details panel state
const selectedRegId = ref<string>(detail.value || "");

// Pagination configs
const INITIAL_PAGE_SIZE = 10;
const pageSizes: (number | string)[] = [10, 20, 30, 40, 50];

const columnVisibility = ref({
  date: true,
  code: true,
  fullname: true,
  ticket_name: true,
  ticket_price: true,
  paid: true,
  status: true,
} as Record<string, boolean>);

const columnConfigs = ref<ColumnConfig[]>([
  {
    key: "date",
    header: "Date",
    isVisible: true,
    isHideable: true,
    width: 10,
  },
  {
    key: "code",
    header: "Reg Code",
    isVisible: true,
    isHideable: false,
    width: 10,
  },
  {
    key: "fullname",
    header: "Full Name",
    isVisible: true,
    isHideable: false,
    width: 20,
  },
  {
    key: "ticket_name",
    header: "Ticket",
    isVisible: true,
    isHideable: true,
    width: 15,
  },
  {
    key: "ticket_price",
    header: "Price",
    isVisible: true,
    isHideable: true,
    width: 10,
  },
  {
    key: "paid",
    header: "Paid",
    isVisible: true,
    isHideable: true,
    width: 10,
  },
  {
    key: "status",
    header: "Status",
    isVisible: true,
    isHideable: false,
    width: 10,
  },
  {
    key: "email",
    header: "Email",
    isVisible: false,
    isHideable: true,
    width: 15,
  },
  {
    key: "phone",
    header: "Phone",
    isVisible: false,
    isHideable: true,
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
  search: search.value ? String(search.value) : "",
  ticket_name: ticket_name.value ? String(ticket_name.value) : "",
  status: status.value ? String(status.value) : "",
  date_start: dateStart.value ? String(dateStart.value) : "",
  date_end: dateEnd.value ? String(dateEnd.value) : "",
});

// Computed property for date range
const dateRange = computed({
  get: () => {
    if (filters.value.date_start === "" || filters.value.date_end === "") {
      // Return null to signify "All Time" to VueDatePicker
      return null;
    }
    return [
      new Date(filters.value.date_start),
      new Date(filters.value.date_end),
    ];
  },
  set: (newValue) => {
    if (newValue === null) {
      // User clears the date range, set to "All Time"
      filters.value.date_start = "";
      filters.value.date_end = "";
    } else {
      // User selects a new date range
      [filters.value.date_start, filters.value.date_end] = newValue.map(
        (date) =>
          // Format to yyyy-MM-dd hh:mm
          format(date, "yyyy-MM-dd")
      );
    }
  },
});

const dateRangeLabel = computed(() => {
  if (filters.value.date_start === "" || filters.value.date_end === "") {
    return "";
  }
  return `${format(
    new Date(filters.value.date_start),
    "d LLL yyyy"
  )} - ${format(new Date(filters.value.date_end), "d LLL yyyy")}`;
});

// Define parseDesc to accept a string and return a boolean
const parseDesc = (order: string): boolean => order.toLowerCase() === "desc";
const sorting = ref<SortingState>([
  {
    id: sortBy.value || "date",
    desc: parseDesc(order.value || "desc"),
  },
]);

// Define columns
const columnHelper = createColumnHelper<Reg>();
const columns = computed(() => {
  return columnConfigs.value
    .filter((config) => config.isVisible)
    .map((config) => {
      return columnHelper.accessor(config.key, {
        header: config.header,
        size: config.width * 10,
        cell: (cellProps: any) => {
          // Here you can add specific cell rendering logic based on the column key
          switch (config.key) {
            case "date":
              const date = fromUnixTime(Number(cellProps.getValue()));
              return h("div", { class: "text-right text-xs" }, [
                h("div", { class: "" }, format(date, "d MMM yyyy")),
                h(
                  "div",
                  {
                    class: "text-xs text-slate-700 dark:text-slate-400",
                  },
                  format(date, "hh:mm")
                ),
              ]);
            case "code":
              const stt_id = cellProps.row.original.stt_id;
              return h(
                "a",
                {
                  href: `/dashboard/${eventId.value}/${endpoint}/${cellProps.row.original.id}`,
                  class:
                    "number text-center group inline-block whitespace-nowrap",
                  onClick: (e: Event) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleOpenDetails(cellProps.row.original.id);
                  },
                },
                h(
                  "span",
                  {
                    class: `text-status group-hover:underline ${
                      getStatusInfo(stt_id).color
                    }`,
                  },
                  cellProps.getValue()
                )
              );
            case "fullname":
              return h(
                "div",
                {
                  class:
                    "font-semibold text-left text-slate-700 dark:text-slate-300 w-full",
                },
                cellProps.getValue()
              );
            case "ticket_name":
              return h(
                "div",
                {
                  class: "text-left",
                },
                cellProps.getValue()
              );

            case "ticket_price":
            case "paid":
              return h(
                "div",
                {
                  class: "text-right pr-4",
                },
                formatThousands(cellProps.getValue())
              );
            case "status":
              return h(
                TableStatusTooltip,
                {
                  status: cellProps.row.original.stt_id,
                  size: "sm",
                  position: "top",
                },
                {
                  default: () => cellProps.getValue(),
                }
              );
            default:
              return h("div", { class: "text-left" }, cellProps.getValue());
          }
        },
      });
    });
});

// Fetch data from the API
const { regData, isLoading, totalPages, totalData } = useRegs(
  eventId,
  endpoint,
  pagination,
  sorting,
  filters
);

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
    if (typeof updater === "function") {
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
    if (typeof updater === "function") {
      setSorting(updater(sorting.value));
    } else {
      setSorting(updater);
    }
  },
  getCoreRowModel: getCoreRowModel(),
});

function setPagination({
  pageIndex,
  pageSize,
}: PaginationState): PaginationState {
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
    filters.value.date_start = "";
    filters.value.date_end = "";
  } else {
    const [start, end] = dateRange;
    if (!start || !end) {
      // Additional safety check if needed
      filters.value.date_start = "";
      filters.value.date_end = "";
    } else {
      // Format to yyyy-MM-dd
      filters.value.date_start = format(start, "yyyy-MM-dd");
      filters.value.date_end = format(end, "yyyy-MM-dd");
    }
  }
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

const handleOpenDetails = (id: string) => {
  selectedRegId.value = id; // Update the selected registration ID
};

const handleCloseDetails = () => {
  selectedRegId.value = ""; // Reset the selected registration ID
  const currentQuery = { ...route.query };
  delete currentQuery.details; // Remove the `details` query parameter
};

const isAnyFilterActive = computed(() => {
  // Check if any filter is active
  return (
    filters.value.search ||
    filters.value.ticket_name ||
    filters.value.status ||
    filters.value.date_start ||
    filters.value.date_end
  );
});

// Reset filters, sorting, and pagination to their initial state
const handleResetFilters = () => {
  filters.value = {
    search: "",
    ticket_name: "",
    status: "",
    date_start: "",
    date_end: "",
  };

  pagination.value = {
    pageIndex: 0,
    pageSize: INITIAL_PAGE_SIZE,
  };

  sorting.value = [
    {
      id: "date",
      desc: true,
    },
  ];
};

function updateColumnVisibility(newVisibility: Record<string, boolean>) {
  columnConfigs.value = columnConfigs.value.map((config) => ({
    ...config,
    isVisible: newVisibility[config.key],
  }));
}

const totalVisibleWidth = computed(() => {
  return columnConfigs.value
    .filter((config) => config.isVisible)
    .reduce((total, config) => total + config.width, 0);
});

// Watch for changes in filters, pagination, and sorting, and update the route query
watch(
  [filters, pagination, sorting, selectedRegId],
  ([newFilters, newPagination, newSorting]) => {
    const query = {
      search: newFilters.search || undefined,
      ticket: newFilters.ticket_name || undefined,
      status: newFilters.status || undefined,
      dateStart: newFilters.date_start || undefined,
      dateEnd: newFilters.date_end || undefined,
      page: newPagination.pageIndex + 1 || undefined,
      perPage: newPagination.pageSize || undefined,
      sortBy: newSorting[0]?.id || undefined,
      order: newSorting[0]?.desc ? "desc" : "asc" || undefined,
      details: selectedRegId.value || undefined,
    };
    router.push({ query });
  },
  { deep: true }
);

watch(selectedRegId, () => {
  const newQuery = { ...route.query };
  if (selectedRegId.value) {
    newQuery.details = selectedRegId.value;
  } else {
    delete newQuery.details;
  }
  router.push({ query: newQuery });
});

// Watch for changes in the route query and update the filters ref
watch(
  () => route.query,
  (newQuery) => {
    filters.value = {
      search: (newQuery.search as string) || "",
      ticket_name: (newQuery.ticket as string) || "",
      status: (newQuery.status as string) || "",
      date_start: (newQuery.dateStart as string) || "",
      date_end: (newQuery.dateEnd as string) || "",
    };
    table.getState().pagination.pageIndex = pagination.value.pageIndex;
    table.getState().pagination.pageSize = pagination.value.pageSize;
    pagination.value = {
      pageIndex: newQuery.page ? Number(newQuery.page) - 1 : 0,
      pageSize: newQuery.perPage ? Number(newQuery.perPage) : INITIAL_PAGE_SIZE,
    };
    sorting.value = [
      {
        id: (newQuery.sortBy as string) || "reg_date",
        desc: parseDesc((newQuery.order as string) || "desc"),
      },
    ];
    selectedRegId.value = (newQuery.details as string) || "";
  },
  { deep: true }
);
</script>

<template>
  <div class="container mx-auto">
    <header class="pt-10">
      <h1 class="h2 mb-5">Registrations</h1>
    </header>
    <RegCards />

    </div>

    <section>
      <!-- Search and filter -->
      <div
        class="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-8"
      >
        <!-- Left: Avatars -->
        <div
          class="justify-start gap-2 space-y-2 sm:grid sm:grid-flow-col sm:space-y-0"
        >
          <TableSearchForm
            v-model="filters.search"
            placeholder="Search Registrant..."
          />
          <DropdownTicketFilter
            v-model="filters.ticket_name"
            :evtId="eventId"
          />
          <DropdownStatusFilter v-model="filters.status" />
        </div>
        <!-- Right: Actions -->
        <div class="flex shrink-0 space-x-2 justify-self-end">
          <div class="min-w-64 grow">
            <!-- Datepicker -->
            <Datepicker
              :date-range="dateRange"
              @update:date-range="handleSetDateRange"
            />
          </div>
          <DropdownTableColumns
            v-model="columnVisibility"
            :columns="columnConfigs"
            @update:modelValue="updateColumnVisibility"
          />
        </div>
      </div>
    </section>

    <section>
      <div
        class="flex min-h-12 w-full gap-2 bg-slate-50 px-4 py-3 sm:flex-row sm:px-6 sm:py-3 dark:bg-slate-950"
        :class="[
          isAnyFilterActive
            ? 'flex-col items-start'
            : 'flex-row items-center justify-between',
        ]"
      >
        <h3 class="shrink-0">
          <span
            v-if="isAnyFilterActive"
            class="font-semibold text-slate-600 dark:text-slate-300"
            >Results for:
          </span>
          <span v-else class="font-semibold text-slate-600 dark:text-slate-200"
            >All Registrations</span
          >
        </h3>
        <div class="flex grow flex-wrap gap-2">
          <BadgeFilter
            :filter="filters.search"
            label="Search"
            @clear-filter="filters.search = ''"
          />
          <BadgeFilter
            :filter="filters.ticket_name"
            label="Ticket"
            @clear-filter="filters.ticket_name = ''"
          />
          <BadgeFilter
            :filter="filters.status"
            label="Status"
            @clear-filter="filters.status = ''"
          />
          <BadgeFilter
            :filter="dateRangeLabel"
            label="Date Range"
            @clear-filter="
              filters.date_start = '';
              filters.date_end = '';
            "
          />
          <TableResetBtn
            @click.prevent="handleResetFilters"
            v-if="isAnyFilterActive"
          />
        </div>
        <div class="number shrink-0 text-sm" v-if="!isLoading">
          <template v-if="totalData"
            >Found
            <span class="font-semibold text-slate-900 dark:text-slate-300">{{
              formatThousands(totalData)
            }}</span>
            results.</template
          >

          <div v-else>No data found.</div>
        </div>
      </div>
    </section>

    <section
      class="relative"
      :class="{ 'overflow-x-auto scroll-area': !isLoading }"
      :style="{ width: `${Math.max(100, totalVisibleWidth)}%` }"
    >
      <template v-if="isLoading">
        <div
          class="absolute z-10 h-full w-full bg-slate-500/10 dark:bg-slate-950/20 ring-0"
        ></div>
      </template>
      <table
        class="relative w-full bg-white dark:bg-transparent dark:text-slate-300/90"
      >
        <thead
          class="border-b border-t border-slate-200 bg-slate-100 text-xs uppercase dark:border-slate-900/50 dark:bg-slate-800/50 dark:text-slate-400"
        >
          <tr
            v-for="headerGroup in table.getHeaderGroups()"
            :key="headerGroup.id"
          >
            <th
              v-for="header in headerGroup.headers"
              :key="header.id"
              :colSpan="header.colSpan"
              :style="{
                minWidth: `${header.column.columnDef.size ?? 20}px`,
              }"
              class="whitespace-nowrap px-2 py-3 text-slate-500 dark:text-slate-400 hover:bg-blue-200/20 dark:hover:bg-slate-900/50 first:pl-5 last:pr-5 text-xs"
              :class="{
                'bg-blue-200/20 text-blue-600 dark:bg-slate-900/50':
                  header.column.getIsSorted(),
                'cursor-pointer select-none': header.column.getCanSort(),
              }"
              @click="
                header.column.getCanSort()
                  ? header.column.getToggleSortingHandler()?.($event)
                  : null
              "
            >
              <template v-if="!header.isPlaceholder">
                <div class="relative">
                  <FlexRender
                    :render="header.column.columnDef.header"
                    :props="header.getContext()"
                  />
                  <span
                    class="absolute right-0 text-blue-500 dark:text-slate-300"
                  >
                    <span>
                      {{
                        { asc: "↑", desc: "↓" }[
                          header.column.getIsSorted() as string
                        ]
                      }}
                    </span>
                  </span>
                </div>
              </template>
            </th>
          </tr>
        </thead>
        <tbody
          class="divide-y divide-slate-200 text-sm 2xl:text-sm dark:divide-slate-800 border-b"
        >
          <template v-if="!table.getRowModel().rows.length">
            <tr class="">
              <td colspan="10" class="py-5 text-center">
                <div
                  v-if="isLoading"
                  class="mx-auto inline-flex select-none justify-center py-20"
                >
                  <SpinnerRing
                    class="h-10 w-10 text-blue-500 dark:text-blue-400"
                  />
                </div>
                <div class="m-auto my-16 max-w-2xl" v-else>
                  <div class="px-4 text-center">
                    <div
                      class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-t from-slate-200 to-slate-100 dark:from-slate-700 dark:to-slate-800"
                    >
                      <svg class="h-6 w-5 fill-current" viewBox="0 0 20 24">
                        <path
                          class="text-slate-500 dark:text-slate-600"
                          d="M10 10.562l9-5-8.514-4.73a1 1 0 00-.972 0L1 5.562l9 5z"
                        />
                        <path
                          class="text-slate-300 dark:text-slate-400"
                          d="M9 12.294l-9-5v10.412a1 1 0 00.514.874L9 23.294v-11z"
                        />
                        <path
                          class="text-slate-400 dark:text-slate-500"
                          d="M11 12.294v11l8.486-4.714a1 1 0 00.514-.874V7.295l-9 4.999z"
                        />
                      </svg>
                    </div>
                    <h2
                      class="mb-2 text-xl font-bold text-slate-500 dark:text-slate-100"
                    >
                      No data found.
                    </h2>
                    <p class="mb-5 text-sm">
                      Try another filter or reset all filters.
                    </p>

                    <button
                      class="btn bg-blue-500 text-slate-50 hover:bg-blue-600 dark:text-slate-300"
                      @click="handleResetFilters()"
                    >
                      <svg
                        class="h-6 w-6 shrink-0 fill-current opacity-50"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="currentColor"
                          d="M17.65 6.35A7.958 7.958 0 0 0 12 4a8 8 0 0 0-8 8a8 8 0 0 0 8 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18a6 6 0 0 1-6-6a6 6 0 0 1 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4z"
                        />
                      </svg>
                      <span class="ml-2">Reset Filter</span>
                    </button>
                  </div>
                </div>
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
                'text-slate-600 bg-blue-50/50 dark:bg-slate-900/70 dark:text-slate-300':
                  cell.column.getIsSorted(),
              }"
            >
              <FlexRender
                :render="cell.column.columnDef.cell"
                :props="cell.getContext()"
              />
            </td>
          </tr>
        </tbody>
      </table>
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
    <TransactionPanel
      :transactionPanelOpen="selectedRegId !== ''"
      @close-transactionpanel="handleCloseDetails"
      :evt-id="eventId"
      :reg-id="selectedRegId ? selectedRegId : undefined"
    />
  
</template>
