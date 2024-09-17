<script setup lang="ts">
import { cn } from "@/lib/utils";
import { Icon } from "@iconify/vue";

const props = defineProps({
  src: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    default: 8,
  },
  online: {
    type: Number,
    default: 3,
  },
  right: {
    type: Number,
    default: 0.5,
  },
  wrapperClass: {
    type: String,
  },
  imgClass: {
    type: String,
    default: "w-full h-full",
  },
});

function modifyImgPath() {
  // If is dev environment, replace .test with .com
  if (import.meta.env.MODE === "development") {
    const modifiedPath = props.src.replace(".test", ".com");
    return modifiedPath;
  }
  return props.src;
}
</script>
<template>
  <Avatar :class="cn(wrapperClass, 'aspect-square shrink-0')" shape="eventLogo">
    <AvatarImage :src="modifyImgPath()" alt="title" />
    <AvatarFallback class="bg-muted h-full w-full p-1 flex items-center justify-center">
			<Icon icon="heroicons-solid:photograph" class="text-muted-foreground w-10 h-10" />
		</AvatarFallback>
  </Avatar>
</template>
