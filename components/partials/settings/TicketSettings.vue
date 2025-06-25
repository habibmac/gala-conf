<script setup lang="ts">
import type { UseDraggableOptions } from 'vue-draggable-plus';

import { Icon } from '@iconify/vue';
import { useDraggable } from 'vue-draggable-plus';
import { toast } from 'vue-sonner';

import TicketDisplayCard from './TicketDisplayCard.vue';
import TicketEditCard from './TicketEditCard.vue';

interface Props {
  eventData: any
  isLoading?: boolean
}

interface Ticket {
  id: string
  name: string
  description?: string
  price: number
  quantity: number
  sold: number
  reserved: number
  available: number
  status: string
  status_code?: string
  is_on_sale: boolean
  is_expired: boolean
  start_date?: string
  end_date?: string
  datetime_ids?: string[]
  constraints?: {
    can_modify: Record<string, boolean>
    sold: number
    reserved: number
    total_registrations: number
    registrations_by_status: Record<string, number>
    min_allowed_quantity: number
    is_sold_out: boolean
  }
  sales_stats?: {
    total_sold: number
    revenue: number
    by_status: Record<string, number>
  }
  datetimes?: Array<{
    id: string
    name: string
    date_start: string
    date_end: string
  }>
}

const props = defineProps<Props>();

const emit = defineEmits<{
  save: [data: any]
}>();

const { $galantisApi } = useNuxtApp();
const route = useRoute();
const eventId = computed(() => route.params.eventId as string || '');

// State with proper types
const tickets = ref<Ticket[]>([]);
const availableDatetimes = ref<any[]>([]);
const isLoadingTickets = ref(true);
const editingTicketId = ref<string | null>(null);
const isUpdatingOrder = ref(false);
const isDragging = ref(false);
const isAllExpanded = ref(true);

// Track original order for cancellation
const originalOrder = ref<string[]>([]);

// Draggable setup with explicit types
const dragContainer = ref<HTMLElement | null>(null);

const draggableOptions: UseDraggableOptions<Ticket> = {
  animation: 150,
  ghostClass: 'ghost-item',
  chosenClass: 'chosen-item',
  dragClass: 'drag-item',
  handle: '.drag-handle',
  get disabled() {
    return editingTicketId.value !== null || isUpdatingOrder.value;
  },
  onStart(_evt) {
    isDragging.value = true;
    originalOrder.value = tickets.value.map(ticket => ticket.id);
  },
  onEnd(evt) {
    isDragging.value = false;
    const newOrder = tickets.value.map(ticket => ticket.id);
    const orderChanged = JSON.stringify(originalOrder.value) !== JSON.stringify(newOrder);

    if (orderChanged && evt.oldIndex !== evt.newIndex) {
      setTimeout(() => {
        updateTicketOrder();
      }, 100);
    }
  },
  onUpdate(_evt) {
    console.warn('Order updated in DOM');
  },
  onSort(evt) {
    if (evt.oldIndex === evt.newIndex) {
      toast.info('No changes made to ticket order');
    }
  },
};

// Keyboard event handler for escape key
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isDragging.value) {
    restoreOriginalOrder();
  }
};

const restoreOriginalOrder = () => {
  if (originalOrder.value.length > 0) {
    const orderedTickets = originalOrder.value
      .map(id => tickets.value.find(ticket => ticket.id === id))
      .filter(Boolean) as Ticket[];

    tickets.value = orderedTickets;
    isDragging.value = false;
  }
};

// Add keyboard listener on mount
onMounted(async () => {
  await Promise.all([loadTickets(), loadDatetimes()]);

  await nextTick();

  if (dragContainer.value && tickets.value.length > 0) {
    const { start: startDraggable } = useDraggable<Ticket>(
      dragContainer,
      tickets,
      draggableOptions,
    );
    startDraggable();
  }

  document.addEventListener('keydown', handleKeyDown);
});

// Remove keyboard listener on unmount
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown);
});

// Watch for eventData changes
watch(() => props.eventData, (newEventData) => {
  if (newEventData?.eventDatetimes) {
    availableDatetimes.value = newEventData.eventDatetimes;
  }
}, { immediate: true });

const loadTickets = async () => {
  try {
    isLoadingTickets.value = true;
    const response = await $galantisApi.get(`/event/${eventId.value}/tickets?include_sales=true&include_datetimes=true`);

    if (response.data) {
      tickets.value = response.data.map((ticket: any, index: number): Ticket => ({
        id: ticket.id || `ticket-${index}`,
        name: ticket.name || '',
        description: ticket.description || '',
        price: Number(ticket.price) || 0,
        quantity: ticket.quantity || 0,
        sold: ticket.sold || 0,
        reserved: ticket.reserved || 0,
        available: ticket.available || 0,
        status: ticket.status || 'upcoming',
        status_code: ticket.status_code || 'TKO',
        is_on_sale: Boolean(ticket.is_on_sale),
        is_expired: Boolean(ticket.is_expired),
        start_date: ticket.start_date,
        end_date: ticket.end_date,
        datetime_ids: ticket.datetime_ids || [],
        constraints: ticket.constraints,
        sales_stats: ticket.sales_stats,
        datetimes: ticket.datetimes,
      }));

      originalOrder.value = tickets.value.map(ticket => ticket.id);
    }
  }
  catch (error) {
    const { errorMessage, errorDescription } = handleApiError(error, 'Failed to load tickets');

    toast.error(errorMessage, {
      description: errorDescription,
    });
  }
  finally {
    isLoadingTickets.value = false;
  }
};

