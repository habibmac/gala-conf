<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { computed, ref, watch } from 'vue';

import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { allRegStatuses } from '@/utils';

const props = defineProps<{
  modelValue: string[]
}>();

const emits = defineEmits(['update:modelValue']);

const statuses = computed(() =>
  allRegStatuses.map(status => ({
    color: status.color,
    label: status.label,
    value: status.label,
  })),
);

const selectedStatuses = ref<string[]>(props.modelValue);

watch(
  () => props.modelValue,
  (newValue) => {
    selectedStatuses.value = newValue;
  },
);

function updateValue(value: string) {
  const updatedStatuses = selectedStatuses.value.includes(value)
    ? selectedStatuses.value.filter(status => status !== value)
    : [...selectedStatuses.value, value];

  emits('update:modelValue', updatedStatuses);
  selectedStatuses.value = updatedStatuses;
}

const selectedStatusLabels = computed(() => {
  return selectedStatuses.value.length
    ? selectedStatuses.value.map((value) => {
        const status = statuses.value.find(s => s.value === value);
        return status ? status.label : '';
      })
    : ['All Status'];
});

const selectedValues = computed(() => new Set(selectedStatuses.value));

const buttonLabel = computed(() => {
  if (selectedStatusLabels.value.length === 0)
    return 'All Status';
  if (selectedStatusLabels.value.length === 1)
    return selectedStatusLabels.value[0];
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
      <Button variant="outline" class="relative h-[42px] bg-card dark:bg-background">
        <span v-if="selectedStatuses.length > 0" class="border-r pr-2 text-xs text-slate-500"> Status </span>
        <span class="ml-2 font-medium">
          {{ buttonLabel }}
        </span>
        <Icon icon="heroicons:chevron-down" class="ml-2 size-3.5 text-slate-600 dark:text-slate-400" />
        <span v-if="selectedStatuses.length > 0" class="absolute right-0.5 top-0.5 size-2 rounded-full bg-rose-500" />
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
                      : 'opacity-50 [&_svg]:invisible',
                  )
                "
              >
                <Icon icon="radix-icons:check" class="size-4" />
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
                      : 'opacity-50 [&_svg]:invisible',
                  )
                "
              >
                <Icon icon="radix-icons:check" class="size-4" />
              </div>
              <span :class="`dot ${item.color} h-2 w-2 rounded-full inline-block mr-2`" />
              <span>{{ item.label }}</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>
