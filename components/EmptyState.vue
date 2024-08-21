<script setup lang="ts">
defineProps({
	title: {
		type: String,
		default: 'No data found',
	},
	description: {
		type: String,
		required: false,
	},
	cta: {
		type: Object,
		default: () => ({
			label: 'Reset Filters',
			to: '',
		}),
	},
});
</script>
<template>
	<div class="m-auto my-4 max-w-2xl">
		<div class="px-4 text-center">
			<div
				class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-t from-slate-200 to-slate-100 dark:from-slate-700 dark:to-slate-800"
			>
				<svg class="h-6 w-5 fill-current" viewBox="0 0 20 24">
					<path
						class="text-slate-500 dark:text-slate-600"
						d="M10 10.562l9-5-8.514-4.73a1 1 0 00-.972 0L1 5.562l9 5z"
					/>
					<path
						class="text-slate-300 dark:text-slate-400"
						d="M9 12.294l-9-5v10.412a1 1 0 00.514.874L9 23.294v-11z"
					/>
					<path
						class="text-slate-400 dark:text-slate-500"
						d="M11 12.294v11l8.486-4.714a1 1 0 00.514-.874V7.295l-9 4.999z"
					/>
				</svg>
			</div>
			<h2
				class="mb-2 text-xl font-bold text-slate-500 dark:text-slate-100"
			>
				{{ title }}
			</h2>
			<p class="mb-5 text-sm" v-if="description">
				{{ description }}
			</p>

			<NuxtLink
				class="btn bg-blue-500 text-slate-50 hover:bg-blue-600 dark:bg-blue-600 dark:text-slate-100 dark:hover:bg-blue-700"
				:to="cta.to"
			>
				<span class="text-sm font-medium">{{ cta.label }}</span>
			</NuxtLink>
		</div>
	</div>
</template>
