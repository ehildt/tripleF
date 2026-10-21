<script setup lang="ts">
/**
 * The image preview flow of the preprocessing panel: a preview button that
 * picks (or reuses) an image, the hidden file input it triggers, and the
 * lightbox that shows the sharp variants with a repick action. Owning the
 * whole cluster keeps the composable call, the template ref, and the lightbox
 * inside one component — nothing crosses the component boundary.
 */
import { ImagePlus } from '@lucide/vue';

import Lightbox from '@/components/shared/ui/lightbox/Lightbox.vue';
import PreviewButton from '@/components/shared/ui/preview-button/PreviewButton.vue';
import Tooltip from '@/components/shared/ui/tooltip/Tooltip.vue';

import { usePreprocessingPreview } from '../composables/use-preprocessing-preview';

const {
  isPreviewLoading,
  lightbox,
  onFilePicked,
  onPreviewClick,
  repickImage,
} = usePreprocessingPreview();
</script>

<template>
  <PreviewButton
    :title="$t('common.previewPreprocessingOnImage')"
    :disabled="isPreviewLoading"
    @click="onPreviewClick"
  />

  <input
    ref="fileInput"
    type="file"
    name="image-upload"
    accept="image/png,image/jpeg,image/webp"
    class="pproc-image-preview__file-input"
    @change="onFilePicked"
  />

  <Lightbox
    :images="lightbox.images.value"
    :index="lightbox.index.value"
    :active-title="lightbox.activeTitle.value"
    :is-open="lightbox.isOpen.value"
    @close="lightbox.close"
    @prev="lightbox.goPrev"
    @next="lightbox.goNext"
    @select-index="lightbox.index.value = $event"
  >
    <template #actions>
      <Tooltip :text="$t('common.pickDifferentImage')">
        <button
          type="button"
          class="pproc-image-preview__repick"
          :aria-label="$t('common.pickDifferentImage')"
          @click="repickImage"
        >
          <ImagePlus class="pproc-image-preview__repick-icon" />
        </button>
      </Tooltip>
    </template>
  </Lightbox>
</template>

<style scoped>
.pproc-image-preview__file-input {
  display: none;
}

.pproc-image-preview__repick {
  padding: var(--spacing-1);
  color: var(--color-fg-muted);
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s ease;
  flex-shrink: 0;
}

.pproc-image-preview__repick:hover {
  color: var(--color-accent-primary);
}

.pproc-image-preview__repick-icon {
  width: 1.25rem;
  height: 1.25rem;
}
</style>
