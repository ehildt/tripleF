<script setup lang="ts">
/**
 * The Settings "Preprocessing" tab: the image preprocessing panel with the
 * master toggle, resize settings, image variants, and advanced parameters.
 */
import { ref, watch } from 'vue';

import { usePreprocessingStore } from '@/stores/preprocessing';

import PprocToolsPanel from '../../pproc/tools-panel/PprocToolsPanel.vue';
import SettingsSection from '../shared/ui/settings-section/SettingsSection.vue';

const store = usePreprocessingStore();

// Brief "pop" on the panel whenever the master toggle or a variant flips —
// same feedback the integrations panel gives on configuration changes.
const panelChanged = ref(false);
watch(
  () => [store.enabled, JSON.stringify(store.variants)],
  () => {
    panelChanged.value = false;
    requestAnimationFrame(() => {
      panelChanged.value = true;
    });
  },
  { flush: 'post' },
);
</script>

<template>
  <SettingsSection :class="{ 'panel-changed': panelChanged }">
    <PprocToolsPanel />
  </SettingsSection>
</template>

<style scoped>
.panel-changed {
  animation: preprocessing-panel-changed 0.4s ease;
}

@keyframes preprocessing-panel-changed {
  0% {
    box-shadow: 0 0 0 2px var(--color-tab-preprocessing);
  }
  100% {
    box-shadow: 0 0 0 0 transparent;
  }
}
</style>
