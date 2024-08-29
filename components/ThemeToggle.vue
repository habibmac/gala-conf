<script setup lang="ts">
import { Icon } from "@iconify/vue";
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from "@headlessui/vue";
import { ref, watch } from "vue";

const selectedColorMode = ref("system");
const colorMode = useColorMode();
const colors = ["dark", "light", "system"];

// Update selectedColorMode when colorMode.preference changes
watch(
  () => colorMode.preference,
  (newPreference) => {
    selectedColorMode.value = newPreference;
  }
);
</script>

<template>
  <ClientOnly>
    <Listbox v-model="selectedColorMode">
      <div class="relative">
        <ListboxButton class="icon-btn">
            <Icon
              :icon="
                colorMode.value === 'dark' ? 'heroicons:moon' : 'heroicons:sun'
              "
              class="h-5 w-5"
            />
            <span class="sr-only">{{ colorMode.preference }}</span>
        </ListboxButton>
        <Transition
          enter-active-class="transition ease-out duration-200 transform"
          enter-from-class="opacity-0 -translate-y-2"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition ease-out duration-200"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <ListboxOptions
            class="absolute right-0 top-full z-10 min-w-24 origin-top-right overflow-hidden rounded-md mt-1 border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-950"
          >
            <ListboxOption
              v-for="color in colors"
              :key="color"
              :value="color"
              :disabled="color === colorMode.preference"
              as="template"
            >
              <li
                :class="[
                  color === colorMode.preference ? 'selected' : '',
                  'dropdown-item',
                ]"
                @click="colorMode.preference = color"
              >
              <Icon
              :icon="
                color === 'system' ? '' : color === 'dark' ? 'heroicons:moon' : 'heroicons:sun'
              "
              class="h-4 w-4"
            />
                <span>
                  {{
                    color === "dark"
                      ? "Dark"
                      : color === "light"
                      ? "Light"
                      : "System"
                  }}
                </span>
              </li>
            </ListboxOption>
          </ListboxOptions>
        </Transition>
      </div>
    </Listbox>
  </ClientOnly>
</template>
