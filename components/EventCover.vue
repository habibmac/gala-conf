<script setup lang="ts">
const props = defineProps({
	src: {
		type: String,
		required: true,
	},
	title: {
		type: String,
		required: true,
	},
	size: {
		type: Number,
		default: 8,
	},
	online: {
		type: Number,
		default: 3,
	},
	right: {
		type: Number,
		default: 0.5,
	},
	wrapperClass: {
		type: String,
	},
	imgClass: {
		type: String,
		default: 'w-full h-full',
	},
});

function modifyImgPath() {
	// If is dev environment, replace .test with .com
	if (import.meta.env.MODE === 'development') {
		const modifiedPath = props.src.replace('.test', '.com');
		return modifiedPath;
	}
	return props.src;
}
</script>
<template>
	<figure :class="`${wrapperClass} aspect-square shrink-0`">
		<img
			:src="modifyImgPath()"
			:alt="title"
			class="h-full w-full object-cover"
		/>
	</figure>
</template>
