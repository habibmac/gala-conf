<script setup lang="ts">
import { Icon } from '@iconify/vue';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUIStore } from '@/stores/ui.store';

const uiStore = useUIStore();
const colorMode = useColorMode();

const themes = [
  { icon: 'heroicons:moon', label: 'Dark', value: 'dark' },
  { icon: 'heroicons:sun', label: 'Light', value: 'light' },
  { label: 'System', value: 'system' },
] as const;

const currentThemeIcon = computed(() => {
  const theme = uiStore.preferences.theme;
  if (theme === 'system') {
    // For system theme, show icon based on actual current theme
    return colorMode.value === 'dark' ? 'heroicons:moon' : 'heroicons:sun';
  }
  return theme === 'dark' ? 'heroicons:moon' : 'heroicons:sun';
});
</script>

<template>
  <ClientOnly>
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button variant="ghost" size="icon" class="hover:bg-card">
          <Icon :icon="currentThemeIcon" class="size-5" />
          <span class="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          v-for="theme in themes"
          :key="theme.value"
          :disabled="theme.value === uiStore.preferences.theme"
          @click="uiStore.setTheme(theme.value)"
        >
          <Icon v-if="theme.value !== 'system'" :icon="theme.icon" class="mr-2 size-4" />
          <Icon v-else :icon="colorMode.value === 'dark' ? 'heroicons:moon' : 'heroicons:sun'" class="mr-2 size-4" />
          <span>{{ theme.label }}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </ClientOnly>
</template>
