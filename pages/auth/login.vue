<script setup lang="ts">
import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'vee-validate';
import * as z from 'zod';
import { useToast } from '@/components/ui/toast/use-toast';

import packageJson from '../../package.json';

interface authResponse {
  access_token: string;
  refresh_token: string;
}

useHead({
  title: 'Login',
  meta: [{ name: 'description', content: 'Login to your Galanesia account' }],
});

const config = useRuntimeConfig();
const authStore = useAuthStore();
const router = useRouter();
const { toast } = useToast();

// Form validation schema
const formSchema = z.object({
  username: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

const { handleSubmit } = useForm({
  validationSchema: toTypedSchema(formSchema),
  initialValues: {
    username: '',
    password: '',
  },
});

const isSubmitting = ref(false);

// Password grant login
const onSubmit = handleSubmit(async (values) => {
  if (isSubmitting.value) return; // Prevent multiple submissions

  isSubmitting.value = true;
  try {
    const response: authResponse = await $fetch('/api/login', {
      method: 'POST',
      body: {
        username: values.username,
        password: values.password,
      },
    });

    authStore.setAuth(response.access_token, response.refresh_token);
    router.push('/my-events');
  } catch (error) {
    console.error(error);
    isSubmitting.value = false;
    toast({
      title: 'Error',
      description: 'Invalid credentials. Please try again.',
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
  if (isSubmitting.value) return; // Prevent multiple clicks

  isSubmitting.value = true;
  try {
    window.location.href = loginWithOAuth();
  } catch (error) {
    console.error(error);
    isSubmitting.value = false; // Reset loading only on error
    toast({
      title: 'Error',
      description: 'OAuth login failed. Please try again.',
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
          class="absolute object-cover h-full w-full inset-0"
        />
      </div>
      <div class="relative z-20 space-x-2 flex items-center text-lg font-medium">
        <Logo class="h-12 w-12 fill-white" />
        <span class="sr-only">Galanesia</span>
      </div>
    </div>
    <div class="lg:p-8">
      <div class="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div class="flex flex-col space-y-2 text-center">
          <h1 class="text-2xl font-semibold tracking-tight">Event Organizer's Dashboard</h1>
          <p class="text-sm text-muted-foreground">Sign in to continue</p>
        </div>

        <!-- Password Login Form -->
        <form class="space-y-4" @submit.prevent="onSubmit">
          <FormField v-slot="{ field }" :name="'username'">
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="name@example.com" v-bind="field" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField v-slot="{ field }" :name="'password'">
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Enter your password" v-bind="field" />
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
        <Button variant="outline" @click="handleOAuthLogin"> Continue with OAuth </Button>

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
