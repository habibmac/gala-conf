<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { toTypedSchema } from '@vee-validate/zod';
import { useForm } from 'vee-validate';
import { toast } from 'vue-sonner';
import * as z from 'zod';

import type { RegistrationResponse } from '~/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

definePageMeta({
  layout: 'default',
  title: 'Register - Event Management System',
});

useHead({
  meta: [{ content: 'Create your event organizer account', name: 'description' }],
  title: 'Register',
});

const router = useRouter();
const authStore = useAuthStore();

// Form validation schema
const registrationSchema = toTypedSchema(z.object({
  first_name: z.string().min(1, 'First name is required').min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(1, 'Last name is required').min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(8, 'Phone number is required').optional(),
  organization: z.string().optional(),
}));

const { handleSubmit } = useForm({
  validationSchema: registrationSchema,
  initialValues: {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    organization: '',
  },
});

const isSubmitting = ref(false);
const selectedRole = ref<keyof typeof roleDescriptions>('ee_event_organizer');

// Role descriptions (same as before)
const roleDescriptions = {
  ee_event_organizer: {
    title: 'Event Organizer',
    description: 'Create and manage events, handle registrations, and access advanced event management features.',
    color: 'bg-blue-50 border-blue-200 text-blue-800',
  },
  ee_event_operator: {
    title: 'Event Operator',
    description: 'Assist with event operations, manage registrations, and support event organizers.',
    color: 'bg-green-50 border-green-200 text-green-800',
  },
  subscriber: {
    title: 'Subscriber',
    description: 'Basic account for event attendance and registration purposes.',
    color: 'bg-gray-50 border-gray-200 text-gray-800',
  },
};

const onSubmit = handleSubmit(async (values) => {
  if (isSubmitting.value)
    return;

  isSubmitting.value = true;

  try {
    // ✅ Call Nuxt API middleware instead of direct WordPress API
    const response = await $fetch<RegistrationResponse>('/api/register', {
      method: 'POST',
      body: {
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        phone: values.phone || '',
        organization: values.organization || '',
      },
    });

    // Handle response (same as before)
    if (response.requires_login || response.email_sent) {
      toast(
        'Please check your email! 📧',
        {
          description: 'We\'ve sent you an email with instructions to set your password.',
          duration: 20000,
        },
      );

      await router.push('/auth/login?registered=true');
    }
  }
  catch (error: any) {
    // ✅ Consistent error handling
    toast.error(
      'Oops! Something went wrong 😱',
      {
        description: error.data?.message || 'Registration failed. Please try again.',
      },
    );
  }
  finally {
    isSubmitting.value = false;
  }
});

// Check if user is already authenticated and redirect
onMounted(() => {
  if (authStore.isAuthenticated) {
    router.replace('/my-events');
  }
});
</script>

<template>
  <div
    class="container relative flex min-h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0"
  >
    <!-- Back to login link -->
    <NuxtLink
      to="/auth/login"
      class="absolute left-4 top-4 inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 md:left-8 md:top-8"
    >
      ← Back to Login
    </NuxtLink>

    <!-- Background image section -->
    <div class="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
      <div class="absolute inset-0 bg-slate-100 dark:bg-gray-950">
        <img
          src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=4000&auto=format&fit=crop&ixlib=rb-4.0.3"
          alt="Event management"
          class="absolute inset-0 size-full object-cover"
        >
      </div>
      <div class="relative z-20 flex items-center space-x-2 text-lg font-medium">
        <NuxtLink to="/">
          <Logo class="size-12 fill-white" />
        </NuxtLink>
        <span>Event Management Platform</span>
      </div>
      <div class="relative z-20 mt-auto">
        <blockquote class="space-y-2">
          <p class="text-lg">
            "This platform has revolutionized how we manage our events. The registration process is seamless and the
            analytics are incredibly valuable."
          </p>
          <footer class="text-sm">
            Sofia Chen, Event Director
          </footer>
        </blockquote>
      </div>
    </div>

    <!-- Registration form section -->
    <div class="w-full lg:p-8">
      <div class="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[480px]">
        <Card>
          <CardHeader class="space-y-1">
            <CardTitle class="text-center text-2xl">
              Create an account
            </CardTitle>
            <CardDescription class="text-center">
              Enter your information to create your event organizer account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form class="space-y-4" @submit.prevent="onSubmit">
              <!-- Personal Information -->
              <div class="grid grid-cols-2 gap-4">
                <FormField v-slot="{ field }" name="first_name">
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="John"
                        v-bind="field"
                        :disabled="isSubmitting"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>

                <FormField v-slot="{ field }" name="last_name">
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Doe"
                        v-bind="field"
                        :disabled="isSubmitting"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
              </div>

              <!-- Email -->
              <FormField v-slot="{ field }" name="email">
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      v-bind="field"
                      :disabled="isSubmitting"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>

              <!-- Role Description -->
              <div :class="`p-3 rounded-lg border ${roleDescriptions[selectedRole].color}`">
                <div class="mb-1 flex items-center gap-2">
                  <Icon icon="solar:info-circle-bold" class="size-4" />
                  <span class="text-sm font-medium">{{ roleDescriptions[selectedRole].title }}</span>
                </div>
                <p class="text-xs">
                  {{ roleDescriptions[selectedRole].description }}
                </p>
              </div>

              <!-- Optional Information -->
              <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField v-slot="{ field }" name="phone">
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        v-bind="field"
                        :disabled="isSubmitting"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>

                <FormField v-slot="{ field }" name="organization">
                  <FormItem>
                    <FormLabel>Organization</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Company or Organization"
                        v-bind="field"
                        :disabled="isSubmitting"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
              </div>

              <!-- Submit Button -->
              <Button
                type="submit"
                class="w-full"
                size="lg"
                :disabled="isSubmitting"
              >
                <Icon v-if="isSubmitting" icon="lucide:loader-2" class="mr-2 size-4 animate-spin" />
                {{ isSubmitting ? 'Creating Account...' : 'Create Account' }}
              </Button>
            </form>

            <!-- Login link -->
            <div class="mt-6 text-center text-sm">
              Already have an account?
              <NuxtLink to="/auth/login" class="underline underline-offset-4 hover:text-primary">
                Sign in here
              </NuxtLink>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
