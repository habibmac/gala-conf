<script setup lang="ts">
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/vue';
import { Icon } from '@iconify/vue';

const props = defineProps<{
  eventId: string | number
  itemId: string | number
}>();

const emit = defineEmits(['refresh', 'delete']);

const menuItems = [
  { action: 'link', icon: 'carbon:view', id: '', label: 'View' },
  { action: 'link', icon: 'carbon:edit', id: 'edit', label: 'Edit' },
  {
    action: 'button',
    icon: 'ri:refresh-line',
    id: 'refresh',
    label: 'Refresh',
  },
  { action: 'button', icon: 'carbon:trash', id: 'delete', label: 'Delete' },
];

const handleAction = (item: { id: string, action: string }) => {
  if (item.action === 'button' && item.id === 'refresh') {
    emit('refresh');
  }
  else if (item.action === 'button' && item.id === 'delete') {
    emit('delete');
  }
};
</script>

<template>
  <Listbox as="div" class="relative">
    <ListboxButton
      class="inline-flex size-9 items-center justify-center rounded-md p-0 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
    >
      <Icon icon="lucide:more-vertical" class="size-4" />
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
        class="absolute right-0 z-10 mt-2 min-w-32 origin-top-right divide-y divide-slate-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none dark:bg-slate-950"
        as="ul"
      >
        <div class="p-1">
          <ListboxOption
            v-for="item in menuItems"
            :key="item.id"
            :value="item"
            as="li"
            class="dropdown-item"
          >
            <NuxtLink
              v-if="item.action === 'link'"
              :to="`/event/${props.eventId}/insights/${props.itemId}/${item.id}`"
              class="flex w-full items-center"
            >
              <Icon :icon="item.icon" class="mr-2 size-4 text-slate-400" />
              {{ item.label }}
            </NuxtLink>
            <button v-else class="flex w-full cursor-default items-center" @click.prevent="handleAction(item)">
              <Icon :icon="item.icon" class="mr-2 size-4 text-slate-400" />
              {{ item.label }}
            </button>
          </ListboxOption>
        </div>
      </ListboxOptions>
    </transition>
  </Listbox>
</template>
