<!-- components/partials/registrations/details/AttendeeInfo.vue -->
<script setup lang="ts">
import { Icon } from '@iconify/vue';

import type { RegistrationDetails } from '~/types';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Props {
  registration: RegistrationDetails
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'save-attendee': [payload: any]
}>();

const isSaving = ref(false);
const isEditMode = ref(false);
const originalData = ref<any>({});
const editFormData = ref({
  fullname: '',
  email: '',
  phone: '',
  address: '',
  city: '',
});
const authStore = useAuthStore();

const canEditRegistrations = computed(() => {
  return authStore.userInfo?.user_roles?.some(role =>
    ['administrator', 'ee_event_organizer'].includes(role),
  ) || false;
});

const changedFields = computed(() => {
  const changed = new Set<string>();
  if (editFormData.value.fullname !== originalData.value.fullname)
    changed.add('fullname');
  if (editFormData.value.email !== originalData.value.email)
    changed.add('email');
  if (editFormData.value.phone !== originalData.value.phone)
    changed.add('phone');
  if (editFormData.value.address !== originalData.value.address)
    changed.add('address');
  if (editFormData.value.city !== originalData.value.city)
    changed.add('city');
  return changed;
});

const hasChanges = computed(() => changedFields.value.size > 0);

const enterEditMode = () => {
  originalData.value = {
    fullname: props.registration.fullname || '',
    email: props.registration.email || '',
    phone: props.registration.phone || '',
    address: props.registration.address || '',
    city: props.registration.city || '',
  };

  editFormData.value = {
    fullname: props.registration.fullname || '',
    email: props.registration.email || '',
    phone: props.registration.phone || '',
    address: props.registration.address || '',
    city: props.registration.city || '',
  };
  isEditMode.value = true;
};

const cancelEdit = () => {
  isEditMode.value = false;
  editFormData.value = {
    fullname: '',
    email: '',
    phone: '',
    address: '',
    city: '',
  };
  originalData.value = {};
};

const saveChanges = async () => {
  if (isSaving.value || !hasChanges.value)
    return;

  try {
    isSaving.value = true;
    const payload: any = {};

    if (changedFields.value.has('fullname'))
      payload.fullname = editFormData.value.fullname;
    if (changedFields.value.has('email'))
      payload.email = editFormData.value.email;
    if (changedFields.value.has('phone'))
      payload.phone = editFormData.value.phone;
    if (changedFields.value.has('address'))
      payload.address = editFormData.value.address;
    if (changedFields.value.has('city'))
      payload.city = editFormData.value.city;

    await emit('save-attendee', payload);
    isEditMode.value = false;
  }
  catch (error) {
    console.error('Failed to save attendee info:', error);
  }
  finally {
    isSaving.value = false;
  }
};

const getInitialsName = (name: string): string => {
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .join('');
};

const attendeeInitials = computed(() => {
  return getInitialsName(props.registration.fullname);
});

const isChanged = (field: string) => {
  return changedFields.value.has(field);
};

const displayData = [
  { label: 'Address', key: 'address', value: props.registration.address, editable: true },
  { label: 'City', key: 'city', value: props.registration.city, editable: true },
  { label: 'Registration Date', key: 'date', value: formatDate(props.registration.date, 'dd MMM yyyy HH:mm') },
];

// Last edit information
const lastEdit = computed(() => {
  if (!props.registration.edit_history || props.registration.edit_history.length === 0) {
    return null;
  }
  return props.registration.edit_history[0]; // Most recent edit
});

const showHistoryDialog = ref(false);

const generateAvatarBgColor = (email: string): string => {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Force to 32-bit integer
  }

  // Convert to 6-digit hex color
  const color = Math.abs(hash % 0xFFFFFF).toString(16);
  return color.padStart(6, '0');
};
</script>

