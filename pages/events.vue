<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "nuxt/app";
import { useQuery } from '@tanstack/vue-query';

definePageMeta({
  title: "Events",
  description: "List of events",
  layout: "dashboard",
});

type Event = {
  id: number;
  title: string;
};

const authStore = useAuthStore();
const router = useRouter();

const selectedStatus = ref('active');
const currentPage = ref(1);

const { data: evtCount } = useQuery({
	queryKey: ['eventsCount'],
	queryFn: () => galantisApi.get('/events/count').then((res) => res.data),
});


const {
	events,
	isLoading,
	isError,
	pagination,
	page,
	maxPage,
	prevPage,
	nextPage,
} = useEvents({ evtStatus: selectedStatus, page: currentPage });

</script>
<template>
  <div class="flex h-full w-full flex-col">
    <header class="mx-auto w-full max-w-4xl">
      <div class="px-4 py-10 sm:px-6 sm:pt-12">
        <div class="flex justify-between">
          <h1 class="h2">My Events</h1>
          <div class="flex items-center space-x-2">
            <NuxtLink
              to="/new"
              class="btn btn-primary with-icon font-medium"
            >
              <svg
                class="h-4 w-4 shrink-0 fill-current opacity-50"
                viewBox="0 0 16 16"
              >
                <path
                  d="M15 7H9V1c0-.6-.4-1-1-1S7 .4 7 1v6H1c-.6 0-1 .4-1 1s.4 1 1 1h6v6c0 .6.4 1 1 1s1-.4 1-1V9h6c.6 0 1-.4 1-1s-.4-1-1-1z"
                ></path>
              </svg>
              <span>Create Event</span>
            </NuxtLink>
          </div>
        </div>
      </div>
    </header>
    <section>
			<div class="mx-auto sm:max-w-4xl">
				<div class="px-4 py-4 sm:px-6 sm:py-6">
					<div
						class="border-b border-slate-300 dark:border-slate-700"
					>
						<ul
							class="no-scrollbar flex flex-nowrap overflow-x-scroll text-sm font-medium"
						>
							<li>
								<button
									@click="handleSwitchTab('active')"
									class="flex h-12 items-center whitespace-nowrap px-3 border-b-2 hover:border-blue-600 hover:text-blue-600"
									:class="[
										selectedStatus === 'active'
											? 'border-blue-600 text-blue-600'
											: 'border-transparent ',
									]"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="mr-2 h-6 w-6 shrink-0 fill-current"
										viewBox="0 0 20 20"
									>
										<g fill="currentColor">
											<path
												d="M16.364 3.636a.75.75 0 0 0-1.06 1.06a7.5 7.5 0 0 1 0 10.607a.75.75 0 0 0 1.06 1.061a9 9 0 0 0 0-12.728M4.697 4.697a.75.75 0 0 0-1.061-1.061a9 9 0 0 0 0 12.728a.75.75 0 1 0 1.06-1.06a7.5 7.5 0 0 1 0-10.607"
											/>
											<path
												d="M12.475 6.464a.75.75 0 0 1 1.06 0a5 5 0 0 1 0 7.072a.75.75 0 0 1-1.06-1.061a3.5 3.5 0 0 0 0-4.95a.75.75 0 0 1 0-1.06m-4.95-.001a.75.75 0 0 1 0 1.061a3.5 3.5 0 0 0 0 4.95a.75.75 0 0 1-1.06 1.06a5 5 0 0 1 0-7.07a.75.75 0 0 1 1.06 0M11 10a1 1 0 1 1-2 0a1 1 0 0 1 2 0"
											/>
										</g>
									</svg>
									<span>Active
										<span
											v-if="evtCount?.active > 0"
											class="inline-flex min-w-[16px] h-[16px] px-1.5 items-center justify-center rounded-full text-tiny font-bold leading-none text-slate-50"
											:class="[
												selectedStatus === 'active'
													? 'bg-blue-600 dark:bg-blue-600'
													: 'bg-slate-400 dark:bg-slate-700',
											]"
											>{{ evtCount.active }}</span
										>
									</span>
								</button>
							</li>
							
						</ul>
					</div>
				</div>
			</div>
		</section>
    <section class="grow">
			<div class="mx-auto mb-20 h-full max-w-xs sm:max-w-4xl">
				<div class="px-4 py-4 sm:px-6 sm:py-6">
					<div v-if="isLoading" class="grid h-full grid-cols-1 gap-6">
						<div
							v-for="index in 3"
							:key="index"
							class="h-32 w-full animate-pulse rounded-lg bg-slate-300/50 dark:bg-slate-800"
						></div>
					</div>
					<template v-else-if="isError">
						<div class="flex h-32 items-center justify-center">
							Error fetching events. Please try again
							later.
						</div>
					</template>

					<template v-else>
						<div
							class="flex flex-col gap-6"
							v-if="events && events.length > 0"
						>
							<!-- Active events -->
							<div v-for="event in events" :key="event.id" class="grid grid-cols-1">
								<EventCard
									:event="event"
									:isPast="selectedStatus === 'inactive'"
								/>
							</div>

							<!-- Pagination -->
							<nav
								v-if="maxPage && maxPage > 1"
								class="flex h-12 w-full shrink-0 items-center justify-between gap-2 border-t border-slate-200 px-4 pt-8 md:col-span-2 dark:border-slate-800"
							>
								<div>
									<span
										class="text-sm text-slate-700 dark:text-slate-300"
										>Page {{ page }} of {{ maxPage }}</span
									>
								</div>
								<div class="flex space-x-2">
									<button
										v-if="page > 1"
										@click="prevPage"
										class="btn border bg-white hover:border-blue-600 hover:text-blue-600 dark:border-slate-700 dark:bg-transparent dark:hover:border-blue-600 dark:hover:text-slate-300"
									>
										<svg
											class="h-6 w-6"
											viewBox="0 0 24 24"
										>
											<path
												fill="currentColor"
												d="M14.121 17.243a.997.997 0 0 1-.707-.293l-4.242-4.243a1 1 0 0 1 0-1.414l4.242-4.243a1 1 0 0 1 1.414 1.414L11.293 12l3.535 3.536a1 1 0 0 1-.707 1.707"
											/>
										</svg>
									</button>
									<button
										v-if="page < maxPage"
										@click="nextPage"
										class="btn border bg-white hover:border-blue-600 hover:text-blue-600 dark:border-slate-700 dark:bg-transparent dark:hover:border-blue-600 dark:hover:text-slate-300"
									>
										<svg
											class="h-6 w-6"
											viewBox="0 0 24 24"
										>
											<path
												fill="currentColor"
												d="M9.879 17.243a1 1 0 0 1-.707-1.707L12.707 12L9.172 8.464a1 1 0 0 1 1.414-1.414l4.242 4.243a1 1 0 0 1 0 1.414l-4.242 4.243a.997.997 0 0 1-.707.293"
											/>
										</svg>
									</button>
								</div>
							</nav>
						</div>
						<EmptyState
							v-else
							:title="
								selectedStatus === 'active'
									? 'No Active Events'
									: 'No Past Events'
							"
							:description="
								selectedStatus === 'active'
									? 'You have no active events. Create one now!'
									: 'You have no past events.'
							"
							:cta="{
								label: 'Create Event',
								to: { name: 'new-event' },
							}"
						/>
					</template>
				</div>
			</div>
		</section>
  </div>
</template>
