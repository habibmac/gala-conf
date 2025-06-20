<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { toast } from 'vue-sonner';

import ModalConfirmation from '@/components/ModalConfirmation.vue';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface VisualSettings {
  bg_image?: string
  event_layout?: string
  bg_color?: string
  header_text_color?: boolean
  event_gallery?: Record<string, string>
  logo?: string
}

interface Props {
  eventData?: any
  isLoading?: boolean
}

withDefaults(defineProps<Props>(), {
  eventData: null,
  isLoading: false,
});

const emit = defineEmits<{
  save: [data: VisualSettings]
}>();

const { $galantisApi } = useNuxtApp();
const route = useRoute();
const { refetch } = useEvent();
const eventId = route.params.eventId as string;

// Visual settings form data
const visualSettings = ref<VisualSettings>({
  bg_image: '',
  event_layout: 'default',
  bg_color: '#ffffff',
  header_text_color: false,
  event_gallery: {},
  logo: '',
});

// Loading states
const isLoadingVisual = ref(true); // Start with true to avoid hydration mismatch
const isUploadingBg = ref(false);
const isUploadingGallery = ref(false);
const showDeleteDialog = ref(false);

// Gallery management
const bgImagePreview = ref<string>('');

// Layout options
const layoutOptions = [
  { value: 'default', label: 'Default Layout' },
  { value: 'top_slider', label: 'Top Slider' },
];

// Load visual settings
const loadVisualSettings = async () => {
  if (!eventId)
    return;

  try {
    isLoadingVisual.value = true;
    const response = await $galantisApi.get(`/event/${eventId}/visual`);

    if (response.data) {
      visualSettings.value = {
        bg_image: response.data.bg_image || '',
        event_layout: response.data.event_layout || 'default',
        bg_color: response.data.bg_color || '#ffffff',
        header_text_color: response.data.header_text_color || false,
        event_gallery: response.data.event_gallery || {}, // Changed from [] to {}
        logo: response.data.logo || '',
      };

      // Set background image preview
      if (response.data.bg_image)
        bgImagePreview.value = response.data.bg_image;
    }
  }
  catch (error) {
    const { errorMessage, errorDescription } = handleApiError(error, 'Failed to load visual settings');

    toast.error(errorMessage, {
      description: errorDescription,
    });
  }
  finally {
    isLoadingVisual.value = false;
  }
};

