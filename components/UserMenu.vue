<script setup lang="ts">
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

const { user } = useUserProfile()
const router = useRouter();

const getUserInitials = () => {
  if (!user) return "";

  return user.value?.display_name
    .split(" ")
    .map((name) => name[0])
    .join("");
};

const loggingOut = () => {
  router.push('/auth/logout');
};
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" class="relative h-8 w-8 rounded-full">
        <Avatar class="h-8 w-8" v-if="user">
          <AvatarImage :src="user.avatar" alt="@radix-vue" />
          <AvatarFallback>{{ getUserInitials() }}</AvatarFallback>
        </Avatar>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent class="w-56" align="end" v-if="user">
      <DropdownMenuLabel class="font-normal flex">
        <div class="flex flex-col space-y-1">
          <p class="text-sm font-medium leading-none">
            {{ user.display_name }}
          </p>
          <p class="text-xs leading-none text-muted-foreground">
            {{ user.user_roles.join(", ") }}
          </p>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <template v-if="user.user_roles.includes('administrator')">
        <DropdownMenuGroup>
          <DropdownMenuItem as-child>
            <NuxtLink to="/" class="text-red-500"> 🚨 Backend </NuxtLink>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
      </template>

      <DropdownMenuGroup>
        <DropdownMenuItem as-child>
          <NuxtLink to="/my-events" class="block"> Events </NuxtLink>
        </DropdownMenuItem>
        <DropdownMenuItem> Settings </DropdownMenuItem>
        <DropdownMenuItem>New Team</DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem @click="loggingOut()"> Log out </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
