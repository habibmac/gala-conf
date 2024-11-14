<script setup lang="ts">
import { ref } from 'vue';
import { getStatusInfo } from '@/utils/status-map';

defineProps<{
  status: string;
}>();

const tooltipOpen = ref(false);
</script>

<template>
  <div
    class="relative text-center"
    @mouseenter="tooltipOpen = true"
    @mouseleave="tooltipOpen = false"
    @focusin="tooltipOpen = true"
    @focusout="tooltipOpen = false"
  >
    <button
      :class="`dot ${getStatusInfo(status).color} inline-block h-2.5 w-2.5`"
      aria-haspopup="true"
      tabindex="-1"
      :aria-expanded="tooltipOpen"
      @click.prevent
    />
    <div class="absolute bottom-full left-1/2 z-10 -translate-x-1/2">
      <transition
        enter-active-class="transition ease-out duration-200 transform -translate-y-2"
        enter-from-class="opacity-0 -translate-y-2"
        enter-to-class="opacity-100 translate-0"
        leave-active-class="transition ease-out duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-show="tooltipOpen"
          :class="[
            getStatusInfo(status).color,
            'right-0 mb-2 overflow-hidden rounded border bg-white px-3 py-1 text-xs text-slate-800 shadow-lg dark:border-slate-700 dark:bg-slate-700 dark:text-slate-200',
          ]"
        >
          <slot />
        </div>
      </transition>
    </div>
  </div>
</template>
