<script setup lang="ts" generic="T extends Record<string, any>">
import { computed } from 'vue';

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface TableColumn<T> {
  key: keyof T | string
  label: string
  align?: 'left' | 'center' | 'right'
  class?: string
  sortable?: boolean
  hidden?: boolean | ((item: T) => boolean) // Support conditional hiding
}

export interface TableCardProps<T> {
  // Card props
  title?: string
  subtitle?: string

  // Table props
  data?: T[]
  columns?: TableColumn<T>[]
  showTableHeader?: boolean
  loading?: boolean
  emptyMessage?: string

  // Auto-generate columns from object keys (alternative to manual columns)
  autoColumns?: boolean
  excludeKeys?: string[] // Keys to exclude when auto-generating
  keyLabels?: Record<string, string> // Custom labels for auto-generated columns

  // Layout props
  singleColumn?: boolean
  hideTable?: boolean

  contentClass?: string // New prop for content styling

  // Field-value mode (for backward compatibility)
  fieldValueMode?: boolean
}

const props = withDefaults(defineProps<TableCardProps<T>>(), {
  showTableHeader: true,
  loading: false,
  emptyMessage: 'No data available',
  singleColumn: false,
  hideTable: false,
  autoColumns: false,
  fieldValueMode: false,
  contentClass: '',
  excludeKeys: () => [],
  keyLabels: () => ({}),
});

// Computed properties
const hasData = computed(() => props.data && props.data.length > 0);

const tableColumns = computed(() => {
  if (props.singleColumn && props.data && props.data.length > 0) {
    // For single column, create a column from the first data key
    const firstDataKey = Object.keys(props.data[0])[0];
    return [{ key: firstDataKey, label: props.title || 'Data' }];
  }

  // If columns are explicitly provided, use them
  if (props.columns && props.columns.length > 0) {
    return props.columns.filter((col) => {
      if (typeof col.hidden === 'boolean')
        return !col.hidden;
      if (typeof col.hidden === 'function' && props.data && props.data.length > 0) {
        return !col.hidden(props.data[0]);
      }
      return true;
    });
  }

  // Auto-generate columns from first data object
  if (props.autoColumns && props.data && props.data.length > 0) {
    const firstItem = props.data[0];
    return Object.keys(firstItem)
      .filter(key => !props.excludeKeys.includes(key))
      .map(key => ({
        key,
        label: props.keyLabels[key] || formatLabel(key),
      }));
  }

  return [];
});

// Helper function to get nested value
function getNestedValue(obj: any, path: string) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Helper function to format auto-generated labels
function formatLabel(key: string): string {
  return key
    .replace(/[_-]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, l => l.toUpperCase());
}
</script>

<template>
  <Card>
    <!-- Card Header -->
    <CardHeader v-if="title || $slots.header || $slots.headerAction" class="border-b">
      <div class="flex items-center justify-between">
        <div class="flex-1">
          <slot name="header">
            <CardTitle v-if="title">
              {{ title }}
            </CardTitle>
            <p v-if="subtitle" class="mt-1 text-sm text-muted-foreground">
              {{ subtitle }}
            </p>
          </slot>
        </div>

        <!-- Header Action Slot -->
        <div v-if="$slots.headerAction" class="flex items-center gap-2">
          <slot name="headerAction" />
        </div>
      </div>
    </CardHeader>

    <!-- Card Content -->
    <CardContent
      class="p-0"
      :class="[
        contentClass,
      ]"
    >
      <!-- Custom Content Slot (if no table needed) -->
      <div v-if="hideTable">
        <slot name="content" />
      </div>

      <!-- Table Content -->
      <div v-else>
        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center py-8">
          <div class="size-8 animate-spin rounded-full border-b-2 border-primary" />
        </div>

        <!-- Empty State -->
        <div v-else-if="!hasData" class="py-8 text-center text-muted-foreground">
          <slot name="empty">
            {{ emptyMessage }}
          </slot>
        </div>

        <div v-else>
          <!-- Table -->
          <Table>
            <!-- Table Header -->
            <TableHeader v-if="showTableHeader && tableColumns.length > 0">
              <TableRow>
                <TableHead
                  v-for="column in tableColumns"
                  :key="String(column.key)"
                  :class="[
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right',
                    column.class || '',
                  ]"
                >
                  <slot :name="`header-${String(column.key)}`" :column="column" :label="column.label">
                    {{ column.label }}
                  </slot>
                </TableHead>
                <!-- Actions Column Header -->
                <TableHead v-if="$slots.actions" class="text-right">
                  <slot name="actionsHeader">
                    Actions
                  </slot>
                </TableHead>
              </TableRow>
            </TableHeader>
            <!-- Table Body -->
            <TableBody>
              <TableRow v-for="(item, index) in data" :key="index" class="hover:bg-muted/50">
                <!-- Data Cells -->
                <TableCell
                  v-for="column in tableColumns"
                  :key="String(column.key)"
                  :class="[
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right',
                    column.class || '',
                  ]"
                >
                  <slot
                    :name="`cell-${String(column.key)}`"
                    :item="item"
                    :value="getNestedValue(item, String(column.key))"
                    :index="index"
                    :column="column"
                  >
                    {{ getNestedValue(item, String(column.key)) }}
                  </slot>
                </TableCell>
                <!-- Actions Cell -->
                <TableCell v-if="$slots.actions" class="text-right">
                  <slot name="actions" :item="item" :index="index" />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <!-- Custom table footer slot -->
        <CardFooter v-if="$slots.tableFooter" class="mt-4">
          <slot name="tableFooter" />
        </CardFooter>
      </div>
    </CardContent>
  </Card>
</template>
