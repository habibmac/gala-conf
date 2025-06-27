<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod';
import { useForm } from 'vee-validate';
import { toast } from 'vue-sonner';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

definePageMeta({
  layout: 'default',
  title: 'Forgot Password - Event Management System',
});

useHead({
  meta: [{ content: 'Reset your password for Event Management System', name: 'description' }],
  title: 'Forgot Password',
});

const router = useRouter();
const authStore = useAuthStore();

// Form validation schema
const forgotPasswordSchema = toTypedSchema(z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
}));

const { handleSubmit } = useForm({
  validationSchema: forgotPasswordSchema,
  initialValues: {
    email: '',
  },
});

const isSubmitting = ref(false);
const isEmailSent = ref(false);

const onSubmit = handleSubmit(async (values) => {
  if (isSubmitting.value)
    return;

  isSubmitting.value = true;

  try {
    await $fetch('/api/forgot-password', {
      method: 'POST',
      body: {
        email: values.email,
      },
    });

    isEmailSent.value = true;

    toast.success(
      'Password reset email sent! 📧',
      {
        description: 'Check your email for instructions to reset your password.',
        duration: 10000,
      },
    );
  }
  catch (error: any) {
    console.error('Forgot password error:', error);

    toast.error(
      'Something went wrong 😞',
      {
        description: error.data?.message || 'Failed to send password reset email. Please try again.',
      },
    );
  }
  finally {
    isSubmitting.value = false;
  }
});

// Redirect if already authenticated
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
      <div class="absolute inset-0 bg-gray-950">
        <img
          src="https://images.unsplash.com/photo-1502691876148-a84978e59af8?q=80&w=4000&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Event management background"
          class="absolute inset-0 size-full object-cover"
        >
      </div>
      <div class="relative z-20 flex items-center space-x-2 text-lg font-medium">
        <Logo class="size-12 fill-white" />
        <span class="sr-only">Galanesia</span>
      </div>
      <div class="relative z-20 mt-auto">
        <blockquote class="space-y-2">
          <p class="text-lg">
            "Don't worry, it happens to the best of us. Let's get you back into your account quickly and securely."
          </p>
          <footer class="text-sm">
            Password Recovery Team
          </footer>
        </blockquote>
      </div>
    </div>

    <!-- Forgot password form section -->
    <div class="lg:p-8">
      <div class="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div class="flex flex-col space-y-2 text-center">
          <img src="https://galanesia.com/cdn/logo/galanesia-app-icon.svg" alt="Galanesia Logo" class="mx-auto size-12">
          <h1 class="text-2xl font-semibold tracking-tight">
            Forgot your password?
          </h1>
          <p class="text-sm text-muted-foreground">
            {{ isEmailSent ? 'Check your email for reset instructions' : 'Enter your email address and we\'ll send you a link to reset your password' }}
          </p>
        </div>

        <div v-if="isEmailSent" class="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
          <div class="flex items-center space-x-2">
            <svg class="size-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <div>
              <h3 class="text-sm font-medium text-green-600 dark:text-green-400">
                Email sent successfully!
              </h3>
              <p class="mt-1 text-sm text-green-700 dark:text-green-300">
                We've sent a password reset link to your email address. Please check your inbox and follow the instructions.
              </p>
            </div>
          </div>
        </div>

        <!-- Forgot Password Form -->
        <form v-if="!isEmailSent" class="space-y-4" @submit.prevent="onSubmit">
          <FormField v-slot="{ field }" name="email">
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input
                  v-bind="field"
                  type="email"
                  placeholder="Enter your email address"
                  :disabled="isSubmitting"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <Button
            type="submit"
            size="lg"
            class="w-full"
            :disabled="isSubmitting"
          >
            <SpinnerDots v-if="isSubmitting" class="mr-2 size-5" />
            {{ isSubmitting ? 'Sending...' : 'Send Reset Link' }}
          </Button>
        </form>

        <!-- Success state actions -->
        <div v-if="isEmailSent" class="space-y-4">
          <Button
            variant="outline"
            size="lg"
            class="w-full"
            @click="isEmailSent = false"
          >
            Send Another Email
          </Button>

          <Button
            variant="default"
            size="lg"
            class="w-full"
            @click="router.push('/auth/login')"
          >
            Back to Login
          </Button>
        </div>

        <!-- Additional links -->
        <div v-if="!isEmailSent" class="space-y-4">
          <Separator class="my-4" />
          <Button
            variant="outline"
            size="lg"
            class="w-full"
            @click="router.push('/auth/login')"
          >
            Back to Login
          </Button>
        </div>

        <!-- Help text -->
        <div class="text-center">
          <p class="text-xs text-muted-foreground">
            Need help? Contact our support team at
            <a href="mailto:support@galanesia.com" class="underline underline-offset-4 hover:text-primary">
              support@galanesia.com
            </a>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
