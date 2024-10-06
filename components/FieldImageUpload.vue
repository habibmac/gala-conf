<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { useField } from "vee-validate";
import createVueFilePond from "vue-filepond";
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.min.css";
import "filepond-plugin-file-poster/dist/filepond-plugin-file-poster.min.css";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import FilePondPluginImageCrop from 'filepond-plugin-image-crop';
import FilePondPluginFileValidateSize from "filepond-plugin-file-validate-size";
import FilePondPluginFileValidateType from "filepond-plugin-file-validate-type";
import FilePondPluginFilePoster from "filepond-plugin-file-poster";
import { cn } from "~/lib/utils";

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
  type?: "logo" | "cover";
  isMultiple?: boolean;
}>();

const emit = defineEmits(["update:modelValue"]);

const {
  value: fieldValue,
  handleChange,
  resetField,
} = useField(props.name, undefined, {
  initialValue: props.modelValue,
});

const error = useFieldError(props.name);

const files = ref<any[]>([]);
const wrapperClass = computed(() => {
  return props.type === "logo" ? "w-60" : "w-full";
});
const subLabel = computed(() => {
  return props.type === "logo" ? "500x500" : '851x315';
});

const filePondOptions = computed(() => {
  const common = {
    allowMultiple: props.isMultiple || false,
    styleLoadIndicatorPosition: "center bottom",
    styleProgressIndicatorPosition: "right bottom",
    styleButtonRemoveItemPosition: "left bottom",
    styleButtonProcessItemPosition: "right bottom",
  };

  if (props.type === "logo") {
    return {
      ...common,
      stylePanelLayout: "compact",
      imagePreviewHeight: 200,
      imagePreviewWidth: 200,
      imageCropAspectRatio: "1:1",
      imageResizeTargetWidth: 500,
      imageResizeTargetHeight: 500,
    };
  } else {
    return {
      ...common,
      imagePreviewHeight: 200,
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
              poster: response.data.url
            }
          },
        },
      ];
    }
  } catch (error) {
    console.error("Error loading existing file:", error);
  }
};

const server = {
  process: (
    fieldName: string,
    file: any,
    metadata: any,
    load: (uniqueFileId: string) => void,
    error: (errorText: string) => void,
    progress: (
      isDone: boolean,
      bytesWritten: number,
      bytesTotal: number
    ) => void,
    abort: () => void
  ) => {
    const formData = new FormData();

    if (file instanceof File) {
      formData.append("image", file, file.name);
    } else if (file instanceof Blob) {
      formData.append(
        "image",
        new File([file], "image.jpg", { type: file.type })
      );
    } else {
      error("Invalid file object");
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;

    $galantisApi
      .post("/events/upload-logo", formData, {
        signal,
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent: any) => {
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
          emit("update:modelValue", response.data.id.toString());
          
          // Return the processed image URL
          return response.data.url;
        } else {
          error("Invalid response format");
        }
      })
      .catch((err) => {
        resetField();
        if (err.name === "CanceledError") {
          console.log("Request aborted");
        } else if (err.response && err.response.data) {
          error(err.response.data.message || "Error uploading file");
        } else {
          error("Error uploading file");
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

  revert: (
    uniqueFileId: string,
    load: () => void,
    error: (errorText: string) => void
  ) => {
    $galantisApi
      .delete(`/events/delete-image/${uniqueFileId}`)
      .then(() => {
        // Reset the model value when the file is removed
        resetField();
        emit("update:modelValue", "");
      })
      .catch((err) => {
        resetField();
        if (err.response && err.response.data) {
          error(err.response.data.message || "Error deleting file");
        } else {
          error("Error deleting file");
        }
      });
  },
};

const handleUpdateFiles = (fileItems: any[]) => {
  files.value = fileItems.map((fileItem) => fileItem.file);
};

onMounted(() => {
  if (fieldValue.value) {
    loadExistingFile(fieldValue.value);
  }
});

watch(fieldValue, (newValue) => {
  emit("update:modelValue", newValue);
});
</script>

<template>
  <FormField :name="name">
    <FormItem>
      <FormLabel :for="props.name">
        {{ label }}
      </FormLabel>
      <FormControl class="relative">
        <ClientOnly>
          <div :class="cn(
            wrapperClass, 'p-2.5 rounded-md bg-muted'
          )">
            <FilePond
              :name="props.name"
              :id="id"
              :value="fieldValue"
              :label-idle="`<div class='filepond--label-wrapper'>Drop your image here or <span class='filepond--label-action'>Browse</span></div><div class='filepond--label-info'>Dimension: <span>${subLabel}</span>, max size: <span>1 MB</span>.</div>`"
              :files="files"
              :accepted-file-types="['image/*']"
              :server="server"
              :max-file-size="'1MB'"
              @updatefiles="handleUpdateFiles"
              v-bind="filePondOptions"
              class="filepond-custom"
              :credits="[]"
            />
            
          </div>
        </ClientOnly>
      </FormControl>
      <Transition name="fade">
        <FormMessage v-if="error" />
      </Transition>
    </FormItem>
  </FormField>
</template>

<style lang="scss">
.filepond-custom {
  .filepond--root {
    @apply font-inter rounded-lg m-0 min-h-48;

    .filepond--drip {
      @apply bg-muted-foreground/20 border border-dashed border-muted-foreground opacity-50;
    }

    .filepond--drop-label {
      @apply h-full text-sm font-semibold text-muted-foreground;
    }

    .filepond--label-wrapper {
      @apply font-semibold text-base;
      .filepond--label-action {
        @apply text-primary no-underline;
      }
      .filepond--label-info{
        @apply text-muted-foreground text-xs;
      }
    }

    .filepond--image-preview-wrapper {
      @apply rounded-md overflow-hidden;
    }
  }
}
</style>
