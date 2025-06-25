<script setup lang="ts">
import { useForm } from 'vee-validate';
import * as z from 'zod';

import { Button, buttonVariants } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast/use-toast';
import { cn } from '@/lib/utils';

import packageJson from '../../package.json';

interface authResponse {
  access_token: string
  refresh_token: string
}

useHead({
  meta: [{ content: 'Login to your Galanesia account', name: 'description' }],
  title: 'Login',
});

const config = useRuntimeConfig();
const authStore = useAuthStore();
const router = useRouter();
const { toast } = useToast();

// Form validation schema
const formSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  username: z.string().email('Please enter a valid email'),
});

const { handleSubmit } = useForm({
  initialValues: {
    password: '',
    username: '',
  },
  validationSchema: toTypedSchema(formSchema),
});

const isShowPassword = ref(false);
const isSubmitting = ref(false);

// Password grant login
const onSubmit = handleSubmit(async (values) => {
  if (isSubmitting.value)
    return; // Prevent multiple submissions

  isSubmitting.value = true;
  try {
    const response: authResponse = await $fetch<authResponse>('/api/login', {
      body: {
        password: values.password,
        username: values.username,
      } as { password: string, username: string },
      method: 'POST',
    });

    authStore.setAuth(response.access_token, response.refresh_token);
    router.push('/my-events');
  }
  catch (error) {
    console.error(error);
    isSubmitting.value = false;
    toast({
      description: 'Invalid credentials. Please try again.',
      title: 'Error',
      variant: 'destructive',
    });
  }
});

// OAuth authorization code login
const loginWithOAuth = () => {
  const clientId = config.public.oauthClientId;
  const redirectUri = encodeURIComponent(config.public.oauthRedirectUri);
  return `${config.public.oauthUrl}/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}`;
};

const handleOAuthLogin = () => {
  if (isSubmitting.value)
    return; // Prevent multiple clicks

  isSubmitting.value = true;
  try {
    window.location.href = loginWithOAuth();
  }
  catch (error) {
    console.error(error);
    isSubmitting.value = false; // Reset loading only on error
    toast({
      description: 'OAuth login failed. Please try again.',
      title: 'Error',
      variant: 'destructive',
    });
  }
};

const $version = packageJson.version;

// Redirect if already authenticated
onMounted(() => {
  if (authStore.isAuthenticated) {
    router.replace('/my-events');
  }
});
</script>

<template>
  <div
    class="container relative flex flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0"
  >
    <a
      href="https://galanesia.com/auth/register"
      :class="cn(buttonVariants({ variant: 'ghost' }), 'absolute right-4 top-4 md:right-8 md:top-8')"
    >
      Register
    </a>
    <div class="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
      <div class="absolute inset-0 bg-gray-950">
        <img
          src="https://images.unsplash.com/photo-1502691876148-a84978e59af8?q=80&w=4000&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt=""
          class="absolute inset-0 size-full object-cover"
        >
      </div>
      <div class="relative z-20 flex items-center space-x-2 text-lg font-medium">
        <Logo class="size-12 fill-white" />
        <span class="sr-only">Galanesia</span>
      </div>
    </div>
    <div class="lg:p-8">
      <div class="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div class="flex flex-col space-y-2 text-center">
          <img
            src="https://galanesia.com/cdn/logo/galanesia-app-icon.svg"
            alt="Galanesia Logo"
            class="mx-auto size-12"
          >
          <h1 class="mx-auto max-w-60 text-2xl font-semibold tracking-tight md:max-w-none">
            Event Organizer's Dashboard
          </h1>
          <p class="text-sm text-muted-foreground">
            Sign in to continue
          </p>
        </div>

        <!-- Password Login Form -->
        <form class="space-y-4" @submit.prevent="onSubmit">
          <FormField v-slot="{ field }" name="username">
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="name@example.com" v-bind="field" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField v-slot="{ field }" name="password">
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <div class="relative">
                  <Input
                    :type="isShowPassword ? 'text' : 'password'"
                    placeholder="Enter your password"
                    v-bind="field"
                  />
                  <ShowPasswordToggle
                    class="absolute right-2 top-1/2 -translate-y-1/2"
                    :model-value="isShowPassword"
                    @update:model-value="isShowPassword = $event"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <Button type="submit" class="w-full py-6" :disabled="isSubmitting">
            <SpinnerDots v-if="isSubmitting" class="mr-2 size-5" />
            {{ isSubmitting ? 'Logging in...' : 'Log in with Password' }}
          </Button>
        </form>

        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <span class="w-full border-t" />
          </div>
          <div class="relative flex justify-center text-xs uppercase">
            <span class="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        <!-- OAuth Login Button -->
        <Button variant="outline" @click="handleOAuthLogin">
          Continue with OAuth
        </Button>

        <p class="px-8 text-center text-sm text-muted-foreground">
          By signing in, you agree to our
          <a href="https://galanesia.com/terms" class="underline underline-offset-4 hover:text-primary">
            Terms of Service
          </a>
          and
          <a href="https://galanesia.com/privacy" class="underline underline-offset-4 hover:text-primary">
            Privacy Policy
          </a>
          .
        </p>

        <p class="text-center">
          <span class="text-xs text-muted-foreground">Version: {{ $version }}</span>
        </p>
      </div>
    </div>
  </div>
</template>
