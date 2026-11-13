<script setup lang="ts">
/**
 * The image preview flow of the preprocessing panel: a preview button that
 * picks (or reuses) an image, the hidden file input it triggers, and the
 * lightbox that shows the sharp variants with a repick action. Owning the
 * whole cluster keeps the composable call, the template ref, and the lightbox
 * inside one component — nothing crosses the component boundary.
 */
import { ImagePlus, ScanSearch } from '@lucide/vue';

import IconButton from '@/components/shared/ui/icon-button/IconButton.vue';
import Lightbox from '@/components/shared/ui/lightbox/Lightbox.vue';
import MenuButton from '@/components/shared/ui/menu-button/MenuButton.vue';

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
  <MenuButton
    :icon="ScanSearch"
    :label="$t('common.previewPreprocessingOnImage')"
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
      <IconButton
        size="lg"
        :title="$t('common.pickDifferentImage')"
        @click="repickImage"
      >
        <ImagePlus />
      </IconButton>
    </template>
  </Lightbox>
</template>

<style scoped>
.pproc-image-preview__file-input {
  display: none;
}
</style>
