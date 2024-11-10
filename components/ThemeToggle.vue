<script setup lang="ts">
import { Icon } from '@iconify/vue';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useUIStore } from '@/stores/ui.store';

const uiStore = useUIStore();
const colorMode = useColorMode();

const themes = [
    { value: 'dark', label: 'Dark', icon: 'heroicons:moon' },
    { value: 'light', label: 'Light', icon: 'heroicons:sun' },
    { value: 'system', label: 'System' }
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
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
                <Icon :icon="currentThemeIcon" class="h-5 w-5" />
                <span class="sr-only">Toggle theme</span>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
            <DropdownMenuItem
                v-for="theme in themes"
                :key="theme.value"
                @click="uiStore.setTheme(theme.value)"
                :disabled="theme.value === uiStore.preferences.theme"
            >
                <Icon
                    v-if="theme.value !== 'system'"
                    :icon="theme.icon"
                    class="mr-2 h-4 w-4"
                />
                <Icon
                    v-else
                    :icon="colorMode.value === 'dark' ? 'heroicons:moon' : 'heroicons:sun'"
                    class="mr-2 h-4 w-4"
                />
                <span>{{ theme.label }}</span>
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
</template>