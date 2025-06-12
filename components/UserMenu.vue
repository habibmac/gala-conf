<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';

const { user } = useUserProfile();
const config = useRuntimeConfig();

const backendUrl = `${config.public.apiUrl}/backend`;

const dropdownOpen = ref(false);
const trigger = ref<HTMLElement | null>(null);
const dropdown = ref<HTMLElement | null>(null);

// Close on click outside
const clickHandler = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (
    !dropdownOpen.value
    || (dropdown.value && dropdown.value.contains(target))
    || (trigger.value && trigger.value.contains(target))
  ) {
    return;
  }
  dropdownOpen.value = false;
};

// Close if the ESC key is pressed
const keyHandler = (event: KeyboardEvent) => {
  if (!dropdownOpen.value || event.key !== 'Escape')
    return;
  dropdownOpen.value = false;
};

onMounted(() => {
  document.addEventListener('click', clickHandler);
  document.addEventListener('keydown', keyHandler);
});

onUnmounted(() => {
  document.removeEventListener('click', clickHandler);
  document.removeEventListener('keydown', keyHandler);
});
</script>

<template>
  <div class="relative ml-2 inline-flex">
    <button
      ref="trigger"
      class="icon-btn round group"
      aria-haspopup="true"
      :aria-expanded="dropdownOpen"
      @click.prevent="dropdownOpen = !dropdownOpen"
    >
      <img
        v-if="user"
        class="pointer-events-none size-8 rounded-full"
        :src="user.avatar"
        width="32"
        height="32"
        alt="User"
      >
      <div v-else class="size-8 rounded-full bg-slate-100 dark:bg-slate-700" />
    </button>
    <Transition
      enter-active-class="transition ease-out duration-200 transform"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-out duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-show="dropdownOpen"
        class="absolute right-0 top-full z-10 mt-1 min-w-64 origin-top-right overflow-hidden rounded-md border border-slate-200 bg-white py-1.5 shadow-lg dark:border-slate-800 dark:bg-slate-950"
      >
        <ul
          ref="dropdown"
          class="text-left"
          @focusin="dropdownOpen = true"
          @focusout="dropdownOpen = false"
        >
          <template v-if="user">
            <li class="mb-1 border-b border-slate-200 px-3 pb-2 pt-0.5 dark:border-slate-900">
              <div class="text-sm font-medium text-slate-800 dark:text-slate-100">
                {{ user.display_name }}
              </div>
              <div class="text-xs text-slate-500 dark:text-slate-400">
                {{ user.user_email }}
              </div>
            </li>
            <template v-if="user.user_roles.includes('administrator')">
              <NuxtLink v-slot="{ href, navigate }" :to="backendUrl" custom>
                <li>
                  <a :href="href" class="dropdown-item" @click="navigate">🚨 Backend</a>
                </li>
              </NuxtLink>
              <hr class="h-1 dark:border-slate-900">
            </template>

            <NuxtLink v-slot="{ href, navigate }" to="/my-events" custom>
              <li>
                <a :href="href" class="dropdown-item" @click="navigate">My Events</a>
              </li>
            </NuxtLink>
            <NuxtLink v-slot="{ href, navigate }" to="/my-events" custom>
              <li>
                <a :href="href" class="dropdown-item" @click="navigate">Settings</a>
              </li>
            </NuxtLink>
            <hr class="h-1 dark:border-slate-900">
            <NuxtLink v-slot="{ href, navigate }" to="/auth/logout" custom>
              <li>
                <a :href="href" class="dropdown-item" @click="navigate">Logout</a>
              </li>
            </NuxtLink>
          </template>
        </ul>
      </div>
    </Transition>
  </div>
</template>
