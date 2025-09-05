<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { toTypedSchema } from '@vee-validate/zod';
import { useForm } from 'vee-validate';
import { toast } from 'vue-sonner';
import * as z from 'zod';

interface ResetPasswordResponse {
  message: string;
  user_id: number;
  tokens: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
  };
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
  };
}

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

definePageMeta({
  layout: 'default',
  title: 'Reset Password',
});

useHead({
  title: 'Reset Password',
});

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore(); // Add authStore

const resetKey = route.query.key as string;
const userLogin = route.query.login as string;

const resetSchema = toTypedSchema(z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
}).refine(data => data.password === data.confirm_password, {
  message: 'Passwords don\'t match',
  path: ['confirm_password'],
}));

const { handleSubmit } = useForm({
  validationSchema: resetSchema,
  initialValues: {
    password: '',
    confirm_password: '',
  },
});

const isSubmitting = ref(false);
const isShowPassword = ref(false);
const isShowConfirmPassword = ref(false);

// Check if we have required parameters
if (!resetKey || !userLogin) {
  throw createError({
    statusCode: 400,
    statusMessage: 'Invalid reset link. Please request a new password reset.',
  });
}

// Handle auto-login after password reset
const onSubmit = handleSubmit(async (values) => {
  if (isSubmitting.value)
    return;

  isSubmitting.value = true;

  try {
    // ✅ 1. Reset password and get tokens
    const response = await $fetch<ResetPasswordResponse>('/api/reset-password', {
      method: 'POST',
      body: {
        key: resetKey,
        login: userLogin,
        password: values.password,
      },
    });

    // ✅ 2. Set auth tokens from response
    authStore.setAuth(response.tokens.access_token, response.tokens.refresh_token);

    // ✅ 3. Fetch user profile with new tokens
    try {
      await authStore.fetchUserProfile();
    }
    catch (profileError) {
      console.warn('Could not fetch user profile:', profileError);
    }

    // ✅ 4. Show success toast
    toast.success(
      'Welcome back! 🎉',
      {
        description: 'Your account has been set up successfully',
      },
    );

    // ✅ 5. Redirect to dashboard
    await router.push('/my-events');
  }
  catch (error: any) {
    console.error('Password reset error:', error);

    let errorMessage = 'Password reset failed. Please try again or request a new reset link.';

    if (error.data?.message) {
      errorMessage = error.data.message;
    }
    else if (error.message) {
      errorMessage = error.message;
    }

    // ✅ Correct error toast syntax
    toast.error(
      'Setup Failed',
      {
        description: errorMessage,
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
    <!-- Back to login -->
    <NuxtLink
      to="/auth/login"
      class="absolute left-4 top-4 inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 md:left-8 md:top-8"
    >
      ← Back to Login
    </NuxtLink>

    <!-- Background -->
    <div class="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
      <div class="absolute inset-0 bg-gray-950">
        <img
          src="https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=4000&auto=format&fit=crop&ixlib=rb-4.0.3"
          alt="Reset password"
          class="absolute inset-0 size-full object-cover"
        >
      </div>
      <div class="relative z-20 flex items-center space-x-2 text-lg font-medium">
        <div class="flex size-8 items-center justify-center rounded-full bg-white/10">
          <Icon icon="solar:lock-keyhole-bold" class="size-5" />
        </div>
        <span>Secure Account Access</span>
      </div>
    </div>

    <!-- Reset form -->
    <div class="w-full lg:p-8">
      <div class="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
        <Card>
          <CardHeader class="space-y-1">
            <CardTitle class="text-center text-2xl">
              Set New Password
            </CardTitle>
            <CardDescription class="text-center">
              Enter your new password below for <strong>{{ userLogin }}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form class="space-y-4" @submit.prevent="onSubmit">
              <FormField v-slot="{ field }" name="password">
                <FormItem>
                  <FormLabel>New Password *</FormLabel>
                  <FormControl>
                    <div class="relative">
                      <Input
                        :type="isShowPassword ? 'text' : 'password'"
                        placeholder="••••••••"
                        v-bind="field"
                        :disabled="isSubmitting"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        class="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        @click="isShowPassword = !isShowPassword"
                      >
                        <Icon :icon="isShowPassword ? 'lucide:eye-off' : 'lucide:eye'" class="size-4" />
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>

              <FormField v-slot="{ field }" name="confirm_password">
                <FormItem>
                  <FormLabel>Confirm New Password *</FormLabel>
                  <FormControl>
                    <div class="relative">
                      <Input
                        :type="isShowConfirmPassword ? 'text' : 'password'"
                        placeholder="••••••••"
                        v-bind="field"
                        :disabled="isSubmitting"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        class="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        @click="isShowConfirmPassword = !isShowConfirmPassword"
                      >
                        <Icon :icon="isShowConfirmPassword ? 'lucide:eye-off' : 'lucide:eye'" class="size-4" />
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>

              <Button type="submit" class="w-full" :disabled="isSubmitting">
                <Icon v-if="isSubmitting" icon="lucide:loader-2" class="mr-2 size-4 animate-spin" />
                {{ isSubmitting ? 'Updating Password...' : 'Update Password' }}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
