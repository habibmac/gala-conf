<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { Icon } from "@iconify/vue";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const props = defineProps<{
  modelValue: string[];
}>();

const router = useRouter();

const eventId = ref<string>(
  Array.isArray(router.currentRoute.value.params.eventId)
    ? router.currentRoute.value.params.eventId[0]
    : router.currentRoute.value.params.eventId || ""
);

const selectedTickets = ref<string[]>(props.modelValue);
const emits = defineEmits(["update:modelValue"]);

const getData = async (eventId: Ref<string>, signal: AbortSignal) => {
  const { $galantisApi } = useNuxtApp();
  return $galantisApi
    .get(`/event/${eventId.value}/tickets`, { signal })
    .then((response) => {
      if (response.data && response.data.length > 0) {
        return response.data;
      } else {
        return [];
      }
    })
    .catch((error) => {
      console.error("Error fetching tickets:", error);
      return [];
    });
};

const {
  isLoading,
  isError,
  error,
  data: tickets,
} = useQuery({
  queryKey: ["tickets", eventId],
  queryFn: ({ signal }) => getData(eventId, signal),
  enabled: true,
  staleTime: 1000 * 60 * 5, // 5 minutes
});

watch(
  () => props.modelValue,
  (newValue) => {
    selectedTickets.value = newValue;
  }
);

function updateValue(value: string) {
  const updatedTickets = selectedTickets.value.includes(value)
    ? selectedTickets.value.filter((ticket) => ticket !== value)
    : [...selectedTickets.value, value];

  emits("update:modelValue", updatedTickets);
  selectedTickets.value = updatedTickets;
}

const buttonLabel = computed(() => {
  if (selectedTickets.value.length === 0) return "All Tickets";
  if (selectedTickets.value.length === 1) return selectedTickets.value[0];
  return `${selectedTickets.value.length} tickets selected`;
});

function clearAllTickets() {
  emits("update:modelValue", []);
  selectedTickets.value = [];
}

const searchTerm = ref('');

const filterFunction = computed(() => {
  return (list: any[], term: string) => {
    if (!list) return [];
    return list.filter(
      (item) => item.name && item.name.toLowerCase().includes(term.toLowerCase())
    );
  };
});

const showSearch = computed(() => {
  return tickets.value && tickets.value.length > 5;
});

const ticketOptions = computed(() => {
  return tickets.value ? tickets.value : [];
});

const filteredTickets = computed(() => {
  if (!searchTerm.value) return ticketOptions.value;
  return filterFunction.value(ticketOptions.value, searchTerm.value);
});
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button variant="outline" class="h-10 relative bg-card">
        <span
          v-if="selectedTickets.length > 0"
          class="text-xs text-slate-500 border-r pr-2"
        >
          Ticket
        </span>
        <span class="font-medium ml-2 truncate">
          {{ buttonLabel }}
        </span>
        <Icon
          icon="heroicons:chevron-down"
          class="w-3.5 h-3.5 ml-2 text-slate-600 dark:text-slate-400"
        />
        <span v-if="selectedTickets.length > 0" class="absolute h-2 w-2 rounded-full right-0.5 top-0.5 bg-rose-500"></span>
      </Button>
    </PopoverTrigger>
    <PopoverContent class="p-0" align="start">
      <Command :filter-function="filterFunction">
        <CommandInput 
          v-if="showSearch" 
          v-model="searchTerm"
          placeholder="Search tickets..." 
        />
        <CommandList>
          <CommandEmpty>No tickets found.</CommandEmpty>
          <CommandGroup>
            <CommandItem
              :value="{ label: 'All Tickets', value: '' }"
              @select="clearAllTickets"
            >
              <div
                :class="
                  cn(
                    'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                    selectedTickets.length === 0
                      ? 'bg-primary text-primary-foreground'
                      : 'opacity-50 [&_svg]:invisible'
                  )
                "
              >
                <Icon icon="radix-icons:check" class="h-4 w-4" />
              </div>
              <span>All Tickets</span>
            </CommandItem>
            <CommandItem
              v-for="ticket in filteredTickets"
              :key="ticket.id"
              :value="ticket"
              @select="() => updateValue(ticket.name)"
            >
              <div
                :class="
                  cn(
                    'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                    selectedTickets.includes(ticket.name)
                      ? 'bg-primary text-primary-foreground'
                      : 'opacity-50 [&_svg]:invisible'
                  )
                "
              >
                <Icon icon="radix-icons:check" class="h-4 w-4" />
              </div>
              <span>{{ ticket.name }}</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>