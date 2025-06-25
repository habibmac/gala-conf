<script setup lang="ts">
import { Icon } from '@iconify/vue';

import { cn } from '~/lib/utils';

import IllustCircle from './svg/IllustCircleSvg.vue';

interface Image {
  src: string | object
  alt?: string
  class?: string
  loading?: 'lazy' | 'eager'
}

interface CtaButton {
  label?: string
  to?: string
  icon?: string
  iconClass?: string
  action?: () => void
}

interface Props {
  title?: string
  description?: string
  cta?: CtaButton
  cta2?: CtaButton
  icon?: string // Add this
  iconClass?: string
  img?: Image
}

const props = withDefaults(defineProps<Props>(), {
  cta: () => ({
    label: '',
  }),
  cta2: () => ({
    label: '',
  }),
  description: '',
  iconClass: '',
  img: () => ({
    alt: 'No data found',
    src: IllustCircle,
  }),
  title: 'No data found',
});

const emit = defineEmits<{
  (e: 'action', buttonType: 'primary' | 'secondary'): void
}>();

const handleClick = (button: CtaButton, buttonType: 'primary' | 'secondary') => {
  if (button.action) {
    button.action();
  }
  else {
    emit('action', buttonType);
  }
};

const hasActions = computed(() => Boolean(props.cta?.label || props.cta2?.label));
</script>

<template>
  <div class="m-auto my-4 max-w-2xl">
    <div class="px-4 text-center">
      <!-- Icon Section -->
      <div class="mb-4 inline-flex">
        <!-- Render icon if provided -->
        <div v-if="props.icon" class="mx-auto flex size-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
          <Icon :icon="props.icon" :class="cn('text-slate-400 dark:text-muted-foreground size-8', props.iconClass)" />
        </div>
        <!-- Render Vue component if src is an object/component -->
        <component
          :is="props.img.src"
          v-else-if="typeof props.img.src === 'object'"
          :class="cn('pointer-events-none select-none w-32', props.img.class)"
        />
        <!-- Render NuxtImg if src is a string -->
        <NuxtImg
          v-else
          :src="props.img.src"
          :alt="props.img.alt"
          :class="cn('pointer-events-none select-none w-32', props.img.class)"
        />
      </div>

      <!-- Content Section -->
      <h2 class="h4 mb-2 ">
        {{ title }}
      </h2>
      <p v-if="description" class="mb-5 text-sm text-muted-foreground">
        {{ description }}
      </p>

      <!-- Actions Section -->
      <div v-if="hasActions" class="mx-auto flex max-w-sm justify-center gap-2">
        <template v-if="cta?.label">
          <Button v-if="cta.to" as-child>
            <NuxtLink to="/new-event">
              <template v-if="cta.icon">
                <Icon :icon="cta.icon" :class="cn('mr-2', cta.iconClass)" />
              </template>
              {{ cta.label }}
            </NuxtLink>
          </Button>
          <Button v-else type="button" @click="() => handleClick(cta, 'primary')">
            <template v-if="cta.icon">
              <Icon :icon="cta.icon" :class="cn('mr-2', cta.iconClass)" />
            </template>
            {{ cta.label }}
          </Button>
        </template>

        <template v-if="cta2?.label">
          <Button v-if="cta2.to" as-child variant="outline">
            <NuxtLink to="/new-event">
              <template v-if="cta2.icon">
                <Icon :icon="cta2.icon" :class="cn('mr-2', cta2.iconClass)" />
              </template>
              {{ cta2.label }}
            </NuxtLink>
          </Button>
          <Button
            v-else
            variant="outline"
            type="button"
            @click="() => handleClick(cta2, 'secondary')"
          >
            <template v-if="cta2.icon">
              <Icon :icon="cta2.icon" :class="cn('mr-2', cta2.iconClass)" />
            </template>
            {{ cta2.label }}
          </Button>
        </template>
      </div>
    </div>
  </div>
</template>
