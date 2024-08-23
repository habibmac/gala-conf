<script setup lang="ts">
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
        <div class="flex h-full">
          <!-- Hamburger button -->
          <button
            v-if="showEvents"
            class="pr-3 lg:hidden"
            @click.stop="$emit('toggle-sidebar')"
            aria-controls="sidebar"
            :aria-expanded="sidebarOpen"
          >
            <div
              class="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-600/80"
            >
              <span class="sr-only">Open sidebar</span>
              <svg
                class="h-6 w-6 fill-current"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect x="4" y="5" width="16" height="2" />
                <rect x="4" y="11" width="16" height="2" />
                <rect x="4" y="17" width="16" height="2" />
              </svg>
            </div>
          </button>
          <NuxtLink
            v-else
            to="/my-events"
            class="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <Logo class="mt-1.5 h-12 w-12 fill-black" :colored="true" />
          </NuxtLink>
          <!-- <DropdownEvents v-if="showEvents" /> -->
        </div>

        <!-- Header: Right side -->
        <div class="flex h-16 items-center space-x-3">
          <div>
            <button
              class="icon-btn"
              @click.stop="searchModalOpen = true"
              aria-controls="search-modal"
              v-if="showEvents"
            >
              <span class="sr-only">Search</span>
              <svg
                class="h-4 w-4"
                viewBox="0 0 16 16"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  class="fill-current text-slate-500 dark:text-slate-400"
                  d="M7 14c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7zM7 2C4.243 2 2 4.243 2 7s2.243 5 5 5 5-2.243 5-5-2.243-5-5-5z"
                />
                <path
                  class="fill-current text-slate-400 dark:text-slate-500"
                  d="M15.707 14.293L13.314 11.9a8.019 8.019 0 01-1.414 1.414l2.393 2.393a.997.997 0 001.414 0 .999.999 0 000-1.414z"
                />
              </svg>
            </button>
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
