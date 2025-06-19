<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { toast } from 'vue-sonner';

import type { UserPreferences, UserProfileEdit } from '~/types';

import PasswordForm from '@/components/partials/user/PasswordForm.vue';
import PreferencesForm from '@/components/partials/user/PreferencesForm.vue';
import ProfileForm from '@/components/partials/user/ProfileForm.vue';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

definePageMeta({
  layout: 'dashboard',
  title: 'My Account',
  showInMenu: false,
  order: 1,
});

const { $galantisApi } = useNuxtApp();
const { user } = useUserProfile();
const authStore = useAuthStore();

// Loading states
const isLoading = ref(true);
const isSavingProfile = ref(false);
const isSavingPassword = ref(false);
const isSavingPreferences = ref(false);
const isUploadingAvatar = ref(false);
const googleLinked = ref(false);

// Form refs
const passwordFormRef = ref();

// User data
const userProfileRef = ref<UserProfileEdit>({
  first_name: '',
  last_name: '',
  avatar: '',
  user_email: '',
});

const preferences = ref<UserPreferences>({
  language: 'en',
  locale: 'id-ID',
  theme: 'system',
  timezone: 'Asia/Jakarta',
});

// Load user data function
const loadUserData = async () => {
  try {
    isLoading.value = true;

    if (user.value) {
      userProfileRef.value = {
        first_name: user.value.first_name || '',
        last_name: user.value.last_name || '',
        avatar: user.value.avatar || '',
        user_email: user.value.user_email || '',
      };
      googleLinked.value = user.value.google_linked || false;
    }

    // Load user preferences
    try {
      const preferencesResponse = await $galantisApi.get('/user/preferences');
      if (preferencesResponse.data.success) {
        preferences.value = preferencesResponse.data.data;
      }
    }
    catch (prefsError) {
      console.warn('Could not load preferences:', prefsError);
    }
  }
  catch (error) {
    console.error('Error loading user data:', error);
    toast.error('Failed to load account data', {
      description: 'Please try refreshing the page',
    });
  }
  finally {
    isLoading.value = false;
  }
};

// Form submission handlers
const handleProfileSubmit = async (values: UserProfileEdit) => {
  try {
    isSavingProfile.value = true;

    const response = await $galantisApi.post('/user/account/profile', values);

    if (response.data.success) {
      toast.success('Profile updated successfully', {
        description: 'Your profile information has been saved',
      });

      // Update local state
      Object.assign(userProfileRef.value, values);

      //  ✅ Use auth store to refresh user data globally
      await authStore.fetchUserProfile();
    }
    else {
      throw new Error(response.data.message || 'Failed to save profile');
    }
  }
  catch (error: any) {
    console.error('Error saving profile:', error);
    toast.error('Failed to update profile', {
      description: error?.response?.data?.message || 'Please check your information and try again',
    });
  }
  finally {
    isSavingProfile.value = false;
  }
};

const handlePasswordSubmit = async (values: { current_password: string, new_password: string }) => {
  try {
    isSavingPassword.value = true;

    const response = await $galantisApi.post('/user/account/change-password', {
      current_password: values.current_password,
      new_password: values.new_password,
    });

    if (response.data.success) {
      toast.success('Password changed successfully', {
        description: 'Your password has been updated',
      });

      // Reset form
      passwordFormRef.value?.resetForm();
    }
    else {
      throw new Error(response.data.message || 'Failed to change password');
    }
  }
  catch (error: any) {
    console.error('Error changing password:', error);
    toast.error('Failed to change password', {
      description: error?.response?.data?.message || 'Please check your current password and try again',
    });
  }
  finally {
    isSavingPassword.value = false;
  }
};

const handlePreferencesSubmit = async (values: UserPreferences) => {
  try {
    isSavingPreferences.value = true;

    const response = await $galantisApi.post('/user/preferences', values);

    if (response.data.success) {
      toast.success('Preferences saved successfully', {
        description: 'Your settings have been updated',
      });

      // Update local state
      preferences.value = {
        language: values.language || preferences.value.language,
        locale: values.locale || preferences.value.locale,
        theme: values.theme || preferences.value.theme,
        timezone: values.timezone || preferences.value.timezone,
      };
    }
    else {
      throw new Error(response.data.message || 'Failed to save preferences');
    }
  }
  catch (error: any) {
    console.error('Error saving preferences:', error);
    toast.error('Failed to save preferences', {
      description: error?.response?.data?.message || 'Please try again',
    });
  }
  finally {
    isSavingPreferences.value = false;
  }
};

