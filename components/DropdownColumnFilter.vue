<script setup lang="ts">
import { ref, watch } from 'vue';
import { Icon } from '@iconify/vue';
import { cn } from '@/lib/utils';

interface ColumnConfig {
  key: string;
  header: string;
  isVisible: boolean;
  isHideable: boolean;
}

const props = defineProps<{
  modelValue: ColumnConfig[];
}>();

const emit = defineEmits(['update:modelValue']);

function toggleColumnVisibility(column: ColumnConfig) {
  // Only proceed if the column is hideable
  if (!column.isHideable) return;

  const updatedColumns = props.modelValue.map((col) =>
    col.key === column.key ? { ...col, isVisible: !col.isVisible } : col
  );

  emit('update:modelValue', updatedColumns);
}
</script>

<template>
  <ClientOnly>
    <Popover>
      <PopoverTrigger>
        <Button variant="outline" size="icon" class="h-[42px] w-[42px] bg-card dark:bg-background">
          <Icon icon="teenyicons:adjust-horizontal-alt-outline" class="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent class="p-0" align="end">
        <Command>
          <CommandList>
            <CommandGroup>
              <CommandItem
                v-for="column in modelValue"
                :key="column.key"
                :value="column.key"
                @select="() => toggleColumnVisibility(column)"
                :disabled="!column.isHideable"
              >
                <div
                  :class="
                    cn(
                      'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                      column.isVisible ? 'bg-primary text-primary-foreground' : 'opacity-50 [&_svg]:invisible'
                    )
                  "
                >
                  <Icon icon="radix-icons:check" class="h-4 w-4" />
                </div>
                <span>{{ column.header }}</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  </ClientOnly>
</template>
