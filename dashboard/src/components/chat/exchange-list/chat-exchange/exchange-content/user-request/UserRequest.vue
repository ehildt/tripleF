<script setup lang="ts">
import type { LightboxImage } from '@/components/shared/ui/lightbox/composables/use-lightbox';

import Tooltip from '../../../../../shared/ui/tooltip/Tooltip.vue';

defineProps<{
  content: string;
  images?: LightboxImage[];
}>();

const emit = defineEmits<{
  (e: 'imageClicked', images: LightboxImage[], clickedUrl: string): void;
}>();
</script>

<template>
  <div class="user-request">
    <div v-if="images?.length" class="user-request__images">
      <Tooltip
        v-for="image in images"
        :key="image.url"
        :text="image.title ?? ''"
      >
        <img
          :src="image.url"
          :alt="image.title ?? 'Uploaded image'"
          class="user-request__image"
          loading="lazy"
          decoding="async"
          @click="emit('imageClicked', images, image.url)"
        />
      </Tooltip>
    </div>
    <div class="user-request__body">{{ content }}</div>
  </div>
</template>

<style scoped>
.user-request {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--spacing-2);
  width: 100%;
}

.user-request__images {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--spacing-2);
  margin-top: var(--spacing-1);
}

.user-request__image {
  width: 2rem;
  height: 2rem;
  object-fit: cover;
  display: block;
  border: 1px solid var(--color-divider);
  cursor: pointer;
}

.user-request__body {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
  align-items: flex-start;
  max-width: 100%;
  min-width: 0;
  overflow-x: hidden;
  white-space: pre-line;
  text-align: right;
  padding: var(--spacing-2) var(--spacing-3);
  background: color-mix(in srgb, var(--color-accent-primary) 10%, transparent);
}

.user-request__body :deep(> *) {
  flex: 1 1 100%;
  margin-top: 0;
  margin-bottom: 0;
  min-width: 0;
  max-width: 100%;
}
</style>
