<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core';
import { computed, ref } from 'vue';

import type { ColumnConfig } from '@/types';

interface Props {
  modelValue: ColumnConfig[]
}

interface Emits {
  'update:modelValue': [value: ColumnConfig[]]
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Responsive breakpoint detection
const breakpoints = useBreakpoints(breakpointsTailwind);
const isMobile = computed(() => !breakpoints.md.value); // Mobile when screen is smaller than md (768px)

// Sheet state for mobile
const isSheetOpen = ref(false);

// Computed for two-way binding
const columnConfigs = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
});

const toggleColumn = (key: string, checked: boolean) => {
  const updatedConfigs = columnConfigs.value.map(column =>
    column.key === key ? { ...column, isVisible: checked } : column,
  );
  columnConfigs.value = updatedConfigs;
};

const resetColumns = () => {
  // Reset to default visibility
  const resetConfigs = columnConfigs.value.map(column => ({
    ...column,
    // Default visible columns
    isVisible: column.key === 'code' || column.key === 'fullname' || column.key === 'status' || column.key === 'date' || column.key === 'ticket_name' || column.key === 'ticket_price' || column.key === 'paid',
  }));
  columnConfigs.value = resetConfigs;
  isSheetOpen.value = false;
};
</script>

<template>
  <div>
    <ClientOnly>
      <!-- Desktop: Dropdown -->
      <DropdownMenu v-if="!isMobile">
        <DropdownMenuTrigger as-child>
          <Button variant="outline" class="h-[42px] bg-card">
            <Icon icon="heroicons:view-columns" class="size-4 text-muted-foreground" />
            <span class="hidden md:ml-2 md:inline-block">Columns</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" class="w-48">
          <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem
            v-for="column in columnConfigs"
            :key="column.key"
            :checked="column.isVisible"
            :disabled="!column.isHideable"
            @select="(event) => { event.preventDefault(); toggleColumn(column.key, !column.isVisible); }"
          >
            {{ column.header }}
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <!-- Mobile: Button that opens sheet -->
      <Button
        v-else
        variant="outline"
        class="h-[42px] bg-card dark:bg-background"
        @click="isSheetOpen = true"
      >
        <Icon icon="heroicons:view-columns" class="size-4" />
        <span class="ml-2">Columns</span>
      </Button>

      <!-- Mobile: Sheet/Drawer -->
      <Sheet v-model:open="isSheetOpen">
        <SheetContent side="bottom" class="max-h-[80vh]">
          <SheetHeader>
            <SheetTitle>Toggle Columns</SheetTitle>
            <SheetDescription>
              Select which columns to display in the table
            </SheetDescription>
          </SheetHeader>

          <div class="mt-6 space-y-4">
            <div v-for="column in columnConfigs" :key="column.key" class="flex items-center justify-between space-x-2">
              <label
                :for="`column-${column.key}`"
                class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                :class="{ 'opacity-50': !column.isHideable }"
              >
                {{ column.header }}
              </label>
              <Switch
                :id="`column-${column.key}`"
                :checked="column.isVisible"
                :disabled="!column.isHideable"
                @update:checked="toggleColumn(column.key, $event)"
              />
            </div>
          </div>

          <SheetFooter class="mt-6">
            <Button variant="outline" class="w-full" @click="resetColumns">
              Reset to Default
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </ClientOnly>
  </div>
</template>