const loadDatetimes = async () => {
  try {
    const response = await $galantisApi.get(`/event/${eventId.value}/datetimes`);
    if (response.data) {
      availableDatetimes.value = response.data;
    }
  }
  catch (error) {
    const { errorMessage, errorDescription } = handleApiError(error, 'Failed to load datetimes');

    toast.error(errorMessage, {
      description: errorDescription,
    });
  }
};

const updateTicketOrder = async () => {
  if (isUpdatingOrder.value || isDragging.value) {
    return;
  }

  try {
    isUpdatingOrder.value = true;

    const ticketOrders = tickets.value
      .filter(ticket => ticket.id && !ticket.id.startsWith('temp-'))
      .map((ticket, index) => ({
        ticket_id: ticket.id,
        order: index + 1,
      }));

    if (ticketOrders.length > 0) {
      const response = await $galantisApi.put(`/event/${eventId.value}/tickets/order`, {
        ticket_orders: ticketOrders,
      });

      if (response.data.success) {
        toast.success('Ticket order updated');
        originalOrder.value = tickets.value.map(ticket => ticket.id);
      }
    }
  }
  catch (error) {
    const { errorMessage, errorDescription } = handleApiError(error, 'Failed to update order');

    toast.error(errorMessage, {
      description: errorDescription,
    });

    restoreOriginalOrder();
    await loadTickets();
  }
  finally {
    isUpdatingOrder.value = false;
  }
};

const addTicket = () => {
  const newTicketId = `temp-${Date.now()}`;
  editingTicketId.value = newTicketId;

  const newTicket: Ticket = {
    id: newTicketId,
    name: `Ticket ${tickets.value.length + 1}`,
    description: '',
    price: 0,
    quantity: 100,
    sold: 0,
    reserved: 0,
    available: 100,
    status: 'upcoming',
    status_code: 'TKO',
    is_on_sale: false,
    is_expired: false,
    datetime_ids: [],
  };

  tickets.value.push(newTicket);
};

const expandAllTickets = () => {
  isAllExpanded.value = !isAllExpanded.value;
};

const editTicket = (ticketId: string) => {
  editingTicketId.value = ticketId;
};

const cancelEdit = () => {
  if (editingTicketId.value?.startsWith('temp-')) {
    tickets.value = tickets.value.filter(t => t.id !== editingTicketId.value);
  }
  editingTicketId.value = null;
};

const saveTicket = async (ticketData: Ticket) => {
  try {
    const isNewTicket = ticketData.id.startsWith('temp-');
    let response;

    if (isNewTicket) {
      const { id, ...createData } = ticketData;
      response = await $galantisApi.post(`/event/${eventId.value}/tickets`, createData);
    }
    else {
      response = await $galantisApi.put(`/event/${eventId.value}/ticket/${ticketData.id}`, ticketData);
    }

    if (response.data.success) {
      toast.success(isNewTicket ? 'Ticket created successfully' : 'Ticket updated successfully');
      editingTicketId.value = null;
      await loadTickets();
      emit('save', { tickets: tickets.value });
    }
    else {
      throw new Error(response.data.message || 'Failed to save ticket');
    }
  }
  catch (error) {
    const { errorMessage, errorDescription } = handleApiError(error, 'Failed to save ticket');

    toast.error(errorMessage, {
      description: errorDescription || 'Please check your information and try again',
    });
  }
};

const deleteTicket = async (ticket: Ticket) => {
  if (ticket.id.startsWith('temp-')) {
    tickets.value = tickets.value.filter(t => t.id !== ticket.id);
    editingTicketId.value = null;
    return;
  }

  try {
    await $galantisApi.delete(`/event/${eventId.value}/ticket/${ticket.id}`);
    tickets.value = tickets.value.filter(t => t.id !== ticket.id);
    editingTicketId.value = null;
    toast.success('Ticket deleted successfully');
    await loadTickets();
  }
  catch (error) {
    const { errorMessage, errorDescription } = handleApiError(error, 'Failed to delete ticket');

    toast.error(errorMessage, {
      description: errorDescription,
    });
  }
};

const duplicateTicket = (ticket: Ticket) => {
  const newTicketId = `temp-${Date.now()}`;
  const duplicatedTicket: Ticket = {
    ...ticket,
    id: newTicketId,
    name: `${ticket.name} (Copy)`,
    sold: 0,
    reserved: 0,
    available: ticket.quantity,
    status: 'upcoming',
    status_code: 'TKO',
    is_on_sale: false,
    is_expired: false,
    constraints: undefined,
    sales_stats: undefined,
  };

  tickets.value.push(duplicatedTicket);
  editingTicketId.value = newTicketId;
};

