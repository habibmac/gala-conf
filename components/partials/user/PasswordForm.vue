<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { toTypedSchema } from '@vee-validate/zod';
import { useForm } from 'vee-validate';
import { z } from 'zod';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

defineProps<{
  loading?: boolean
  googleLinked?: boolean
}>();

const emit = defineEmits(['submit', 'link-google', 'unlink-google']);

const passwordFormSchema = toTypedSchema(z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string().min(1, 'Please confirm your password'),
}).refine(data => data.new_password === data.confirm_password, {
  message: 'Passwords don\'t match',
  path: ['confirm_password'],
}));

const { handleSubmit, resetForm } = useForm({
  validationSchema: passwordFormSchema,
  initialValues: {
    current_password: '',
    new_password: '',
    confirm_password: '',
  },
});

const onSubmit = handleSubmit((values) => {
  emit('submit', values);
});

defineExpose({ resetForm });
</script>

<template>
  <div class="space-y-6">
    <!-- Password Change Form -->
    <form class="space-y-4" @submit="onSubmit">
      <FormField v-slot="{ componentField }" name="current_password">
        <FormItem>
          <FormLabel>Current Password</FormLabel>
          <FormControl>
            <Input type="password" v-bind="componentField" placeholder="Enter current password" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="new_password">
        <FormItem>
          <FormLabel>New Password</FormLabel>
          <FormControl>
            <Input type="password" v-bind="componentField" placeholder="Enter new password" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="confirm_password">
        <FormItem>
          <FormLabel>Confirm Password</FormLabel>
          <FormControl>
            <Input type="password" v-bind="componentField" placeholder="Confirm new password" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <div class="flex justify-end">
        <Button type="submit" :disabled="loading">
          <Icon v-if="loading" icon="svg-spinners:ring-resize" class="mr-2 size-4" />
          <Icon v-else icon="tabler:lock-check" class="mr-2 size-4" />
          {{ loading ? 'Changing...' : 'Change Password' }}
        </Button>
      </div>
    </form>

    <Separator />

    <!-- Google Account Linking -->
    <div class="flex flex-col justify-between rounded-lg border p-4 sm:flex-row sm:items-center">
      <div class="mb-5 space-y-0.5">
        <Label class="text-base">Google Account</Label>
        <p class="text-sm text-muted-foreground">
          Link your Google account for easier sign-in
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Badge :variant="googleLinked ? 'default' : 'secondary'">
          {{ googleLinked ? 'Linked' : 'Not Linked' }}
        </Badge>
        <Button variant="outline" size="sm" @click="googleLinked ? $emit('unlink-google') : $emit('link-google')">
          <Icon v-if="!googleLinked" icon="logos:google-icon" class="mr-2 size-4" />
          {{ googleLinked ? 'Unlink' : 'Link Account' }}
        </Button>
      </div>
    </div>
  </div>
</template>
