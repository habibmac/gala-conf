<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core';

import MenuIcon from '~/components/MenuIcon.vue';
import Logo from '~/components/Logo.vue';

const props = defineProps(['sidebarOpen']);
const emit = defineEmits(['close-sidebar']);

const { menuItems } = useMenu();

const trigger = ref<HTMLElement | null>(null);
const sidebar = ref<HTMLElement | null>(null);

const breakpoints = useBreakpoints(breakpointsTailwind);
const lgAndSmaller = breakpoints.smallerOrEqual('lg');

const storedSidebarExpanded = localStorage.getItem('sidebar-expanded');
const sidebarExpanded = ref(
	storedSidebarExpanded === null ? false : storedSidebarExpanded === 'true',
);

const clickHandler = (event: MouseEvent) => {
	const target = event.target as HTMLElement;
	if (!sidebar.value || !trigger.value) return;
	if (
		!props.sidebarOpen ||
		sidebar.value.contains(target) ||
		trigger.value.contains(target) ||
		!lgAndSmaller.value
	)
		return;
	emit('close-sidebar');
};

const keyHandler = (event: KeyboardEvent) => {
	if (!props.sidebarOpen || event.key !== 'Escape' || !lgAndSmaller.value)
		return;
	emit('close-sidebar');
};

onMounted(() => {
	document.addEventListener('click', clickHandler);
	document.addEventListener('keydown', keyHandler);
});

onUnmounted(() => {
	document.removeEventListener('click', clickHandler);
	document.removeEventListener('keydown', keyHandler);
});

watch(sidebarExpanded, (newValue) => {
	localStorage.setItem('sidebar-expanded', String(newValue));
	const body = document.querySelector('body');
	if (body) {
		if (newValue) {
			body.classList.add('sidebar-expanded');
		} else {
			body.classList.remove('sidebar-expanded');
		}
	}
});
</script>

<template>
	<div class="min-w-fit">
		<!-- Sidebar backdrop (mobile only) -->
		<div
			class="fixed inset-0 z-40 bg-slate-900 bg-opacity-30 transition-opacity duration-200 lg:z-auto lg:hidden"
			:class="
				sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
			"
			aria-hidden="true"
		></div>

		<!-- Sidebar -->
		<div
			id="sidebar"
			ref="sidebar"
			class="no-scrollbar lg:sidebar-expanded:!w-64 z-60 absolute left-0 top-0 flex h-[100dvh] w-64 shrink-0 flex-col overflow-y-scroll bg-gradient-to-t from-blue-700 to-blue-700 transition-all duration-200 ease-in-out lg:static lg:left-auto lg:top-auto lg:w-20 lg:translate-x-0 lg:overflow-y-auto 2xl:!w-64"
			:class="sidebarOpen ? 'translate-x-0' : '-translate-x-64'"
		>
			<!-- Sidebar header -->
			<div
				class="flex items-center justify-between bg-gradient-to-tr from-blue-700 via-blue-700 to-sky-400 p-4 sm:px-4"
			>
				<!-- Close button -->
				<button
					ref="trigger"
					class="text-slate-300 hover:text-slate-100 lg:hidden"
					@click.stop="$emit('close-sidebar')"
					aria-controls="sidebar"
					:aria-expanded="sidebarOpen"
				>
					<span class="sr-only">Close sidebar</span>
					<svg
						class="h-6 w-6 fill-current"
						viewBox="0 0 24 24"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M10.7 18.7l1.4-1.4L7.8 13H20v-2H7.8l4.3-4.3-1.4-1.4L4 12z"
						/>
					</svg>
				</button>
				<!-- Logo -->
				<RouterLink :to="{ name: 'MyEvents' }" class="mx-auto pl-1">
					<Logo class="h-10 w-10 fill-white" />
				</RouterLink>
			</div>

			<!-- Links -->
			<div class="space-y-8 p-4" v-if="menuItems">
				<!-- Pages group -->
				<div v-for="group in menuItems" :key="group.id">
					<h3
						v-if="group.label"
						class="pl-3 text-xs uppercase tracking-wider text-slate-400"
					>
						<span
							class="lg:sidebar-expanded:hidden hidden w-6 text-center lg:block 2xl:hidden"
							aria-hidden="true"
							>•••</span
						>
						<span
							class="lg:sidebar-expanded:block lg:hidden 2xl:block"
							>{{ group.label }}</span
						>
					</h3>
					<ul class="mt-3">
						<router-link
							v-for="(linkItem, index) in group.menus"
							:to="linkItem.to"
							custom
							v-slot="{ href, navigate, isExactActive }"
							:key="index"
						>
							<li class="mb-0.5 last:mb-0">
								<a
									class="block truncate rounded px-3 py-2 text-slate-200 transition"
									:class="
										isExactActive
											? 'bg-blue-950 hover:bg-blue-950 hover:text-slate-200'
											: 'hover:bg-blue-900/60 hover:text-white'
									"
									:href="href"
									@click="navigate"
								>
									<div
										class="flex items-center justify-between"
									>
										<div class="flex grow items-center">
											<MenuIcon
												v-if="linkItem.icon"
												:name="linkItem.icon"
												class="h-5 w-5 fill-current"
											/>
											<span
												class="lg:sidebar-expanded:opacity-100 ml-3 text-sm font-medium lg:opacity-0 2xl:opacity-100"
												>{{ linkItem.name }}</span
											>
										</div>
									</div>
								</a>
							</li>
						</router-link>
					</ul>
				</div>
			</div>
			<div v-else>Error loading menu items</div>

			<!-- Expand / collapse button -->
			<div
				class="mt-auto hidden justify-end p-4 pt-3 lg:inline-flex 2xl:hidden"
			>
				<div class="px-3 py-2">
					<button @click.prevent="sidebarExpanded = !sidebarExpanded">
						<span class="sr-only">Expand / collapse sidebar</span>
						<svg
							class="sidebar-expanded:rotate-180 h-6 w-6 fill-current"
							viewBox="0 0 24 24"
						>
							<path
								class="text-slate-200"
								d="M19.586 11l-5-5L16 4.586 23.414 12 16 19.414 14.586 18l5-5H7v-2z"
							/>
							<path class="text-slate-400" d="M3 23H1V1h2z" />
						</svg>
					</button>
				</div>
			</div>
		</div>
	</div>
</template>
