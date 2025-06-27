<script setup lang="ts">
import { Icon } from '@iconify/vue';

defineProps<{
  sidebarOpen?: boolean
  showEvents?: boolean
}>();

defineEmits<{
  (e: 'toggle-sidebar'): void
}>();
</script>

<template>
  <header class="sticky top-0 z-20 h-16 border-b backdrop-blur">
    <div class="h-full px-4 lg:px-8">
      <div class="-mb-px flex h-full items-center justify-between">
        <!-- Header: Left side -->
        <div class="flex items-center">
          <!-- Hamburger button -->
          <Button
            v-if="showEvents"
            id="sidebar-trigger"
            class="mr-3 hover:bg-card lg:!hidden"
            variant="ghost"
            aria-controls="sidebar"
            :aria-expanded="sidebarOpen"
            size="icon"
            @click="$emit('toggle-sidebar')"
          >
            <span class="sr-only">Open sidebar</span>
            <Icon icon="material-symbols-light:menu" class="size-8 fill-current" />
          </Button>
          <NuxtLink
            v-else
            to="/my-events"
            class="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <Logo class="size-12" :colored="true" />
            <span class="sr-only">Galanesia ID</span>
          </NuxtLink>
          <!-- <EventSwitcher v-if="showEvents" /> -->
          <DropdownEvents v-if="showEvents" />
        </div>

        <!-- Header: Right side -->
        <div class="flex h-16 items-center space-x-3">
          <!-- <Notifications align="right" /> -->
          <ThemeToggle />
          <!-- Divider -->
          <hr class="h-6 w-px border-none">
          <div class="flex h-full shrink-0 items-center">
            <UserMenu />
          </div>
        </div>
      </div>
    </div>
  </header>
</template>
