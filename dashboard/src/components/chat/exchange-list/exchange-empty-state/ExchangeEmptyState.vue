<script setup lang="ts">
import ExchangeEmptyStateCanvas from './exchange-empty-state-canvas/ExchangeEmptyStateCanvas.vue';
</script>

<template>
  <div class="exchange-empty-state">
    <ExchangeEmptyStateCanvas class="exchange-empty-state__canvas" />
    <div class="exchange-empty-state__hint">
      <p>Send a message to start the conversation.</p>
      <p>
        <span class="exchange-empty-state__kbd">Enter</span>
        sends ·
        <span class="exchange-empty-state__kbd">Ctrl+Enter</span>
        new line
      </p>
    </div>
  </div>
</template>

<style scoped>
.exchange-empty-state {
  position: relative;
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-4);
  overflow: hidden;
  min-height: 0;
}

.exchange-empty-state__canvas {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.exchange-empty-state__hint {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  text-align: center;
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--color-fg-muted);
  font-style: italic;
}

.exchange-empty-state__kbd {
  color: var(--color-fg-secondary);
  font-weight: 600;
  font-style: normal;
}
</style>
