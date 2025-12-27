<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import type { PaginationState, SortingState } from '@tanstack/vue-table';
import { Icon } from '@iconify/vue';
import {
  createColumnHelper,
  FlexRender,
  getCoreRowModel,
  useVueTable,
} from '@tanstack/vue-table';
import { formatDistanceToNow } from 'date-fns';
import { computed, nextTick, ref, toRef, watch } from 'vue';

import type { ColumnConfig, Paper, PaperFilters } from '@/types/papers';
import { mockTopics } from '@/mocks/papers';
import { calculateMinWidth } from '@/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Card from '~/components/ui/card/Card.vue';
import CardContent from '~/components/ui/card/CardContent.vue';
import CardFooter from '~/components/ui/card/CardFooter.vue';
import CardHeader from '~/components/ui/card/CardHeader.vue';
import CardTitle from '~/components/ui/card/CardTitle.vue';
import Checkbox from '~/components/ui/checkbox/Checkbox.vue';
import Select from '~/components/ui/select/Select.vue';
import SelectContent from '~/components/ui/select/SelectContent.vue';
import SelectItem from '~/components/ui/select/SelectItem.vue';
import SelectTrigger from '~/components/ui/select/SelectTrigger.vue';
import SelectValue from '~/components/ui/select/SelectValue.vue';
import Skeleton from '~/components/ui/skeleton/Skeleton.vue';
import EmptyState from '~/components/EmptyState.vue';
import TablePagination from '~/components/TablePagination.vue';
import TableSearchForm from '~/components/TableSearchForm.vue';
import TableResetBtn from '~/components/TableResetBtn.vue';
import PaperStatusBadge from '~/components/papers/PaperStatusBadge.vue';
import RegCode from '~/components/statuses/RegCode.vue';
import DropdownReviewerFilter from '~/components/DropdownReviewerFilter.vue';

const props = withDefaults(
  defineProps<{
    search?: string
    status?: string
    topic?: string
    reviewers?: string
    page?: string
    perPage?: string
    sortBy?: string
    order?: string
  }>(),
  {
    order: 'desc',
    page: '1',
    perPage: '10',
    search: '',
    status: '',
    sortBy: 'submitted_at',
    topic: '',
    reviewers: '',
  },
);

useHead({
  title: 'Paper Submissions',
});

definePageMeta({
  capabilities: [],
  group: 'conf',
  icon: 'solar:notebook-bookmark-bold-duotone',
  layout: 'dashboard-with-sidebar',
  order: 1,
  requiresSelectedEvent: true,
  roles: ['administrator', 'ee_event_organizer', 'ee_event_operator'],
  showInMenu: true,
  title: 'Submissions',
});

// Route and router
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

const filters = ref<PaperFilters>({
  search: props.search || '',
  status: (props.status as PaperStatus) || undefined,
  topic_id: props.topic || '',
  reviewer_ids: props.reviewers ? props.reviewers.split(',').filter(Boolean) : [],
});

const sorting = ref<SortingState>([
  {
    desc: props.order ? props.order.toLowerCase() === 'desc' : true,
    id: props.sortBy || 'submitted_at',
  },
]);

// Bulk selection state
const selectedPapers = ref<Set<string>>(new Set());

// Add helper function for parsing sort order
const parseDesc = (order: string): boolean => order.toLowerCase() === 'desc';

// Table configurations
const columnConfigs = ref<ColumnConfig[]>([
  {
    header: 'Select',
    isHideable: false,
    isVisible: true,
    key: 'select',
    width: 5,
  },
  {
    header: 'Title',
    isHideable: false,
    isVisible: true,
    key: 'title',
    width: 25,
  },
  {
    header: 'Topic',
    isHideable: true,
    isVisible: true,
    key: 'topic',
    width: 15,
  },
  {
    header: 'Registrant',
    isHideable: true,
    isVisible: true,
    key: 'registrant',
    width: 15,
  },
  {
    header: 'Reg Code',
    isHideable: true,
    isVisible: true,
    key: 'reg_code',
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
    header: 'Reviews',
    isHideable: true,
    isVisible: true,
    key: 'review_count',
    width: 8,
  },
  {
    header: 'Submitted',
    isHideable: true,
    isVisible: true,
    key: 'submitted_at',
    width: 12,
  },
  {
    header: 'Actions',
    isHideable: false,
    isVisible: true,
    key: 'actions',
    width: 15,
  },
]);

