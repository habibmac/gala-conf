<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Icon } from '@iconify/vue';
import { allRegStatuses } from '@/utils';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const props = defineProps<{
  modelValue: string[];
}>();

const statuses = computed(() =>
  allRegStatuses.map((status) => ({
    label: status.label,
    value: status.label,
    color: status.color,
  }))
);

const selectedStatuses = ref<string[]>(props.modelValue);

const emits = defineEmits(['update:modelValue']);

watch(
  () => props.modelValue,
  (newValue) => {
    selectedStatuses.value = newValue;
  }
);

function updateValue(value: string) {
  const updatedStatuses = selectedStatuses.value.includes(value)
    ? selectedStatuses.value.filter((status) => status !== value)
    : [...selectedStatuses.value, value];

  emits('update:modelValue', updatedStatuses);
  selectedStatuses.value = updatedStatuses;
}

const selectedStatusLabels = computed(() => {
  return selectedStatuses.value.length
    ? selectedStatuses.value.map((value) => {
        const status = statuses.value.find((s) => s.value === value);
        return status ? status.label : '';
      })
    : ['All Status'];
});

const selectedValues = computed(() => new Set(selectedStatuses.value));

const buttonLabel = computed(() => {
  if (selectedStatusLabels.value.length === 0) return 'All Status';
  if (selectedStatusLabels.value.length === 1) return selectedStatusLabels.value[0];
  return `${selectedStatusLabels.value.length} selected`;
});

function clearAllStatuses() {
  emits('update:modelValue', []);
  selectedStatuses.value = [];
}
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button variant="outline" class="h-10 relative bg-card">
        <span v-if="selectedStatuses.length > 0" class="text-xs text-slate-500 border-r pr-2"> Status </span>
        <span class="font-medium ml-2">
          {{ buttonLabel }}
        </span>
        <Icon icon="heroicons:chevron-down" class="w-3.5 h-3.5 ml-2 text-slate-600 dark:text-slate-400" />
        <span
          v-if="selectedStatuses.length > 0"
          class="absolute h-2 w-2 rounded-full right-0.5 top-0.5 bg-rose-500"
        ></span>
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-[200px] p-0" align="start">
      <Command>
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup>
            <CommandItem :value="{ label: 'All Status', value: '' }" @select="clearAllStatuses">
              <div
                :class="
                  cn(
                    'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                    selectedStatuses.length === 0
                      ? 'bg-primary text-primary-foreground'
                      : 'opacity-50 [&_svg]:invisible'
                  )
                "
              >
                <Icon icon="radix-icons:check" class="h-4 w-4" />
              </div>
              <span>All Status</span>
            </CommandItem>
            <CommandItem
              v-for="item in statuses"
              :key="item.value"
              :value="item"
              @select="() => updateValue(item.value)"
            >
              <div
                :class="
                  cn(
                    'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                    selectedValues.has(item.value)
                      ? 'bg-primary text-primary-foreground'
                      : 'opacity-50 [&_svg]:invisible'
                  )
                "
              >
                <Icon icon="radix-icons:check" class="h-4 w-4" />
              </div>
              <span :class="`dot ${item.color} h-2 w-2 rounded-full inline-block mr-2`"></span>
              <span>{{ item.label }}</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>
