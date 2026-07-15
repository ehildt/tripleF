<script setup lang="ts">
/**
 * The SysCtl "Preprocessing" tab: the pproc tools panel (master toggle,
 * resize, variants) next to the options panel (advanced parameters).
 */
import PprocOptionsPanel from '../../pproc/options-panel/PprocOptionsPanel.vue';
import PprocToolsPanel from '../../pproc/tools-panel/PprocToolsPanel.vue';
</script>

<template>
  <div class="preprocessing-section">
    <PprocToolsPanel class="preprocessing-section__panel" />
    <PprocOptionsPanel class="preprocessing-section__panel" />
  </div>
</template>

<style scoped>
.preprocessing-section {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: var(--spacing-4);
  padding: var(--spacing-4);
}

@media (min-width: 1024px) {
  .preprocessing-section {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.preprocessing-section__panel {
  min-width: 0;
}
</style>