// Avatar upload handler
const handleAvatarUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file)
    return;

  // File size validation (2MB) - this is redundant with backend but good for UX
  if (file.size > 2 * 1024 * 1024) {
    toast.error('File too large', {
      description: 'Please choose a file smaller than 2MB',
    });
    return;
  }

  try {
    isUploadingAvatar.value = true;

    const formData = new FormData();
    formData.append('avatar', file);

    const response = await $galantisApi.post('/user/account/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data.success) {
      toast.success('Avatar uploaded successfully');
      // Updated to use avatar_url instead of data.avatar_url
      userProfileRef.value.avatar = response.data.avatar_url;

      // ✅ Use auth store to refresh user data globally
      await authStore.fetchUserProfile();
    }
    else {
      throw new Error(response.data.message || 'Failed to upload avatar');
    }
  }
  catch (error: any) {
    console.error('Error uploading avatar:', error);
    toast.error('Failed to upload avatar', {
      description: error?.response?.data?.message || 'Please try again',
    });
  }
  finally {
    isUploadingAvatar.value = false;
    // Reset the file input
    if (target) {
      target.value = '';
    }
  }
};

// Google account handlers
const handleLinkGoogle = async () => {
  try {
    toast('Google linking coming soon', {
      description: 'This feature will be available soon',
    });
  }
  catch (error) {
    console.error('Error linking Google account:', error);
  }
};

const handleUnlinkGoogle = async () => {
  try {
    await $galantisApi.post('/auth/google/unlink');
    googleLinked.value = false;

    toast.success('Google account unlinked successfully', {
      description: 'Your Google account has been disconnected',
    });
  }
  catch (error) {
    console.error('Error unlinking Google account:', error);
    toast.error('Failed to unlink Google account', {
      description: 'Please try again',
    });
  }
};

// Initialize data on mount
onMounted(() => {
  loadUserData();
});
</script>

<template>
  <div class="container mx-auto max-w-4xl py-8 pb-20">
    <header class="mb-8">
      <h1 class="text-3xl font-bold tracking-tight">
        Account Settings
      </h1>
      <p class="text-muted-foreground">
        Manage your account preferences and security settings
      </p>
    </header>

    <!-- Loading State -->
    <div v-if="isLoading" class="space-y-6">
      <Card v-for="i in 3" :key="i">
        <CardHeader>
          <Skeleton class="h-6 w-1/3" />
          <Skeleton class="h-4 w-2/3" />
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <Skeleton class="h-10 w-full" />
            <Skeleton class="h-10 w-2/3" />
            <Skeleton class="h-10 w-1/2" />
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Main Content -->
    <div v-else class="grid gap-6">
      <!-- Profile Section -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Icon icon="heroicons:user" class="size-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Update your personal information and avatar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            :loading="isSavingProfile"
            :uploading-avatar="isUploadingAvatar"
            :initial-values="userProfileRef"
            @submit="handleProfileSubmit"
            @avatar-upload="handleAvatarUpload"
          />
        </CardContent>
      </Card>

      <!-- Security Section -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Icon icon="heroicons:lock-closed" class="size-5" />
            Security
          </CardTitle>
          <CardDescription>
            Manage your password and account security
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordForm
            ref="passwordFormRef"
            :loading="isSavingPassword"
            :google-linked="googleLinked"
            @submit="handlePasswordSubmit"
            @link-google="handleLinkGoogle"
            @unlink-google="handleUnlinkGoogle"
          />
        </CardContent>
      </Card>

      <!-- Preferences Section -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Icon icon="heroicons:cog-6-tooth" class="size-5" />
            Preferences
          </CardTitle>
          <CardDescription>
            Customize your app experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PreferencesForm
            :loading="isSavingPreferences"
            :initial-values="preferences"
            @submit="handlePreferencesSubmit"
          />
        </CardContent>
      </Card>
    </div>
  </div>
</template>