// Define columns
const columnHelper = createColumnHelper<Paper>();
const columns = computed(() => {
  return columnConfigs.value
    .filter(config => config.isVisible)
    .map((config) => {
      const key = config.key === 'status' ? 'current_status' : config.key;
      return columnHelper.accessor(key as keyof Paper, {
        cell: (info) => {
          const value = info.getValue();
          const paper = info.row.original;

          switch (config.key) {
            case 'select':
              return h('div', { class: 'flex items-center justify-center' }, [
                h(Checkbox, {
                  checked: selectedPapers.value.has(paper.paper_id),
                  'onUpdate:checked': () => togglePaper(paper.paper_id),
                }),
              ]);
            case 'title':
              return h('div', {}, [
                h('a', {
                  href: `/event/${eventId.value}/papers/details/${paper.paper_id}`,
                  class: 'font-medium text-primary hover:underline',
                  onClick: (e: MouseEvent) => {
                    e.preventDefault();
                    navigateTo(`/event/${eventId.value}/papers/details/${paper.paper_id}`);
                  },
                }, paper.title),
                h('p', {
                  class: 'text-xs text-muted-foreground mt-1',
                }, paper.authors.map(a => a.name).join(', ')),
              ]);
            case 'topic':
              return h('div', {
                class: 'text-sm',
              }, paper.topic.name);
            case 'registrant':
              return h('div', { class: 'text-sm' }, [
                h('p', { class: 'font-medium' }, paper.registration.registrant_name),
                h('p', { class: 'text-xs text-muted-foreground' }, paper.registration.registrant_email),
              ]);
            case 'reg_code':
              return h(RegCode, {
                code: paper.registration.registration_id,
                statusId: paper.registration.registration_status_id,
                size: 'sm',
              });
            case 'status':
              return h(PaperStatusBadge, { status: paper.current_status });
            case 'review_count':
              return h('div', {
                class: 'text-center',
              }, [
                h(Badge, {
                  variant: 'secondary',
                  class: 'rounded-full',
                }, () => String(paper.review_count)),
              ]);
            case 'submitted_at':
              return h('div', {
                class: 'whitespace-nowrap text-sm',
              }, formatDistanceToNow(new Date(value as string), { addSuffix: true }));
            case 'actions':
              return h('div', {
                class: 'flex gap-2 justify-end',
              }, [
                h(Button, {
                  variant: 'outline',
                  size: 'sm',
                  onClick: () => navigateTo(`/event/${eventId.value}/papers/details/${paper.paper_id}`),
                }, () => 'View'),
                h(Button, {
                  variant: 'outline',
                  size: 'sm',
                  onClick: () => handleAssignReviewer(paper.paper_id),
                }, () => 'Assign'),
              ]);
            default:
              return value;
          }
        },
        header: config.header,
        size: config.width * 10,
      });
    });
});

// Get paper data using TanStack Query
const { getAllPapers, bulkChangePaperStatus } = usePapers(eventId.value);

const { data, isLoading, error, refetch } = useQuery({
  enabled: !!eventId.value,
  queryFn: () => getAllPapers(filters.value),
  queryKey: ['papers', eventId, filters, pagination, sorting],
  staleTime: 1000 * 30, // 30 seconds
});

const papers = computed(() => data.value?.papers || []);
const totalData = computed(() => data.value?.total || 0);
const totalPages = computed(() => data.value?.total_pages || 1);

// Create table instance
const table = useVueTable({
  get columns() {
    return columns.value;
  },
  get data() {
    return papers.value;
  },
  getCoreRowModel: getCoreRowModel(),
  state: {
    pagination: pagination.value,
    get sorting() {
      return sorting.value;
    },
  },
});

// Computed stats
const stats = computed(() => {
  const total = totalData.value;
  const pending = papers.value.filter(p => p.current_status === 'abstract_submitted').length;
  const underReview = papers.value.filter(p => p.current_status === 'under_review' || p.current_status === 'abstract_submitted').length;
  const accepted = papers.value.filter(p => p.current_status === 'full_paper_accepted').length;
  return { total, pending, underReview, accepted };
});

// Status options
const statusOptions = [
  { value: 'abstract_submitted', label: 'Abstract Submitted' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'abstract_approved', label: 'Abstract Approved' },
  { value: 'abstract_rejected', label: 'Abstract Rejected' },
  { value: 'full_paper_submitted', label: 'Full Paper Submitted' },
  { value: 'full_paper_accepted', label: 'Full Paper Accepted' },
  { value: 'full_paper_rejected', label: 'Full Paper Rejected' },
];

