<script setup lang="ts">
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { Button } from '@/components/ui/button';

useHead({
  title: 'Login',
  meta: [
    {
      name: 'description',
      content: 'Login to your Galanesia account',
    },
  ],
});

const config = useRuntimeConfig();

const loginWithOAuth = () => {
  const clientId = config.public.oauthClientId;
  const redirectUri = encodeURIComponent(config.public.oauthRedirectUri);
  return `${config.public.oauthUrl}/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}`;
};

const login = () => {
  window.location.href = loginWithOAuth();
};
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
        <Button @click="login">Login</Button>

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
      </div>
    </div>
  </div>
</template>
