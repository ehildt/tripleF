<script setup lang="ts">
import { ImagePlus } from '@lucide/vue';

import CollapsiblePanel from '@/components/shared/ui/collapsible-panel/CollapsiblePanel.vue';
import Lightbox from '@/components/shared/ui/lightbox/Lightbox.vue';
import PowerToggle from '@/components/shared/ui/power-toggle/PowerToggle.vue';
import PreviewButton from '@/components/shared/ui/preview-button/PreviewButton.vue';
import ResetButton from '@/components/shared/ui/reset-button/ResetButton.vue';
import Tooltip from '@/components/shared/ui/tooltip/Tooltip.vue';

import { usePreprocessingStore } from '../../../stores/preprocessing';
import PprocAdvancedParametersSection from './advanced-parameters-section/PprocAdvancedParametersSection.vue';
import { usePreprocessingPreview } from './composables/use-preprocessing-preview';
import PprocResizeSection from './resize-section/PprocResizeSection.vue';
import PprocVariantsSection from './variants-section/PprocVariantsSection.vue';

const store = usePreprocessingStore();

const {
  isPreviewLoading,
  lightbox,
  onFilePicked,
  onPreviewClick,
  repickImage,
} = usePreprocessingPreview();
</script>

<template>
  <div class="pproc-tools-panel">
    <div class="pproc-tools-panel__card">
      <CollapsiblePanel
        id="preprocessing"
        :title="$t('common.imagePreprocessing')"
      >
        <template #actions>
          <PreviewButton
            :title="$t('common.previewPreprocessingOnImage')"
            :disabled="isPreviewLoading"
            @click="onPreviewClick"
          />
          <ResetButton
            :title="$t('common.resetPreprocessingToDefaults')"
            @click="store.resetToDefaults()"
          />
          <PowerToggle
            :enabled="store.enabled"
            tone="preprocessing"
            :title="$t('common.enablePreprocessing')"
            @toggle="store.setEnabled(!store.enabled)"
          />
        </template>

        <div class="pproc-tools-panel__body">
          <PprocResizeSection />
          <PprocVariantsSection />
          <PprocAdvancedParametersSection />
        </div>
      </CollapsiblePanel>
    </div>

    <input
      ref="fileInput"
      type="file"
      name="image-upload"
      accept="image/png,image/jpeg,image/webp"
      class="pproc-tools-panel__file-input"
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
            class="pproc-tools-panel__repick"
            :aria-label="$t('common.pickDifferentImage')"
            @click="repickImage"
          >
            <ImagePlus class="pproc-tools-panel__repick-icon" />
          </button>
        </Tooltip>
      </template>
    </Lightbox>
  </div>
</template>

<style scoped>
.pproc-tools-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.pproc-tools-panel__card {
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-divider);
  box-shadow:
    0 0.25rem 0.75rem color-mix(in srgb, black 12%, transparent),
    inset 0 1px 0 color-mix(in srgb, white 6%, transparent);
}

.pproc-tools-panel__body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  padding: var(--spacing-4);
}

.pproc-tools-panel__file-input {
  display: none;
}

.pproc-tools-panel__repick {
  padding: var(--spacing-1);
  color: var(--color-fg-muted);
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s ease;
  flex-shrink: 0;
}

.pproc-tools-panel__repick:hover {
  color: var(--color-accent-primary);
}

.pproc-tools-panel__repick-icon {
  width: 1.25rem;
  height: 1.25rem;
}
</style>
