<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue';

const props = defineProps<{
	name: string;
}>();
const loadIcon = (name: string) =>
	defineAsyncComponent(() => import(`@/components/icons/${name}Icon.vue`));

const IconComponent = computed(() => loadIcon(props.name));
</script>

<template>
	<component :is="IconComponent" />
</template>
