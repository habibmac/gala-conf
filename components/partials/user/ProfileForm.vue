<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { toTypedSchema } from '@vee-validate/zod';
import { useForm } from 'vee-validate';
import { z } from 'zod';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

const props = defineProps<{
  loading?: boolean
  uploadingAvatar?: boolean
  initialValues?: {
    first_name?: string
    last_name?: string
    avatar?: string
    user_email?: string
  }
}>();
const emit = defineEmits(['submit', 'avatar-upload']);
const avatarInput = ref<HTMLInputElement>();

const profileFormSchema = toTypedSchema(z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
}));

const { handleSubmit } = useForm({
  validationSchema: profileFormSchema,
  initialValues: {
    first_name: props.initialValues?.first_name || '',
    last_name: props.initialValues?.last_name || '',
  },
});

const onSubmit = handleSubmit((values) => {
  emit('submit', values);
});

const handleAvatarChange = (event: Event) => {
  emit('avatar-upload', event);
};

const getUserInitials = computed(() => {
  const firstName = props.initialValues?.first_name || '';
  const lastName = props.initialValues?.last_name || '';
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
});
</script>

<template>
  <div class="space-y-6">
    <!-- Avatar Section -->
    <div class="flex items-center gap-4">
      <Avatar class="size-20">
        <AvatarImage v-if="initialValues?.avatar" :src="initialValues?.avatar" />
        <AvatarFallback class="text-lg">
          {{ getUserInitials }}
        </AvatarFallback>
      </Avatar>
      <div class="space-y-2">
        <div>
          <Button
            variant="outline"
            size="sm"
            :disabled="uploadingAvatar"
            @click="avatarInput?.click()"
          >
            <Icon v-if="uploadingAvatar" icon="heroicons:arrow-path" class="mr-2 size-4 animate-spin" />
            {{ uploadingAvatar ? 'Uploading...' : 'Change Avatar' }}
          </Button>
          <input
            ref="avatarInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleAvatarChange"
          >
        </div>
        <p class="text-sm text-muted-foreground">
          JPG, PNG up to 2MB
        </p>
      </div>
    </div>

    <Separator />

    <!-- Profile Form -->
    <form class="space-y-4" @submit="onSubmit">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField v-slot="{ componentField }" name="first_name">
          <FormItem>
            <FormLabel>First Name</FormLabel>
            <FormControl>
              <Input v-bind="componentField" placeholder="Enter your first name" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="last_name">
          <FormItem>
            <FormLabel>Last Name</FormLabel>
            <FormControl>
              <Input v-bind="componentField" placeholder="Enter your last name" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
      </div>

      <div class="rounded-lg border bg-muted/50 p-4">
        <Label class="text-sm font-medium">Email Address</Label>
        <p class="mt-1 text-sm text-muted-foreground">
          {{ initialValues?.user_email || 'No email' }}
        </p>
      </div>

      <div class="flex justify-end">
        <Button type="submit" :disabled="loading">
          <Icon v-if="loading" icon="svg-spinners:ring-resize" class="mr-2 size-4" />
          <Icon v-else icon="tabler:check" class="mr-2 size-4" />
          {{ loading ? 'Saving...' : 'Save Profile' }}
        </Button>
      </div>
    </form>
  </div>
</template>
