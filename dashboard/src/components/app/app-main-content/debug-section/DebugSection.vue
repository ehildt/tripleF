<script setup lang="ts">
import Debug from '../../../../components/debug/Debug.vue';
import RequestDetails from '../../../../components/debug/request-details/RequestDetails.vue';
import type { DebugResult } from '../../../../types/debug.model';

defineProps<{
  debugResults: DebugResult[];
  selectedDebugResult: DebugResult | null;
}>();

const emit = defineEmits<{
  clearDebugResults: [];
  selectDebugResult: [result: DebugResult | null];
  selectDebugMarkRead: [id: string];
}>();
</script>

<template>
  <!-- Same shared column rule as the DLQ tab: both panels get one
       viewport-derived height and scroll their bodies internally. -->
  <div class="debug-column">
    <Debug
      class="debug-column__panel"
      :results="debugResults"
      :selected-result="selectedDebugResult"
      @clear="emit('clearDebugResults')"
      @select="emit('selectDebugResult', $event)"
      @mark-read="emit('selectDebugMarkRead', $event)"
    />
  </div>
  <div class="debug-column">
    <RequestDetails class="debug-column__panel" :result="selectedDebugResult" />
  </div>
</template>

<style scoped>
@media (min-width: 1024px) {
  .debug-column {
    grid-column: span 6 / span 6;
    position: sticky;
    top: 6rem;
    max-height: calc(100vh - 10rem);
  }

  .debug-column__panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }
}
</style>
