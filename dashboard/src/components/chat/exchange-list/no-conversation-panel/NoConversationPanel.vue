<script setup lang="ts">
import { Brain, MessagesSquare, Sparkles } from '@lucide/vue';

import ExchangeEmptyStateCanvas from '../exchange-empty-state/exchange-empty-state-canvas/ExchangeEmptyStateCanvas.vue';
</script>

<template>
  <div class="no-conversation-panel">
    <ExchangeEmptyStateCanvas class="no-conversation-panel__canvas" />
    <div class="no-conversation-panel__content">
      <p class="no-conversation-panel__title">No conversation selected</p>
      <div class="no-conversation-panel__list">
        <div class="no-conversation-panel__row">
          <Brain class="no-conversation-panel__icon" />
          <span>Select a model first</span>
        </div>
        <div class="no-conversation-panel__row">
          <MessagesSquare class="no-conversation-panel__icon" />
          <span>Create or pick a chat</span>
        </div>
        <div class="no-conversation-panel__row">
          <Sparkles class="no-conversation-panel__icon" />
          <span>Start talking</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.no-conversation-panel {
  position: relative;
  padding: var(--spacing-4);
  width: 100%;
  height: calc(100vh - 14rem);
  min-height: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.no-conversation-panel__canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.no-conversation-panel__content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--color-fg-muted);
}

.no-conversation-panel__title {
  color: var(--color-fg-secondary);
  font-weight: 600;
}

.no-conversation-panel__list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.no-conversation-panel__row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
}

.no-conversation-panel__icon {
  width: 0.75rem;
  height: 0.75rem;
  flex-shrink: 0;
}
</style>