// Bulk selection helpers
const isAllSelected = computed(() => {
  return papers.value.length > 0 && selectedPapers.value.size === papers.value.length;
});

const toggleAll = () => {
  if (isAllSelected.value) {
    selectedPapers.value.clear();
  }
  else {
    selectedPapers.value.clear();
    papers.value.forEach(p => selectedPapers.value.add(p.paper_id));
  }
};

const togglePaper = (paperId: string) => {
  if (selectedPapers.value.has(paperId)) {
    selectedPapers.value.delete(paperId);
  }
  else {
    selectedPapers.value.add(paperId);
  }
};

// Bulk actions
const selectedBulkStatus = ref<string>('');
const isBulkActionLoading = ref(false);

const handleBulkStatusChange = async () => {
  if (!selectedBulkStatus.value || selectedPapers.value.size === 0)
    return;

  try {
    isBulkActionLoading.value = true;
    await bulkChangePaperStatus(
      Array.from(selectedPapers.value),
      selectedBulkStatus.value as PaperStatus,
    );
    selectedPapers.value.clear();
    selectedBulkStatus.value = '';
    await refetch();
  }
  catch (error) {
    console.error('Failed to bulk change status:', error);
  }
  finally {
    isBulkActionLoading.value = false;
  }
};

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
    search: '',
    status: undefined,
    topic_id: '',
    reviewer_ids: [],
  };

  pagination.value = {
    pageIndex: 0,
    pageSize: INITIAL_PAGE_SIZE,
  };

  sorting.value = [
    {
      desc: true,
      id: 'submitted_at',
    },
  ];

  selectedPapers.value.clear();
};

// Add computed for checking if any filters are active
const isAnyFilterActive = computed(() => {
  return filters.value.search || filters.value.status || filters.value.topic_id || (filters.value.reviewer_ids && filters.value.reviewer_ids.length > 0);
});

// Handler functions
const handleAssignReviewer = (paperId: string) => {
  navigateTo(`/event/${eventId.value}/papers/details/${paperId}`);
};

