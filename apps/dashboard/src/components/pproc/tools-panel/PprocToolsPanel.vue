<script setup lang="ts">
import PanelActions from '@/components/shared/ui/panel-actions/PanelActions.vue';
import PowerToggle from '@/components/shared/ui/power-toggle/PowerToggle.vue';
import ResetButton from '@/components/shared/ui/reset-button/ResetButton.vue';
import { usePreprocessingStore } from '@/stores/preprocessing';

import PprocAdvancedParametersSection from './advanced-parameters-section/PprocAdvancedParametersSection.vue';
import PprocImagePreview from './pproc-image-preview/PprocImagePreview.vue';
import PprocResizeSection from './resize-section/PprocResizeSection.vue';
import PprocVariantsSection from './variants-section/PprocVariantsSection.vue';

const store = usePreprocessingStore();
</script>

<template>
  <div class="pproc-tools-panel">
    <PanelActions>
      <PprocImagePreview />
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
    </PanelActions>

    <div class="pproc-tools-panel__body">
      <PprocResizeSection />
      <PprocVariantsSection />
      <PprocAdvancedParametersSection />
    </div>
  </div>
</template>

<style scoped>
.pproc-tools-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  padding: var(--spacing-2);
}

.pproc-tools-panel__body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}
</style>
