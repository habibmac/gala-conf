<!-- components/Pagination.vue -->
<script setup lang="ts">
import {
  Button,
} from '@/components/ui/button'
import { Icon } from '@iconify/vue'

const props = defineProps({
  totalPages: {
    type: Number,
    required: true
  },
  currentPage: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['update:page'])

const updatePage = (page: number) => {
  emit('update:page', page)
}

// Generate an array of all page numbers
const pageNumbers = Array.from({ length: props.totalPages }, (_, i) => i + 1)
</script>

<template>
  <div class="flex items-center justify-center space-x-2 mt-10 mb-20">
    <Button 
      variant="outline" 
      class="w-10 h-10 p-0"
      :disabled="currentPage === 1"
      @click="updatePage(currentPage - 1)"
    >
     <Icon icon="heroicons:chevron-left" />
    </Button>
    
    <Button 
      v-for="page in pageNumbers" 
      :key="page"
      :variant="page === currentPage ? 'default' : 'outline'"
      class="w-10 h-10 p-0"
      @click="updatePage(page)"
    >
      {{ page }}
    </Button>
    
    <Button 
      variant="outline" 
      class="w-10 h-10 p-0"
      :disabled="currentPage === totalPages"
      @click="updatePage(currentPage + 1)"
    >
      <Icon icon="heroicons:chevron-right" />
    </Button>
  </div>
</template>