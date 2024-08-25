<script setup lang="ts">
import { Button } from './ui/button';
import { Icon } from '@iconify/vue'

defineProps(["sidebarOpen", "showEvents"]);

const router = useRouter();
const authStore = useAuthStore();

const searchModalOpen = ref(false);

const logout = () => {
  authStore.logout();
  router.push("/");
};
</script>

<template>
  <header
    class="sticky top-0 z-50 h-16 border-b border-slate-200 bg-white/60 bg-opacity-80 backdrop-blur-sm backdrop-filter dark:border-slate-800 dark:bg-[#182235] dark:bg-opacity-75"
  >
    <div class="h-full px-4 sm:px-6 lg:px-8">
      <div class="-mb-px flex h-full items-center justify-between">
        <!-- Header: Left side -->
        <div class="flex items-center">
          <!-- Hamburger button -->
          <Button
            v-if="showEvents"
            variant="outline"
            class="pr-3 lg:hidden"
            @click.stop="$emit('toggle-sidebar')"
            aria-controls="sidebar"
            :aria-expanded="sidebarOpen"
          >
            <Icon icon="heroicons-outline:menu-alt-1" class="h-6 w-6" />
          </Button>
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
