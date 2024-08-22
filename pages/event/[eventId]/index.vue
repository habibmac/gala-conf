<script setup lang="ts">
definePageMeta({
  title: "Event",
  description: "Event details",
  layout: "dashboard",
});
</script>

<template>
  <div>
    <h1>Event Details</h1>
    <p>Event ID: {{ $route.params.eventId }}</p>
  </div>
</template>