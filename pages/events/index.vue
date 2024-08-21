<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "nuxt/app";
import EventCard from "@/components/EventCard.vue";

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
const events = ref([] as Event[]);

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push("/");
    return;
  }

  const { $galantisApi } = useNuxtApp();

  try {
    const response = await $galantisApi.get("/events");
    events.value = response.data?.data || [];
  } catch (error) {
    console.error("Failed to fetch events", error);
  }
});
</script>
<template>
  <div class="flex h-full w-full flex-col">
    <header class="mx-auto w-full max-w-4xl">
      <div class="px-4 py-10 sm:px-6 sm:pt-12">
        <div class="flex justify-between">
          <h1 class="h2">My Events</h1>
          <div class="flex items-center space-x-2">
            <NuxtLink
              to="/events/create"
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
    <section class="grow">
      <div class="mx-auto mb-20 h-full max-w-xs sm:max-w-4xl">
        <div class="px-4 py-4 sm:px-6 sm:py-6">
          <ul v-if="events.length > 0" class="flex flex-col gap-6">
            <li v-for="event in events" :key="event.id">
              <EventCard :event="event" />
            </li>
          </ul>
        </div>
      </div>
    </section>
  </div>
</template>
