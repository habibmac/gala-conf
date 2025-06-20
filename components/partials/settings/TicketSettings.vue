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
    registrations_by_status: Record<string, number> // Updated: now uses status codes
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
const eventId = route.params.eventId as string;

// State with proper types
const tickets = ref<Ticket[]>([]);
const availableDatetimes = ref<any[]>([]);
const isLoadingTickets = ref(true);
const editingTicketId = ref<string | null>(null);
const isUpdatingOrder = ref(false);
const isDragging = ref(false);
const isAllExpanded = ref(false);

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
  // Remove computed() wrapper - use reactive getter instead
  get disabled() {
    return editingTicketId.value !== null || isUpdatingOrder.value;
  },
  onStart(_evt) {
    isDragging.value = true;
    // Store original order before dragging starts
    originalOrder.value = tickets.value.map(ticket => ticket.id);
  },
  onEnd(evt) {
    isDragging.value = false;

    // Check if the order actually changed
    const newOrder = tickets.value.map(ticket => ticket.id);
    const orderChanged = JSON.stringify(originalOrder.value) !== JSON.stringify(newOrder);

    if (orderChanged && evt.oldIndex !== evt.newIndex) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        updateTicketOrder();
      }, 100);
    }
  },
  onUpdate(_evt) {
    console.warn('Order updated in DOM');
  },
  // Handle cancellation (escape key or invalid drop)
  onSort(evt) {
    // This fires when the sort is cancelled or invalid
    if (evt.oldIndex === evt.newIndex) {
      toast.info('No changes made to ticket order');
    }
  },
};

// Keyboard event handler for escape key
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isDragging.value) {
    // Restore original order if escape is pressed during drag
    restoreOriginalOrder();
  }
};

const restoreOriginalOrder = () => {
  if (originalOrder.value.length > 0) {
    // Restore the original order
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

  // Initialize draggable after data is loaded and DOM is ready
  await nextTick();

  if (dragContainer.value && tickets.value.length > 0) {
    const { start: startDraggable } = useDraggable<Ticket>(
      dragContainer,
      tickets,
      draggableOptions,
    );
    startDraggable();
  }

  // Add keyboard event listener
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
    const response = await $galantisApi.get(`/event/${eventId}/tickets?include_sales=true&include_datetimes=true`);

    if (response.data.success) {
      tickets.value = response.data.data.map((ticket: any, index: number): Ticket => ({
        // Ensure id is always a string
        id: ticket.id || `ticket-${index}`,
        name: ticket.name || '',
        description: ticket.description || '',
        price: Number(ticket.price) || 0,
        quantity: ticket.quantity || 0,
        sold: ticket.sold || 0,
        reserved: ticket.reserved || 0,
        available: ticket.available || 0,
        status: ticket.status || 'upcoming',
        is_on_sale: Boolean(ticket.is_on_sale),
        is_expired: Boolean(ticket.is_expired),
        start_date: ticket.start_date,
        end_date: ticket.end_date,
        datetime_ids: ticket.datetime_ids || [],
        constraints: ticket.constraints,
        sales_stats: ticket.sales_stats,
        datetimes: ticket.datetimes,
      }));

      // Store initial order
      originalOrder.value = tickets.value.map(ticket => ticket.id);
    }
  }
  catch (error) {
    console.error('Error loading tickets:', error);
    toast.error('Failed to load tickets');
  }
  finally {
    isLoadingTickets.value = false;
  }
};

const loadDatetimes = async () => {
  try {
    const response = await $galantisApi.get(`/event/${eventId}/datetimes`);
    if (response.data) {
      availableDatetimes.value = response.data;
    }
  }
  catch (error) {
    console.error('Error loading datetimes:', error);
  }
};

const updateTicketOrder = async () => {
  if (isUpdatingOrder.value || isDragging.value) {
    return;
  }

  try {
    isUpdatingOrder.value = true;

    // Update order in backend - fix payload structure
    const ticketOrders = tickets.value
      .filter(ticket => ticket.id && !ticket.id.startsWith('temp-')) // Only existing tickets
      .map((ticket, index) => ({
        ticket_id: ticket.id,
        order: index + 1,
      }));

    if (ticketOrders.length > 0) {
      const response = await $galantisApi.put(`/event/${eventId}/tickets/order`, {
        ticket_orders: ticketOrders,
      });

      if (response.data.success) {
        toast.success('Ticket order updated');
        // Update original order after successful save
        originalOrder.value = tickets.value.map(ticket => ticket.id);
      }
    }
  }
  catch (error: any) {
    console.error('Error updating order:', error);
    toast.error('Failed to update order');

    // Restore original order on error
    restoreOriginalOrder();

    // Optionally reload to get correct order from server
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
  // If it's a new ticket (temp ID), remove it
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
      // Create new ticket
      const { id, ...createData } = ticketData;
      response = await $galantisApi.post(`/event/${eventId}/tickets`, createData);
    }
    else {
      // Update existing ticket
      response = await $galantisApi.put(`/event/${eventId}/ticket/${ticketData.id}`, ticketData);
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
  catch (error: any) {
    console.error('Error saving ticket:', error);
    toast.error('Failed to save ticket', {
      description: error?.response?.data?.message || 'Please check your information and try again',
    });
  }
};

const deleteTicket = async (ticket: Ticket) => {
  if (ticket.id.startsWith('temp-')) {
    // Remove unsaved ticket
    tickets.value = tickets.value.filter(t => t.id !== ticket.id);
    editingTicketId.value = null;
    return;
  }

  try {
    await $galantisApi.delete(`/event/${eventId}/ticket/${ticket.id}`);
    tickets.value = tickets.value.filter(t => t.id !== ticket.id);
    editingTicketId.value = null;
    toast.success('Ticket deleted successfully');
    await loadTickets();
  }
  catch (error: any) {
    console.error('Error deleting ticket:', error);
    toast.error('Failed to delete ticket', {
      description: error?.response?.data?.message || 'Ticket may have sales',
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
    is_on_sale: false,
    is_expired: false,
    constraints: undefined, // Reset constraints for new ticket
    sales_stats: undefined, // Reset sales stats for new ticket
  };

  tickets.value.push(duplicatedTicket);
  editingTicketId.value = newTicketId;
};

// Status helpers
const getStatusConfig = (ticket: Ticket) => {
  if (ticket.is_expired) {
    return {
      bodyClass: 'opacity-50 hover:opacity-100',
      color: 'border-l-gray-500',
      bgColor: 'dark:bg-gray-950/20',
      textColor: 'text-gray-700 dark:text-gray-300',
      icon: 'tabler:clock-x',
      label: 'Expired',
    };
  }

  if (ticket.is_on_sale) {
    return {
      color: 'border-l-emerald-400',
      bgColor: 'dark:bg-emerald-950/20',
      textColor: 'text-emerald-700 dark:text-emerald-300',
      icon: 'tabler:tag',
      label: 'On Sale',
    };
  }

  return {
    color: 'border-l-blue-500',
    bgColor: 'dark:bg-blue-950/20',
    textColor: 'text-blue-700 dark:text-blue-300',
    icon: 'tabler:clock',
    label: 'Upcoming',
  };
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
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
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
          <Icon icon="svg-spinners:ring-resize" class="mx-auto mb-2 size-8 text-muted-foreground" /> <span
            class="text-sm text-muted-foreground"
          >Loading tickets...</span>
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
              :status-config="getStatusConfig(ticket)"
              :is-updating-order="isUpdatingOrder"
              :is-expanded="isAllExpanded"
              :format-currency="formatCurrency"
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
