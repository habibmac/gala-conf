<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useField } from 'vee-validate';
import createVueFilePond from 'vue-filepond';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.min.css';
import 'filepond-plugin-file-poster/dist/filepond-plugin-file-poster.min.css';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import FilePondPluginImageCrop from 'filepond-plugin-image-crop';
import FilePondPluginFileValidateSize from 'filepond-plugin-file-validate-size';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import FilePondPluginFilePoster from 'filepond-plugin-file-poster';
import type { AxiosProgressEvent } from 'axios';
import { cn } from '~/lib/utils';

const FilePond = createVueFilePond(
  FilePondPluginImageCrop,
  FilePondPluginImagePreview,
  FilePondPluginFileValidateSize,
  FilePondPluginFileValidateType,
  FilePondPluginFilePoster
);

const props = defineProps<{
  name: string;
  modelValue?: string;
  label: string;
  id: string;
  type?: 'logo' | 'cover';
  isMultiple?: boolean;
}>();

const emit = defineEmits(['update:modelValue']);

const {
  value: fieldValue,
  handleChange,
  resetField,
} = useField(props.name, undefined, {
  initialValue: props.modelValue,
});

const error = useFieldError(props.name);

interface FilePondFile {
  source: string;
  options: {
    type: string;
    file: {
      name: string;
      size: number;
      type: string;
    };
    metadata: {
      poster: string;
    };
  };
}

const files = ref<FilePondFile[]>([]);
const uploadedFile = ref<string | null>(null);
const subLabel = computed(() => {
  return props.type === 'logo' ? '500x500' : '851x315';
});
const labelIdle = computed(() => {
  return `<div class='filepond--label-wrapper'>${props.label}</div><div class='filepond--label-info'>Dimension: <span>${subLabel.value}</span><br />Max size: <span>1 MB</span></div>`;
});

const filePondOptions = computed(() => {
  const common = {
    allowMultiple: props.isMultiple || false,
    styleLoadIndicatorPosition: 'center bottom',
    styleProgressIndicatorPosition: 'right bottom',
    styleButtonRemoveItemPosition: 'left bottom',
    styleButtonProcessItemPosition: 'right bottom',
  };

  if (props.type === 'logo') {
    return {
      ...common,
      stylePanelLayout: 'compact',
      imagePreviewHeight: 200,
      imagePreviewWidth: 200,
      imageCropAspectRatio: '1:1',
      imageResizeTargetWidth: 500,
      imageResizeTargetHeight: 500,
    };
  } else {
    return {
      ...common,
      imagePreviewHeight: 300,
      imageCropAspectRatio: '851:315',
      imageResizeTargetWidth: 851,
      imageResizeTargetHeight: 315,
    };
  }
});

const { $galantisApi } = useNuxtApp();

const loadExistingFile = async (fileId: string) => {
  try {
    const response = await $galantisApi.get(`/events/get-image`, {
      params: { id: parseInt(fileId), type: props.type },
    });
    if (response.data && response.data.url) {
      uploadedFile.value = response.data.url;
      files.value = [
        {
          source: fileId,
          options: {
            type: 'local',
            file: {
              name: response.data.name,
              size: response.data.size,
              type: response.data.type,
            },
            metadata: {
              poster: response.data.url,
            },
          },
        },
      ];
    }
  } catch (error) {
    console.error('Error loading existing file:', error);
  }
};

const server = {
  process: (
    fieldName: string,
    file: File | Blob,
    metadata: Record<string, unknown>,
    load: (uniqueFileId: string) => void,
    error: (errorText: string) => void,
    progress: (isDone: boolean, bytesWritten: number, bytesTotal: number) => void,
    abort: () => void
  ) => {
    const formData = new FormData();

    if (file instanceof File) {
      formData.append('image', file, file.name);
    } else if (file instanceof Blob) {
      formData.append('image', new File([file], 'image.jpg', { type: file.type }));
    } else {
      error('Invalid file object');
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;

    $galantisApi
      .post('/events/upload-logo', formData, {
        signal,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (progressEvent.total) {
            progress(false, progressEvent.loaded, progressEvent.total);
          }
        },
      })
      .then((response) => {
        if (response.data && response.data.url && response.data.id) {
          // Pass both the id and the processed image URL
          load(response.data.id.toString());
          handleChange(response.data.id.toString());
          emit('update:modelValue', response.data.id.toString());

          // Return the processed image URL
          return response.data.url;
        } else {
          error('Invalid response format');
        }
      })
      .catch((err) => {
        resetField();
        if (err.name === 'CanceledError') {
          console.log('Request aborted');
        } else if (err.response && err.response.data) {
          error(err.response.data.message || 'Error uploading file');
        } else {
          error('Error uploading file');
        }
      });

    return {
      abort: () => {
        controller.abort();
        abort();
        resetField();
      },
    };
  },

  revert: (uniqueFileId: string, load: () => void, error: (errorText: string) => void) => {
    $galantisApi
      .delete(`/events/delete-image/${uniqueFileId}`)
      .then(() => {
        // Reset the model value when the file is removed
        resetField();
        emit('update:modelValue', '');
      })
      .catch((err) => {
        resetField();
        if (err.response && err.response.data) {
          error(err.response.data.message || 'Error deleting file');
        } else {
          error('Error deleting file');
        }
      });
  },
};

