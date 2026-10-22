<script setup lang="ts">
import { Power, RotateCcw } from '@lucide/vue';

import MenuButton from '@/components/shared/ui/menu-button/MenuButton.vue';
import MenuRow from '@/components/shared/ui/menu-row/MenuRow.vue';
import { usePreprocessingSettingsStore } from '@/stores/preprocessing-settings/preprocessing-settings.store';

import PprocAdvancedParametersSection from './advanced-parameters-section/PprocAdvancedParametersSection.vue';
import PprocImagePreview from './pproc-image-preview/PprocImagePreview.vue';
import PprocResizeSection from './resize-section/PprocResizeSection.vue';
import PprocVariantsSection from './variants-section/PprocVariantsSection.vue';

const store = usePreprocessingSettingsStore();
</script>

<template>
  <div class="pproc-tools-panel">
    <MenuRow variant="panel" role="toolbar">
      <PprocImagePreview />
      <MenuButton
        :icon="RotateCcw"
        :label="$t('common.resetPreprocessingToDefaults')"
        @click="store.resetToDefaults()"
      />
      <MenuButton
        :icon="Power"
        :label="$t('common.enablePreprocessing')"
        :active="store.enabled"
        @click="store.setEnabled(!store.enabled)"
      />
    </MenuRow>

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
}

.pproc-tools-panel__body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}
</style>