// Add watchers to sync state with URL
watch(
  [filters, pagination, sorting],
  ([newFilters, newPagination, newSorting]) => {
    if (isUpdatingFromQuery.value) {
      return;
    }

    const query = {
      topic: newFilters.topic_id || undefined,
      reviewers: newFilters.reviewer_ids && newFilters.reviewer_ids.length > 0 ? newFilters.reviewer_ids.join(',') : undefined,
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
      topic_id: (newQuery.topic as string) || '',
      reviewer_ids: (newQuery.reviewers as string) ? (newQuery.reviewers as string).split(',').filter(Boolean) : [],
      search: (newQuery.search as string) || '',
      status: (newQuery.status as PaperStatus) || undefined,
    };

    pagination.value = {
      pageIndex: Math.max(0, Number(newQuery.page || 1) - 1),
      pageSize: Number(newQuery.perPage || INITIAL_PAGE_SIZE),
    };

    sorting.value = [
      {
        desc: parseDesc((newQuery.order as string) || 'desc'),
        id: (newQuery.sortBy as string) || 'submitted_at',
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
        <div>
          <h1 class="h2 mb-2">
            Paper Submissions
          </h1>
          <p class="text-muted-foreground">
            Manage paper submissions, assign reviewers, and track review progress
          </p>
        </div>
      </header>

      <!-- Statistics Cards -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent class="p-6">
            <div class="flex items-center">
              <div class="shrink-0">
                <div class="rounded-lg p-3 bg-gray-50 dark:bg-gray-900/20">
                  <Icon icon="solar:document-text-linear" class="h-6 w-6 text-gray-500" />
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-muted-foreground uppercase">
                    Total
                  </dt>
                  <dd class="flex items-baseline">
                    <div class="text-2xl font-semibold tracking-tight text-foreground">
                      {{ stats.total }}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="p-6">
            <div class="flex items-center">
              <div class="shrink-0">
                <div class="rounded-lg p-3 bg-yellow-50 dark:bg-yellow-900/20">
                  <Icon icon="solar:clock-circle-linear" class="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-muted-foreground uppercase">
                    Pending
                  </dt>
                  <dd class="flex items-baseline">
                    <div class="text-2xl font-semibold tracking-tight text-foreground">
                      {{ stats.pending }}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="p-6">
            <div class="flex items-center">
              <div class="shrink-0">
                <div class="rounded-lg p-3 bg-blue-50 dark:bg-blue-900/20">
                  <Icon icon="solar:eye-linear" class="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-muted-foreground uppercase">
                    Under Review
                  </dt>
                  <dd class="flex items-baseline">
                    <div class="text-2xl font-semibold tracking-tight text-foreground">
                      {{ stats.underReview }}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="p-6">
            <div class="flex items-center">
              <div class="shrink-0">
                <div class="rounded-lg p-3 bg-green-50 dark:bg-green-900/20">
                  <Icon icon="solar:check-circle-linear" class="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-muted-foreground uppercase">
                    Accepted
                  </dt>
                  <dd class="flex items-baseline">
                    <div class="text-2xl font-semibold tracking-tight text-foreground">
                      {{ stats.accepted }}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>

  <!-- Bulk Actions Bar -->
  <section v-if="selectedPapers.size > 0" class="container mx-auto">
    <Card class="border-primary">
      <CardContent class="p-4">
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="text-sm font-medium">
              {{ selectedPapers.size }} paper{{ selectedPapers.size !== 1 ? 's' : '' }} selected
            </div>
            <Button variant="ghost" size="sm" @click="selectedPapers.clear()">
              Clear
            </Button>
          </div>
          <div class="flex items-center gap-2">
            <Select v-model="selectedBulkStatus">
              <SelectTrigger class="h-10 bg-card dark:bg-background w-48">
                <SelectValue placeholder="Change status to..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="option in statusOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
            <Button
              :disabled="!selectedBulkStatus || isBulkActionLoading"
              @click="handleBulkStatusChange"
            >
              {{ isBulkActionLoading ? 'Updating...' : 'Apply' }}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  </section>

  <!-- Filters -->
  <section>
    <div class="container py-4">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div class="flex flex-col space-y-2 sm:grid sm:grid-flow-col sm:gap-2 sm:space-y-0">
          <TableSearchForm v-model="filters.search" placeholder="Search papers..." />

          <Select v-model="filters.status">
            <SelectTrigger class="h-10 bg-card dark:bg-background w-48">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="option in statusOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>

          <Select v-model="filters.topic_id">
            <SelectTrigger class="h-10 bg-card dark:bg-background w-48">
              <SelectValue placeholder="All Topics" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="topic in mockTopics" :key="topic.topic_id" :value="topic.topic_id">
                {{ topic.name }}
              </SelectItem>
            </SelectContent>
          </Select>

          <DropdownReviewerFilter v-model="filters.reviewer_ids!" />

          <TableResetBtn v-if="isAnyFilterActive" @reset-filters="handleResetFilters" />
        </div>
      </div>
    </div>
  </section>

  <!-- Table -->
  <section class="relative" :class="{ 'scroll-area overflow-x-auto': !isLoading }">
    <Card class="w-full">
      <CardHeader class="flex flex-row items-center justify-between space-y-0">
        <CardTitle class="font-medium tracking-normal">
          All Submissions
        </CardTitle>
        <div class="flex items-center gap-2">
          <Checkbox
            :checked="isAllSelected"
            @update:checked="toggleAll"
          />
          <span class="text-sm text-muted-foreground">Select All</span>
        </div>
      </CardHeader>
      <CardContent class="scroll-area overflow-x-auto p-0">
        <div :style="{ minWidth: `${calculateMinWidth(toRef(columnConfigs), toRef(totalData))}px` }">
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
                  class="whitespace-nowrap px-2 py-3 text-sm font-normal text-slate-400 first:pl-5 last:pr-5 dark:text-slate-400"
                >
                  <FlexRender :render="header.column.columnDef.header" :props="header.getContext()" />
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <template v-if="!table.getRowModel().rows.length">
                <template v-if="isLoading">
                  <tr v-for="index in 10" :key="index">
                    <td v-for="(_, index2) in columns" :key="index2" class="p-2">
                      <Skeleton class="h-6 w-full rounded" />
                    </td>
                  </tr>
                </template>
                <tr v-else>
                  <td colspan="10" class="py-10 text-center">
                    <EmptyState
                      title="No papers found"
                      description="There are no papers matching your criteria."
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
