<script setup lang="ts">
import Debug from '../../../../components/debug/Debug.vue';
import RequestDetails from '../../../../components/debug/request-details/RequestDetails.vue';
import { useDebugStore } from '../../../../stores/debug/debug.store';
import { useDebugSelection } from './composables/use-debug-selection';

const debugStore = useDebugStore();
const { selectedResult, selectDebugResult, clearDebugView } =
  useDebugSelection();
</script>

<template>
  <!-- Same shared column rule as the DLQ tab: both panels get one
       viewport-derived height and scroll their bodies internally. -->
  <div class="debug-column">
    <Debug
      class="debug-column__panel"
      :results="debugStore.debugResults"
      :selected-result="selectedResult"
      @clear="clearDebugView"
      @select="selectDebugResult"
      @mark-read="debugStore.markDebugAsRead"
    />
  </div>
  <div class="debug-column">
    <RequestDetails
      class="debug-column__panel"
      :class="{
        'debug-column__panel--dynamic': selectedResult,
      }"
      :result="selectedResult"
    />
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

  /* When a request is selected the details panel sizes to its content
     (dynamic height) instead of filling the shared viewport column. */
  .debug-column__panel--dynamic {
    height: auto;
  }
}
</style>
