<script setup lang="ts">
definePageMeta({
  title: 'Create Event',
  showInMenu: false,
  icon: 'add_circle',
  capabilities: ['create_events'],
  requiredPermissions: ['manage_events'],
  group: 'dashboard'
})
</script>
<template>
    <div>
        <h1>Create Event</h1>
    </div>
</template>