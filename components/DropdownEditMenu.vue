<script setup lang="ts">
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/vue';
import { Icon } from '@iconify/vue';

const props = defineProps<{
  eventId: string | number;
  itemId: string | number;
}>();

const emit = defineEmits(['refresh', 'delete']);

const menuItems = [
  { id: 'view', label: 'View', icon: 'carbon:view', action: 'link' },
  { id: 'edit', label: 'Edit', icon: 'carbon:edit', action: 'link' },
  {
    id: 'refresh',
    label: 'Refresh',
    icon: 'ri:refresh-line',
    action: 'button',
  },
  { id: 'delete', label: 'Delete', icon: 'carbon:trash', action: 'button' },
];

const handleAction = (item: { id: string; action: string }) => {
  if (item.action === 'button' && item.id === 'refresh') {
    emit('refresh');
  } else if (item.action === 'button' && item.id === 'delete') {
    emit('delete');
  }
};
</script>

<template>
  <Listbox as="div" class="relative">
    <ListboxButton
      class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9 p-0"
    >
      <Icon icon="lucide:more-vertical" class="h-4 w-4" />
      <span class="sr-only">Open menu</span>
    </ListboxButton>
    <transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <ListboxOptions
        class="absolute right-0 z-10 mt-2 min-w-32 origin-top-right divide-y divide-slate-100 rounded-md bg-white dark:bg-slate-950 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
        as="ul"
      >
        <div class="px-1 py-1">
          <ListboxOption v-for="item in menuItems" :key="item.id" :value="item" as="li" class="dropdown-item">
            <NuxtLink v-if="item.action === 'link'" :to="`/event/${props.eventId}/insight/${props.itemId}/edit`">
              <Icon :icon="item.icon" class="mr-2 h-4 w-4 text-slate-400" />
              {{ item.label }}
            </NuxtLink>
            <button v-else @click.prevent="handleAction(item)" class="flex items-center w-full cursor-default">
              <Icon :icon="item.icon" class="mr-2 h-4 w-4 text-slate-400" />
              {{ item.label }}
            </button>
          </ListboxOption>
        </div>
      </ListboxOptions>
    </transition>
  </Listbox>
</template>
