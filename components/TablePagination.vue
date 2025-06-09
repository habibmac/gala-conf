<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';

const props = defineProps({
  currentPage: { default: 1, type: Number },
  pageCount: { default: 1, type: Number },
  pageSize: { default: 10, type: Number },
  pageSizes: { default: () => [10, 20, 50, 100], type: Array },
  totalData: { default: 0, type: Number },
});

const emits = defineEmits(['update:pageSize', 'update:currentPage']);

const route = useRoute();

const handlePageSizeChange = (value: string) => {
  emits('update:pageSize', Number(value));
};

const pageCount = computed(() => props.pageCount ?? 1);

const navigateToPage = (page: number) => {
  if (page >= 1 && page <= pageCount.value) {
    // Emitting navigate event with the page number instead of direction
    emits('update:currentPage', page);
  }
};

// Computed value for creating router links
const createLink = (page: number) => {
  return {
    name: route.name as string,
    params: { ...route.params },
    query: { page },
  };
};

const currentPage = computed(() =>
  props.currentPage ? (props.currentPage > pageCount.value ? pageCount.value : props.currentPage) : 1,
);

const shouldShowPage = (page: number) => {
  if (pageCount.value <= 5) {
    return true;
  }

  const start = Math.max(1, Math.min(currentPage.value - 2, pageCount.value - 4));
  const end = Math.min(pageCount.value, start + 4);

  return page >= start && page <= end;
};
</script>

<template>
  <div
    class="mb-20 mt-5 grid grid-cols-2 items-center gap-5 p-4 pt-0 sm:grid-cols-3 sm:justify-between sm:p-6 sm:pt-0"
  >
    <div class="order-2 flex items-center space-x-2 sm:order-1">
      <Select :model-value="String(pageSize)" @update:model-value="handlePageSizeChange">
        <SelectTrigger class="form-select w-auto">
          <SelectValue placeholder="Per page" />
        </SelectTrigger>
        <SelectContent>
          <!-- Don't pass 'options' prop here, use v-for instead -->
          <SelectItem v-for="size in pageSizes" :key="`page-size-${size}`" :value="String(size)">
            {{ size }}
          </SelectItem>
        </SelectContent>
      </Select>
      <Label>
        <span class="text-sm font-normal">per page</span>
      </Label>
    </div>
    <nav role="navigation" aria-label="Pagination" class="order-3 col-span-2 sm:order-2 sm:col-span-1">
      <ul class="flex flex-wrap items-center justify-center space-x-1 sm:flex-nowrap">
        <li class="hidden sm:block">
          <RouterLink
            :to="createLink(1)"
            class="page-link"
            :class="{ disabled: currentPage <= 1 }"
            @click.prevent="currentPage > 1 && navigateToPage(1)"
          >
            <svg class="size-6" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M16 17a.997.997 0 0 1-.707-.293l-4-4a1 1 0 0 1 0-1.414l4-4a1 1 0 0 1 1.414 1.414L13.414 12l3.293 3.293A1 1 0 0 1 16 17m-8 0a1 1 0 0 1-1-1V8a1 1 0 0 1 2 0v8a1 1 0 0 1-1 1"
              />
            </svg>
          </RouterLink>
        </li>
        <li>
          <RouterLink
            :to="createLink(currentPage - 1)"
            class="page-link"
            :class="{ disabled: currentPage <= 1 }"
            @click.prevent="currentPage > 1 && navigateToPage(currentPage - 1)"
          >
            <svg class="size-6" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M14.121 17.243a.997.997 0 0 1-.707-.293l-4.242-4.243a1 1 0 0 1 0-1.414l4.242-4.243a1 1 0 0 1 1.414 1.414L11.293 12l3.535 3.536a1 1 0 0 1-.707 1.707"
              />
            </svg>
          </RouterLink>
        </li>
        <template v-for="page in pageCount" :key="page">
          <li v-if="shouldShowPage(page)">
            <RouterLink
              :to="createLink(page)"
              class="page-link"
              :class="{ active: currentPage === page }"
              @click="navigateToPage(page)"
            >
              {{ page }}
            </RouterLink>
          </li>
        </template>
        <li>
          <RouterLink
            :to="createLink(currentPage + 1)"
            class="page-link"
            :class="{ disabled: currentPage >= pageCount }"
            @click.prevent="currentPage < pageCount && navigateToPage(currentPage + 1)"
          >
            <svg class="size-6" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M9.879 17.243a1 1 0 0 1-.707-1.707L12.707 12L9.172 8.464a1 1 0 0 1 1.414-1.414l4.242 4.243a1 1 0 0 1 0 1.414l-4.242 4.243a.997.997 0 0 1-.707.293"
              />
            </svg>
          </RouterLink>
        </li>
        <li class="hidden sm:block">
          <RouterLink
            :to="createLink(pageCount)"
            class="page-link"
            :class="{ disabled: currentPage >= pageCount }"
            @click.prevent="currentPage < pageCount && navigateToPage(pageCount)"
          >
            <svg class="size-6" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M8 17a1 1 0 0 1-.707-1.707L10.586 12L7.293 8.707a1 1 0 0 1 1.414-1.414l4 4a1 1 0 0 1 0 1.414l-4 4A.997.997 0 0 1 8 17m8 0a1 1 0 0 1-1-1V8a1 1 0 0 1 2 0v8a1 1 0 0 1-1 1"
              />
            </svg>
          </RouterLink>
        </li>
      </ul>
    </nav>
    <div class="whitespace order-2 text-right text-sm text-slate-500 dark:text-slate-400 sm:order-3">
      Page
      <span class="font-medium text-slate-900 dark:text-slate-300">{{ currentPage }}</span>
      of
      <span class="font-medium text-slate-900 dark:text-slate-300">{{ pageCount }}</span>
    </div>
  </div>
</template>

<style lang="scss">
.page-link {
  @apply flex transition-colors items-center justify-center leading-5 hover:shadow-sm dark:text-slate-300 text-sm w-6 h-6 hover:bg-slate-200/50 dark:hover:bg-slate-700 dark:hover:text-slate-100 rounded-full p-5 relative;

  > svg {
    @apply w-5 h-5 absolute;
  }

  &.active {
    @apply bg-white text-slate-900 dark:bg-blue-600 dark:text-white pointer-events-none;
  }

  &.disabled {
    @apply pointer-events-none cursor-not-allowed border-slate-300 opacity-50 dark:border-slate-800 dark:hover:border-slate-800 dark:hover:text-slate-300;
  }
}
</style>
