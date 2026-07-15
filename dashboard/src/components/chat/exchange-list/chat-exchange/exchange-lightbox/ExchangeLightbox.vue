<script setup lang="ts">
import { computed } from 'vue';

import ExchangeLightboxFooter from './lightbox-footer/ExchangeLightboxFooter.vue';
import ExchangeLightboxHeader from './lightbox-header/ExchangeLightboxHeader.vue';
import ExchangeLightboxViewer from './lightbox-viewer/ExchangeLightboxViewer.vue';

const props = defineProps<{
  images: readonly {
    url: string;
    title?: string;
  }[];
  index: number;
  activeTitle?: string;
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'prev'): void;
  (e: 'next'): void;
  (e: 'selectIndex', index: number): void;
}>();

const hasPrev = computed(() => props.index > 0);
const hasNext = computed(() => props.index < props.images.length - 1);
const activeImage = computed(() => props.images[props.index]);
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="exchange-lightbox__backdrop"
      @click.self="emit('close')"
    >
      <div class="exchange-lightbox">
        <ExchangeLightboxHeader
          :active-title="activeTitle"
          @close="emit('close')"
        />

        <ExchangeLightboxViewer
          v-if="activeImage"
          :image-url="activeImage.url"
          :has-prev="hasPrev"
          :has-next="hasNext"
          @prev="emit('prev')"
          @next="emit('next')"
        />

        <ExchangeLightboxFooter
          :count="images.length"
          :active-index="index"
          @select-index="(i) => emit('selectIndex', i)"
        />
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.exchange-lightbox__backdrop {
  position: fixed;
  inset: 0;
  /* Above the floating video popouts (z-index 1000) and the lifted chat
     column (z-index 60) so the lightbox is never hidden behind a popout. */
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: color-mix(
    in srgb,
    var(--color-bg-primary) 65%,
    transparent
  );
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

/* Default: small / mobile screens — glass panel matching the popouts.
   The height is definite (not max-height) so the frame — header, viewer,
   footer, nav — never reflows between images of different sizes. */
.exchange-lightbox {
  display: flex;
  flex-direction: column;
  width: calc(100vw - var(--spacing-4));
  height: calc(100vh - var(--spacing-8));
  background: color-mix(in srgb, var(--color-bg-elevated) 55%, transparent);
  backdrop-filter: blur(16px) saturate(1.5);
  -webkit-backdrop-filter: blur(16px) saturate(1.5);
  border: 1px solid
    color-mix(in srgb, var(--color-accent-border) 45%, transparent);
  box-shadow:
    0 0.5rem 2rem color-mix(in srgb, black 45%, transparent),
    0 0 1.5rem color-mix(in srgb, var(--color-accent-glow) 25%, transparent),
    inset 0 0 0 1px color-mix(in srgb, white 6%, transparent);
  overflow: hidden;
  transition: border-color 0.2s ease;
}

.exchange-lightbox:hover {
  border-color: var(--color-accent-border);
}

/* Tablet and up: centered panel with breathing room */
@media (min-width: 640px) {
  .exchange-lightbox {
    width: min(90vw, 800px);
    height: min(85vh, 700px);
  }
}

/* Desktop and up: wide-viewer mode */
@media (min-width: 1024px) {
  .exchange-lightbox {
    width: min(60vw, 1100px);
    height: min(75vh, 750px);
  }
}
</style>
