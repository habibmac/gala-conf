<script setup lang="ts">
import { Icon } from "@iconify/vue";

defineProps(["sidebarOpen", "showEvents"]);
</script>

<template>
  <header
    class="sticky top-0 z-20 h-16 border-b border-slate-200 bg-white/60 bg-opacity-80 backdrop-blur-sm backdrop-filter dark:border-slate-800 dark:bg-slate-950 dark:bg-opacity-80"
  >
    <div class="h-full px-4 lg:px-8">
      <div class="-mb-px flex h-full items-center justify-between">
        <!-- Header: Left side -->
        <div class="flex items-center">
          <!-- Hamburger button -->
          <button
            v-if="showEvents"
            class="icon-btn lg:!hidden mr-3"
            @click.stop="$emit('toggle-sidebar')"
            aria-controls="sidebar"
            :aria-expanded="sidebarOpen"
            size="icon"
          >
            <span class="sr-only">Open sidebar</span>
            <Icon icon="material-symbols-light:menu" class="h-8 w-8 fill-current" />
          </button>
          <NuxtLink
            v-else
            to="/my-events"
            class="text-sm flex items-center font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <Logo class="h-12 w-12 fill-black" :colored="true" />
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
          <hr class="h-6 w-px border-none bg-slate-200 dark:bg-slate-700" />
          <div class="flex h-full shrink-0 items-center">
            <UserMenu />
          </div>
        </div>
      </div>
    </div>
  </header>
</template>