const canEdit = (ticket: Ticket) => {
  if (!ticket.constraints)
    return true;
  return ticket.constraints.total_registrations === 0;
};

const getEditWarning = (ticket: Ticket) => {
  if (!ticket.constraints)
    return null;

  const { total_registrations, sold, reserved } = ticket.constraints;

  if (total_registrations > 0) {
    return `This ticket has ${total_registrations} registrations (${sold} sold, ${reserved} reserved). Some fields cannot be modified.`;
  }

  return null;
};

watch(tickets, async (newTickets) => {
  if (newTickets.length > 0 && dragContainer.value) {
    await nextTick();
    const { start: startDraggable } = useDraggable<Ticket>(
      dragContainer,
      tickets,
      draggableOptions,
    );
    startDraggable();
  }
}, { flush: 'post' });
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="space-y-4">
      <div class="flex items-center justify-end">
        <Button
          v-if="tickets.length > 0"
          variant="ghost"
          size="sm"
          class="hover:bg-slate-200 dark:hover:bg-slate-800"
          :disabled="isLoadingTickets || isUpdatingOrder || editingTicketId !== null"
          @click="expandAllTickets"
        >
          <Icon v-if="isAllExpanded" icon="tabler:layout-list" class="mr-2 size-4" />
          <Icon v-else icon="tabler:layout-grid" class="mr-2 size-4" />
          {{ isAllExpanded ? 'Complete' : 'Compact' }} View
        </Button>
      </div>

      <!-- Loading State -->
      <div v-if="isLoadingTickets" class="flex items-center justify-center py-8">
        <div class="flex items-center gap-2">
          <Icon icon="svg-spinners:ring-resize" class="mx-auto mb-2 size-8 text-muted-foreground" />
          <span class="text-sm text-muted-foreground">Loading tickets...</span>
        </div>
      </div>

      <!-- Draggable Tickets Container -->
      <div v-else>
        <div ref="dragContainer" class="space-y-4">
          <div
            v-for="ticket in tickets"
            :key="ticket.id"
            class="ticket-item"
            :class="{
              'pointer-events-none': editingTicketId !== null && editingTicketId !== ticket.id,
              'opacity-50': isUpdatingOrder,
              'cursor-grabbing': isDragging,
            }"
          >
            <!-- Editing Mode -->
            <TicketEditCard
              v-if="editingTicketId === ticket.id"
              :ticket="ticket"
              :available-datetimes="availableDatetimes"
              :can-edit="canEdit(ticket)"
              :edit-warning="getEditWarning(ticket)"
              @save="saveTicket"
              @cancel="cancelEdit"
              @delete="deleteTicket"
            />

            <!-- Display Mode -->
            <TicketDisplayCard
              v-else
              :ticket="ticket"
              :is-updating-order="isUpdatingOrder"
              :is-expanded="isAllExpanded"
              @edit="editTicket"
              @duplicate="duplicateTicket"
              @delete="deleteTicket"
            />
          </div>
        </div>

        <div class="mt-4 flex items-center justify-between">
          <Button
            variant="default"
            :disabled="isLoadingTickets || isUpdatingOrder || editingTicketId !== null"
            @click="addTicket"
          >
            <Icon icon="tabler:plus" class="mr-2 size-4" />
            Add Ticket
          </Button>
        </div>

        <!-- Empty State -->
        <Card v-if="tickets.length === 0" class="border-dashed">
          <CardContent class="flex items-center justify-center py-12">
            <div class="text-center">
              <Icon icon="solar:ticket-bold-duotone" class="mx-auto mb-4 size-12 text-muted-foreground" />
              <h3 class="mb-2 font-medium">
                No tickets configured
              </h3>
              <p class="mb-4 text-sm text-muted-foreground">
                Add your first ticket to get started
              </p>
              <Button @click="addTicket">
                <Icon icon="tabler:plus" class="mr-2 size-4" />
                Add Ticket
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Ghost item - the placeholder where item will be dropped */
.ghost-item {
  opacity: 0.3;
  background: transparent;
  border: 2px dashed #cbd5e1;
  border-radius: 8px;
  transform: scale(0.98);
}

/* Chosen item - the original item being dragged (make it invisible) */
.chosen-item {
  opacity: 0.1 !important;
  border: 2px dashed #e2e8f0 !important;
  background: transparent !important;
  transform: scale(0.95);
}

/* Drag item - the item being dragged around */
.drag-item {
  cursor: grabbing !important;
  transform: rotate(2deg) scale(1.05);
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  z-index: 1000;
}

/* Dark mode ghost item */
.dark .ghost-item {
  border-color: #475569;
}

.dark .chosen-item {
  border-color: #475569 !important;
}
</style>
