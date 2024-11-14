<script setup lang="ts">
import { Icon } from '@iconify/vue';

defineProps<{
  sidebarOpen?: boolean;
  showEvents?: boolean;
}>();

defineEmits<{
  (e: 'toggle-sidebar'): void;
}>();
</script>

<template>
  <header class="sticky top-0 z-20 h-16 border-b backdrop-blur backdrop-filter">
    <div class="h-full px-4 lg:px-8">
      <div class="-mb-px flex h-full items-center justify-between">
        <!-- Header: Left side -->
        <div class="flex items-center">
          <!-- Hamburger button -->
          <button
            v-if="showEvents"
            id="sidebar-trigger"
            class="icon-btn mr-3 lg:!hidden"
            aria-controls="sidebar"
            :aria-expanded="sidebarOpen"
            size="icon"
            @click="$emit('toggle-sidebar')"
          >
            <span class="sr-only">Open sidebar</span>
            <Icon icon="material-symbols-light:menu" class="h-8 w-8 fill-current" />
          </button>
          <NuxtLink
            v-else
            to="/my-events"
            class="text-sm flex items-center font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <Logo class="h-12 w-12" :colored="true" />
            <span class="sr-only">Galanesia ID</span>
          </NuxtLink>
          <!-- <EventSwitcher v-if="showEvents" /> -->
          <DropdownEvents v-if="showEvents" />
        </div>

        <!-- Header: Right side -->
        <div class="flex h-16 items-center space-x-3">
          <div>
            <!-- <Teleport to="body">
							<SearchModal
								id="search-modal"
								searchId="search"
								:modalOpen="searchModalOpen"
								@open-modal="searchModalOpen = true"
								@close-modal="searchModalOpen = false"
							/>
						</Teleport> -->
          </div>
          <!-- <Notifications align="right" /> -->
          <ThemeToggle />
          <!-- Divider -->
          <hr class="h-6 w-px border-none" />
          <div class="flex h-full shrink-0 items-center">
            <UserMenu />
          </div>
        </div>
      </div>
    </div>
  </header>
</template>