// Handle logo upload
const handleLogoUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file)
    return;
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await $galantisApi.post(`/event/${eventId}/upload-logo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    if (response.data?.url) {
      visualSettings.value.logo = response.data.url;
      toast.success('Logo uploaded successfully');

      // Refetch event
      await refetch();
    }
  }
  catch (error) {
    const { errorMessage, errorDescription } = handleApiError(error, 'Failed to upload logo');

    toast.error(errorMessage, {
      description: errorDescription,
    });
  }
  finally {
    isUploadingBg.value = false;
  }
};

// Remove logo
const removeLogo = async () => {
  showDeleteDialog.value = true;
};

const confirmRemoveLogo = async () => {
  try {
    const response = await $galantisApi.delete(`/event/${eventId}/logo`);
    if (response.data?.success) {
      visualSettings.value.logo = '';
      toast.success('Logo removed successfully');
      await refetch();
    }
    else {
      toast.error('Failed to remove logo');
    }
  }
  catch (error) {
    const { errorMessage, errorDescription } = handleApiError(error, 'Failed to delete session');

    toast.error(errorMessage, {
      description: errorDescription,
    });
  }
  finally {
    showDeleteDialog.value = false;
  }
};

// Handle background image upload
const handleBgImageUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file)
    return;

  try {
    isUploadingBg.value = true;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      bgImagePreview.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);

    // Upload to server
    const formData = new FormData();
    formData.append('file', file);

    const response = await $galantisApi.post(`/event/${eventId}/upload-cover`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    if (response.data?.url) {
      visualSettings.value.bg_image = response.data.url;
      toast.success('Background image uploaded successfully');
    }
  }
  catch (error) {
    const { errorMessage, errorDescription } = handleApiError(error, 'Failed to upload background image');

    toast.error(errorMessage, {
      description: errorDescription,
    });
  }
  finally {
    isUploadingBg.value = false;
  }
};

// Handle gallery image upload
const handleGalleryUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files || []);

  if (files.length === 0)
    return;

  try {
    isUploadingGallery.value = true;

    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);

      const response = await $galantisApi.post(`/event/${eventId}/upload-gallery`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Check for success in the response data
      if (response.data?.success && response.data?.image) {
        // Add to local state immediately as object
        if (!visualSettings.value.event_gallery) {
          visualSettings.value.event_gallery = {};
        }
        visualSettings.value.event_gallery[response.data.image.id] = response.data.image.url;
      }
      else {
        toast.error('Upload failed - invalid response');
        return;
      }
    }

    toast.success('Gallery images uploaded successfully');
  }
  catch (error) {
    const { errorMessage, errorDescription } = handleApiError(error, 'Failed to upload gallery images');

    toast.error(errorMessage, {
      description: errorDescription,
    });
  }
  finally {
    isUploadingGallery.value = false;
  }
};

// Remove gallery image
const removeGalleryImage = async (imageId: string) => {
  try {
    await $galantisApi.delete(`/event/${eventId}/gallery/${imageId}`);

    if (visualSettings.value.event_gallery) {
      delete visualSettings.value.event_gallery[imageId];
    }
    toast.success('Image removed successfully');
  }
  catch (error) {
    const { errorMessage, errorDescription } = handleApiError(error, 'Failed to remove image');
    toast.error(errorMessage, {
      description: errorDescription,
    });
  }
};

// Remove background image
const removeBgImage = () => {
  visualSettings.value.bg_image = '';
  bgImagePreview.value = '';
};

// Load settings on mount
onMounted(() => {
  loadVisualSettings();
});
</script>

<template>
  <div class="space-y-6">
    <ClientOnly>
      <!-- Loading State -->
      <div v-if="isLoading || isLoadingVisual" class="space-y-4">
        <Skeleton class="h-8 w-1/3 bg-muted-foreground/10" />
        <Skeleton class="h-6 w-1/4 bg-muted-foreground/10" />
        <Skeleton class="h-10 w-full bg-muted-foreground/10" />
      </div>
      <!-- Visual Settings Form -->
      <div v-else class="space-y-6">
        <!-- Event Logo -->
        <Card>
          <CardHeader>
            <CardTitle>Event Logo</CardTitle>
            <CardDescription>
              Upload a logo for your event
            </CardDescription>
          </CardHeader>
          <CardContent>
            <!-- Current Logo Image -->
            <div class="group relative size-48">
              <img
                v-if="visualSettings.logo"
                :src="visualSettings.logo"
                alt="Logo preview"
                class="aspect-square size-48 rounded-lg border object-cover"
              >
              <div
                v-else
                class="flex size-48 w-48 flex-col items-center justify-center rounded-lg border bg-muted-foreground/10"
              >
                <Icon icon="heroicons:photo" class="size-20 text-muted-foreground/20" />
                <span class="text-xs text-muted-foreground">No logo uploaded</span>
              </div>
              <Button
                v-if="visualSettings.logo"
                size="icon"
                variant="destructive"
                class="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
                @click="removeLogo"
              >
                <Icon icon="heroicons:x-mark" class="size-4" />
              </Button>
            </div>

            <div
              v-if="!visualSettings.logo"
              class="mt-5 rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 text-center"
            >
              <input
                id="bg-image-upload"
                type="file"
                accept="image/*"
                class="hidden"
                @change="handleLogoUpload"
              >
              <label for="bg-image-upload" class="cursor-pointer">
                <div class="space-y-2">
                  <Icon icon="heroicons:cloud-arrow-up" class="mx-auto size-12 text-muted-foreground" />
                  <div class="text-sm">
                    <span class="font-medium text-primary">Click to upload</span>
                    <span class="text-muted-foreground"> or drag and drop</span>
                  </div>
                  <p class="text-xs text-muted-foreground">
                    PNG, JPG up to 10MB (Recommended: 1080x1080px)
                  </p>
                </div>
              </label>
            </div>
          </CardContent>
        </Card>

        <!-- Event Layout -->
        <Card>
          <CardHeader>
            <CardTitle>Event Layout</CardTitle>
            <CardDescription>
              Choose the visual layout for your event page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div class="grid gap-4">
              <div class="grid gap-2">
                <Label for="event_layout">Layout Theme</Label>
                <Select v-model="visualSettings.event_layout">
                  <SelectTrigger>
                    <SelectValue placeholder="Select a layout theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="option in layoutOptions" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p class="text-sm text-muted-foreground">
                  The layout theme affects how your event page is displayed to attendees
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Background Settings -->
        <Card>
          <CardHeader>
            <CardTitle>Background Settings</CardTitle>
            <CardDescription>
              Customize the background appearance of your event page
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-6">
            <!-- Background Color -->
            <div class="grid gap-2">
              <Label for="bg_color">Background Color</Label>
              <div class="flex gap-2">
                <Input
                  id="bg_color"
                  v-model="visualSettings.bg_color"
                  type="color"
                  class="h-10 w-20 p-1"
                />
                <Input
                  v-model="visualSettings.bg_color"
                  type="text"
                  placeholder="#ffffff or rgba(255,255,255,0.8)"
                  class="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  :disabled="!visualSettings.bg_color"
                  title="Clear background color"
                  @click="visualSettings.bg_color = ''"
                >
                  <Icon icon="heroicons:x-mark" class="size-4" />
                </Button>
              </div>
              <p class="text-sm text-muted-foreground">
                Choose a background color for your event page (supports hex and rgba). Leave empty for transparent.
              </p>
            </div>

            <!-- Background Image -->
            <div class="grid gap-4">
              <Label>Background Image</Label>

              <!-- Current Background Image -->
              <div v-if="bgImagePreview" class="group relative">
                <img :src="bgImagePreview" alt="Background preview" class="aspect-[1920/1005] w-full rounded-lg border object-cover">
                <Button
                  size="icon"
                  variant="destructive"
                  class="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
                  @click="removeBgImage"
                >
                  <Icon icon="heroicons:x-mark" class="size-4" />
                </Button>
              </div>

              <!-- Upload Area -->
              <div v-else class="rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 text-center">
                <input
                  id="bg-image-upload"
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="handleBgImageUpload"
                >
                <label for="bg-image-upload" class="cursor-pointer">
                  <div class="space-y-2">
                    <Icon icon="heroicons:cloud-arrow-up" class="mx-auto size-12 text-muted-foreground" />
                    <div class="text-sm">
                      <span class="font-medium text-primary">Click to upload</span>
                      <span class="text-muted-foreground"> or drag and drop</span>
                    </div>
                    <p class="text-xs text-muted-foreground">
                      PNG, JPG, GIF up to 10MB (Recommended: 1920x1005px)
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Text Settings -->
        <Card>
          <CardHeader>
            <CardTitle>Text Settings</CardTitle>
            <CardDescription>
              Customize text appearance on your event page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div class="flex items-center space-x-2">
              <Switch id="header_text_color" v-model:checked="visualSettings.header_text_color" />
              <Label for="header_text_color">Use dark text for headers</Label>
            </div>
            <p class="mt-2 text-sm text-muted-foreground">
              Enable this if you're using a light background image (default is white text)
            </p>
          </CardContent>
        </Card>

        <!-- Event Gallery -->
        <Card>
          <CardHeader>
            <CardTitle>Event Gallery</CardTitle>
            <CardDescription>
              Upload images to showcase your event
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <!-- Gallery Images Grid -->
            <div
              v-if="visualSettings.event_gallery && Object.keys(visualSettings.event_gallery).length > 0"
              class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
            >
              <div v-for="(imageUrl, imageId) in visualSettings.event_gallery" :key="imageId" class="group relative">
                <img :src="imageUrl" alt="Gallery image" class="h-32 w-full rounded-lg border object-cover">
                <Button
                  size="icon"
                  variant="destructive"
                  class="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
                  @click="removeGalleryImage(String(imageId))"
                >
                  <Icon icon="heroicons:x-mark" class="size-4" />
                </Button>
              </div>
            </div>

            <!-- Upload Area -->
            <div class="rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 text-center">
              <input
                id="gallery-upload"
                type="file"
                accept="image/*"
                multiple
                class="hidden"
                @change="handleGalleryUpload"
              >
              <label for="gallery-upload" class="cursor-pointer">
                <div class="space-y-2">
                  <Icon icon="heroicons:photo" class="mx-auto size-12 text-muted-foreground" />
                  <div class="text-sm">
                    <span class="font-medium text-primary">Click to upload images</span>
                    <span class="text-muted-foreground"> or drag and drop</span>
                  </div>
                  <p class="text-xs text-muted-foreground">
                    PNG, JPG, GIF up to 5MB each. Multiple images supported.
                  </p>
                </div>
              </label>
            </div>

            <p class="text-sm text-muted-foreground">
              Gallery images will be displayed on your event page to help attendees visualize the event
            </p>
          </CardContent>
        </Card>

        <!-- Save Button -->
        <div class="flex justify-end">
          <Button
            :disabled="isUploadingBg || isUploadingGallery"
            class="min-w-[120px]"
            @click="emit('save', visualSettings)"
          >
            <Icon icon="tabler:check" class="mr-2 size-4" />
            {{ 'Save Changes' }}
          </Button>
        </div>
      </div>

      <template #fallback>
        <div class="space-y-4">
          <Skeleton class="h-8 w-1/3 bg-muted-foreground/10" />
          <Skeleton class="h-6 w-1/4 bg-muted-foreground/10" />
          <Skeleton class="h-10 w-full bg-muted-foreground/10" />
        </div>
      </template>

      <ModalConfirmation
        :open="showDeleteDialog"
        title="Delete Event Logo"
        confirm-text="Delete Logo"
        cancel-text="Keep Logo"
        variant="destructive"
        icon="heroicons:trash"
        @close="showDeleteDialog = false"
        @confirm="confirmRemoveLogo"
      >
        <div class="space-y-3">
          <p class="font-medium">
            This will permanently remove your event logo from:
          </p>
          <ul class="ml-4 space-y-1 text-sm">
            <li>• Event registration pages</li>
            <li>• Tickets and confirmation emails</li>
            <li>• Event listing and details</li>
            <li>• Printed materials and receipts</li>
          </ul>
          <p class="text-xs text-muted-foreground">
            You can upload a new logo anytime, but this action cannot be undone.
          </p>
        </div>
      </ModalConfirmation>
    </ClientOnly>
  </div>
</template>
