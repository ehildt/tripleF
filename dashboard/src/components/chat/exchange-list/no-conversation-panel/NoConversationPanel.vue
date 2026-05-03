<script setup lang="ts">
import { Brain, MessagesSquare, Network } from '@lucide/vue';
</script>

<template>
  <div class="no-conversation-panel">
    <p class="no-conversation-panel__title">📋 No Conversation Selected</p>
    <div class="no-conversation-panel__list">
      <div class="no-conversation-panel__row">
        <Brain class="no-conversation-panel__icon" />
        <span>first select a model — everything else depends on it</span>
      </div>
      <div class="no-conversation-panel__row">
        <MessagesSquare class="no-conversation-panel__icon" />
        <span>click to create or switch conversations</span>
      </div>
      <div class="no-conversation-panel__row">
        <Network class="no-conversation-panel__icon" />
        <span
          >configure sockets &amp; subscriptions (optional — for real-time
          data)</span
        >
      </div>
    </div>
  </div>
</template>

<style scoped>
.no-conversation-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  padding: var(--spacing-4);
  height: calc(100vh - 21rem);
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--color-fg-muted);
  max-width: 24rem;
  margin: 0 auto;
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
  gap: var(--spacing-2);
}

.no-conversation-panel__icon {
  width: 0.75rem;
  height: 0.75rem;
  flex-shrink: 0;
}
</style>