const handleRemoveCover = () => {
  uploadedFile.value = null;
  files.value = [];
  resetField();
};

const handleUpdateFiles = (fileItems: FilePondFile[]) => {
  files.value = fileItems.map((fileItem) => fileItem);
};

onMounted(() => {
  if (fieldValue.value) {
    loadExistingFile(fieldValue.value);
  }
});

watch(fieldValue, (newValue) => {
  loadExistingFile(newValue);
  emit('update:modelValue', newValue);
});
</script>

<template>
  <FormField :name="name">
    <FormItem>
      <FormControl class="relative">
        <ClientOnly>
          <template v-if="props.type === 'logo'">
            <FilePond
              :id="id"
              :name="props.name"
              :value="fieldValue"
              :label-idle="labelIdle"
              :files="files"
              :accepted-file-types="['image/*']"
              :server="server"
              :max-file-size="'1MB'"
              v-bind="filePondOptions"
              :class="
                cn('filepond-custom', {
                  'filepond--logo': props.type === 'logo',
                  'has-error': error,
                })
              "
              :credits="[]"
              @updatefiles="handleUpdateFiles"
            />
          </template>
          <template v-else-if="props.type === 'cover'">
            <div
              :class="
                cn({
                  'pattern-bg inset-0 absolute dark:opacity-25': props.type === 'cover',
                })
              "
            />
            <div
              v-if="uploadedFile"
              class="absolute inset-0 flex h-full w-full items-center justify-center aspect-[851/315]"
            >
              <img :src="uploadedFile" alt="Cover image" class="object-cover w-full h-full pointer-events-none" />
              <Button variant="outline" class="absolute top-4 right-4" size="sm" @click.prevent="handleRemoveCover">
                Remove
              </Button>
            </div>
            <FilePond
              v-else
              :id="id"
              :name="props.name"
              :value="fieldValue"
              :label-idle="labelIdle"
              :files="files"
              :accepted-file-types="['image/*']"
              :server="server"
              :max-file-size="'1MB'"
              v-bind="filePondOptions"
              :class="
                cn('filepond-custom', {
                  'filepond--cover': props.type === 'cover',
                  'has-error': error,
                })
              "
              :credits="[]"
              @updatefiles="handleUpdateFiles"
            />
          </template>
        </ClientOnly>
      </FormControl>
      <Transition name="fade">
        <FormMessage v-if="error" />
      </Transition>
    </FormItem>
  </FormField>
</template>

<style lang="scss">
.pattern-bg {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23d8d8d8' fill-opacity='0.72'%3E%3Cpath opacity='.5' d='M96 95h4v1h-4v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9zm-1 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9z'/%3E%3Cpath d='M6 5V0H5v5H0v1h5v94h1V6h94V5H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}
.filepond-custom {
  &.has-error {
    .filepond--root {
      @apply border-destructive border;
    }
  }

  &.filepond--logo {
    @apply relative bg-background z-20 w-auto h-auto p-0 m-0 inline-flex shadow border-8 rounded-md border-background;
    .filepond--root {
      @apply w-60 h-60 m-0;
    }
  }

  &.filepond--cover {
    @apply min-h-80 h-80 p-4;
    .filepond--root {
      @apply w-full h-full m-0;
    }
  }

  .filepond--root {
    @apply font-inter rounded-lg opacity-100;

    .filepond--drip {
      @apply bg-muted-foreground border border-dashed border-muted-foreground;
    }

    .filepond--drop-label {
      @apply h-full text-sm;
      .filepond--label-wrapper {
        @apply font-semibold;
        .filepond--label-action {
          @apply text-primary no-underline;
        }
      }
      .filepond--label-info {
        @apply text-muted-foreground;
      }
    }

    .filepond--image-preview-wrapper {
      @apply h-full rounded-md overflow-hidden;
    }
  }
}
</style>
