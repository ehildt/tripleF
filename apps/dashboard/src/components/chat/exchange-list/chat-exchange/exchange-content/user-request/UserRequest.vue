<script setup lang="ts">
import { FileText } from '@lucide/vue';
import { computed } from 'vue';

import type { LightboxImage } from '@/types/lightbox.model';
import { renderMarkdown } from '@/utils/render-markdown.helper';

import Tooltip from '../../../../../shared/ui/tooltip/Tooltip.vue';

const props = defineProps<{
  content: string;
  images?: LightboxImage[];
  documents?: { name: string; url: string }[];
}>();

const emit = defineEmits<{
  (e: 'imageClicked', images: LightboxImage[], clickedUrl: string): void;
  (e: 'documentClicked', document: { name: string; url: string }): void;
}>();

const renderedHtml = computed(() => renderMarkdown(props.content));
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
          :alt="image.title ?? $t('common.uploadedImage')"
          class="user-request__image"
          loading="lazy"
          decoding="async"
          @click="emit('imageClicked', images, image.url)"
        />
      </Tooltip>
    </div>
    <div v-if="documents?.length" class="user-request__images">
      <Tooltip
        v-for="document in documents"
        :key="document.url"
        :text="document.name"
      >
        <button
          type="button"
          class="user-request__document"
          :aria-label="$t('common.documentFile')"
          @click="emit('documentClicked', document)"
        >
          <FileText class="user-request__document-icon" />
        </button>
      </Tooltip>
    </div>
    <!-- eslint-disable vue/no-v-html -- HTML is rendered by markdown-it and sanitized by DOMPurify -->
    <div class="user-request__body" v-html="renderedHtml" />
    <!-- eslint-enable vue/no-v-html -->
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

.user-request__document {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-divider);
  background-color: color-mix(
    in srgb,
    var(--color-accent-primary) 8%,
    transparent
  );
  cursor: pointer;
  transition:
    color 0.2s ease,
    border-color 0.2s ease;
}

.user-request__document:hover {
  border-color: var(--color-accent-primary);
}

.user-request__document-icon {
  width: 1rem;
  height: 1rem;
  color: var(--color-fg-muted);
}

.user-request__body {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
  align-items: flex-start;
  max-width: 100%;
  min-width: 0;
  overflow-x: hidden;
  /* Line breaks come from markdown-it (breaks: true); long unbroken tokens
     (auto-linked URLs) wrap instead of opening a scrollbar. */
  overflow-wrap: anywhere;
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

/* Inline code (backticks) and fenced command blocks. Monospace comes from
   the global code rule; the chip background makes commands stand out. */
.user-request__body :deep(code) {
  font-size: 0.9em;
  padding: 0.1em 0.3em;
  border-radius: 0.25rem;
  background-color: color-mix(in srgb, var(--color-fg-primary) 8%, transparent);
}

.user-request__body :deep(pre) {
  overflow-x: auto;
  padding: var(--spacing-2);
  background-color: color-mix(in srgb, var(--color-fg-primary) 6%, transparent);
  border-radius: 0.25rem;
  text-align: left;
}

.user-request__body :deep(pre code) {
  padding: 0;
  background: none;
}
</style>
