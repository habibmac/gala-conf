<script setup lang="ts">
import { useRoute } from '#app';

definePageMeta({
  title: "Event",
  description: "Event details",
  layout: "dashboard-with-sidebar",
});

const route = useRoute();

</script>

<template>
  <div>
    <h1>Event Details</h1>
    <p>Event ID: {{ route.params.eventId }}</p>
  </div>
</template>