<script setup lang="ts">
/**
 * Main orchestrator for the preprocessing group. Composes the tools
 * panel (master toggle, resize, variants) and the options panel
 * (advanced parameters) inside the app's 12-column grid.
 */
import PprocOptionsPanel from './options-panel/PprocOptionsPanel.vue';
import PprocToolsPanel from './tools-panel/PprocToolsPanel.vue';
</script>

<template>
  <div class="lg:col-span-6 h-fit lg:sticky lg:top-24">
    <PprocToolsPanel />
  </div>
  <div class="lg:col-span-6 h-fit lg:sticky lg:top-24">
    <PprocOptionsPanel class="h-full lg:sticky lg:top-24" />
  </div>
</template>