<template>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between">
      <div class="flex flex-col gap-1">
        <CardTitle class="flex items-center gap-2">
          <Icon icon="solar:user-circle-bold-duotone" class="size-5 text-orange-500" />
          Attendee Information
        </CardTitle>
        <!-- Last Edit Indicator -->
        <Dialog v-if="lastEdit" v-model:open="showHistoryDialog">
          <DialogTrigger as-child>
            <Button variant="link" class="flex items-center gap-2 text-xs font-normal text-muted-foreground">
              <Icon icon="heroicons:clock" class="size-3.5" />
              <span>Last edited by {{ lastEdit.changed_by.name }} on {{ formatDate(lastEdit.created_at, 'dd MMM yyyy HH:mm') }}</span>
              <Icon icon="heroicons:arrow-top-right-on-square" class="size-3" />
            </Button>
          </DialogTrigger>
          <DialogContent class="max-h-[80vh] max-w-3xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle class="flex items-center gap-2">
                <Icon icon="heroicons:document-text" class="size-5" />
                Edit History
              </DialogTitle>
              <DialogDescription>
                Complete history of changes made to this registration
              </DialogDescription>
            </DialogHeader>
            <div class="mt-4 space-y-3">
              <div
                v-for="entry in registration.edit_history"
                :key="entry.id"
                class="rounded-lg border border-slate-200 p-4 dark:border-slate-700"
              >
                <div class="flex items-start justify-between gap-4">
                  <div class="flex-1 space-y-2">
                    <div class="flex items-center gap-2">
                      <Avatar class="size-8">
                        <AvatarImage :src="`https://www.ui-avatars.com/api/?name=${entry.changed_by.name}&background=${generateAvatarBgColor(entry.changed_by.login)}&color=fff&size=32`" />
                        <AvatarFallback class="text-xs">
                          {{ getInitialsName(entry.changed_by.name) }}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p class="text-sm font-medium">
                          {{ entry.changed_by.name }}
                        </p>
                        <p class="text-xs text-muted-foreground">
                          {{ formatDate(entry.created_at, 'dd MMM yyyy HH:mm') }}
                        </p>
                      </div>
                    </div>
                    <div class="ml-10 space-y-1">
                      <p class="text-sm font-medium text-muted-foreground">
                        {{ entry.field_name }}
                      </p>
                      <div class="flex items-center gap-2 text-sm">
                        <span class="rounded bg-red-100 px-2 py-1 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                          {{ entry.old_value || '(empty)' }}
                        </span>
                        <Icon icon="heroicons:arrow-right" class="size-4 text-muted-foreground" />
                        <span class="rounded bg-green-100 px-2 py-1 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                          {{ entry.new_value }}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div class="text-right text-xs text-muted-foreground">
                    <p>{{ entry.ip_address }}</p>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Button
        v-if="canEditRegistrations && !isEditMode"
        variant="outline"
        size="sm"
        @click.stop="enterEditMode"
      >
        <Icon icon="tabler:edit" class="mr-2" />
        <span>Edit</span>
      </Button>
      <!-- Show X btn -->
      <Button
        v-if="isEditMode"
        variant="outline"
        size="sm"
        @click.stop="cancelEdit"
      >
        <Icon icon="heroicons:x-mark" class="mr-2" />
        <span>Close</span>
      </Button>
    </CardHeader>
    <CardContent class="space-y-6">
      <!-- Main Info -->
      <div class="flex items-start gap-4">
        <Avatar class="size-16">
          <AvatarImage :src="`https://www.ui-avatars.com/api/?name=${registration.fullname}&background=${generateAvatarBgColor(registration.code)}&color=fff`" />
          <AvatarFallback class="text-lg">
            {{ attendeeInitials }}
          </AvatarFallback>
        </Avatar>
        <div class="flex-1 space-y-2">
          <div>
            <!-- Full Name -->
            <div v-if="isEditMode" class="mb-3">
              <div class="flex items-center gap-2">
                <label class="text-xs font-medium text-muted-foreground">Full Name</label>
                <Icon
                  v-if="isChanged('fullname')"
                  icon="heroicons:pencil-square-solid"
                  class="size-3.5 text-amber-600 dark:text-amber-500"
                />
              </div>
              <input
                :value="editFormData.fullname"
                type="text"
                class="mt-1 w-full rounded border px-2 py-1 text-sm dark:bg-slate-700 dark:text-slate-100"
                :class="[
                  isChanged('fullname') ? 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/20' : 'border-input',
                ]"
                @input="(e) => editFormData.fullname = (e.target as HTMLInputElement).value"
              >
            </div>
            <div v-else>
              <h3 class="text-xl font-semibold">
                {{ registration.fullname }}
              </h3>
            </div>

            <!-- Email -->
            <div v-if="isEditMode" class="mb-3">
              <div class="flex items-center gap-2">
                <label class="text-xs font-medium text-muted-foreground">Email</label>
                <Icon
                  v-if="isChanged('email')"
                  icon="heroicons:pencil-square-solid"
                  class="size-3.5 text-amber-600 dark:text-amber-500"
                />
              </div>
              <input
                :value="editFormData.email"
                type="email"
                class="mt-1 w-full rounded border px-2 py-1 text-sm dark:bg-slate-700 dark:text-slate-100"
                :class="[
                  isChanged('email') ? 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/20' : 'border-input',
                ]"
                @input="(e) => editFormData.email = (e.target as HTMLInputElement).value"
              >
            </div>
            <div v-else>
              <p class="text-muted-foreground">
                {{ registration.email }}
              </p>
            </div>
          </div>

          <!-- Phone -->
          <div v-if="isEditMode" class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <label class="text-xs font-medium text-muted-foreground">Phone</label>
              <Icon
                v-if="isChanged('phone')"
                icon="heroicons:pencil-square-solid"
                class="size-3.5 text-amber-600 dark:text-amber-500"
              />
            </div>
            <input
              :value="editFormData.phone"
              type="tel"
              class="flex-1 rounded border px-2 py-1 text-sm dark:bg-slate-700 dark:text-slate-100"
              :class="[
                isChanged('phone') ? 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/20' : 'border-input',
              ]"
              @input="(e) => editFormData.phone = (e.target as HTMLInputElement).value"
            >
          </div>
          <div v-else class="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon icon="heroicons:phone" class="size-4" />
            {{ registration.phone }}
          </div>
        </div>
      </div>

      <Separator class="my-2" />

      <!-- Details Grid -->
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div
          v-for="item in displayData"
          :key="item.label"
          :class="{ 'rounded-md bg-amber-50 px-2 py-1 dark:bg-amber-950/20': isEditMode && isChanged(item.key) }"
        >
          <div class="flex items-center gap-2">
            <label class="text-sm font-medium text-muted-foreground">{{ item.label }}</label>
            <Icon
              v-if="isEditMode && isChanged(item.key)"
              icon="heroicons:pencil-square-solid"
              class="size-3.5 text-amber-600 dark:text-amber-500"
            />
          </div>
          <!-- Edit mode: Input fields -->
          <div v-if="isEditMode && item.editable" class="mt-1">
            <input
              :value="editFormData[item.key as keyof typeof editFormData] || ''"
              type="text"
              class="w-full rounded border px-2 py-1 text-sm dark:bg-slate-700 dark:text-slate-100"
              :class="[
                isChanged(item.key) ? 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/20' : 'border-input',
              ]"
              @input="(e) => editFormData[item.key as keyof typeof editFormData] = (e.target as HTMLInputElement).value"
            >
          </div>
          <!-- Read-only -->
          <p v-else class="text-sm font-medium">
            {{ item.value }}
          </p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div v-if="isEditMode && canEditRegistrations" class="flex gap-2 pt-4">
        <Button class="flex-1" :disabled="isSaving || !hasChanges" @click.stop="saveChanges">
          <Icon v-if="isSaving" icon="svg-spinners:ring-resize" class="mr-2 size-4" />
          {{ isSaving ? 'Saving...' : 'Save Changes' }}
        </Button>
        <Button
          class="flex-1"
          variant="outline"
          :disabled="isSaving"
          @click.stop="cancelEdit"
        >
          Cancel
        </Button>
      </div>
    </CardContent>
  </Card>
</template>
