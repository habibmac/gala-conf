<!-- components/Pagination.vue -->
<script setup lang="ts">
import { Icon } from '@iconify/vue';

import { Button } from '@/components/ui/button';

const props = defineProps({
  currentPage: {
    required: true,
    type: Number,
  },
  totalPages: {
    required: true,
    type: Number,
  },
});

const emit = defineEmits(['update:page']);

const updatePage = (page: number) => {
  emit('update:page', page);
};

// Generate an array of all page numbers
const pageNumbers = Array.from({ length: props.totalPages }, (_, i) => i + 1);
</script>

<template>
  <div class="mb-20 mt-10 flex items-center justify-center space-x-2">
    <Button variant="outline" class="size-10 p-0" :disabled="currentPage === 1" @click="updatePage(currentPage - 1)">
      <Icon icon="heroicons:chevron-left" />
    </Button>

    <Button
      v-for="page in pageNumbers"
      :key="page"
      :variant="page === currentPage ? 'default' : 'outline'"
      class="size-10 p-0"
      @click="updatePage(page)"
    >
      {{ page }}
    </Button>

    <Button
      variant="outline"
      class="size-10 p-0"
      :disabled="currentPage === totalPages"
      @click="updatePage(currentPage + 1)"
    >
      <Icon icon="heroicons:chevron-right" />
    </Button>
  </div>
</template>
