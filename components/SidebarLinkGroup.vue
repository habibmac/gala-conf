<!-- components/SidebarLinkGroup.vue -->
<script setup lang="ts">
interface Props {
  activeCondition?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  activeCondition: false,
});

const expanded = ref(props.activeCondition);

const handleClick = () => {
  expanded.value = !expanded.value;
};

// Watch for activeCondition changes
watch(() => props.activeCondition, (newValue) => {
  if (newValue) {
    expanded.value = true;
  }
});

// Provide the expanded state and handler to slots
provide('sidebarLinkGroup', {
  expanded: readonly(expanded),
  handleClick,
});
</script>

<template>
  <slot :expanded="expanded" :handle-click="handleClick" />
</template>
