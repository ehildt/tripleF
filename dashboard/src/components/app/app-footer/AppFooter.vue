<script setup lang="ts">
import { getConnectionStateColors } from '@/utils/colors/status/get-connection-state-colors.helper';

import type { ConnectionState } from '../../../stores/socket';
import { APP_VERSION } from '../../../version';

defineProps<{
  connectionState: ConnectionState;
  socketId?: string | null;
  connectedPairs?: string[];
}>();
</script>

<template>
  <footer class="app-footer">
    <div class="app-footer__container">
      <div class="app-footer__row">
        <div class="app-footer__left">
          <span class="app-footer__brand">ckir.io/harness</span>
          <span class="app-footer__divider">::</span>
          <span>v{{ APP_VERSION }}</span>
          <span class="app-footer__divider">::</span>
          <span :class="getConnectionStateColors(connectionState).text">
            {{ connectionState.toUpperCase() }}
          </span>
          <span v-if="socketId" class="app-footer__divider">::</span>
          <span v-if="socketId" class="app-footer__socket-id">
            {{ socketId }}
          </span>
        </div>

        <div class="app-footer__right">
          <span class="app-footer__label">endpoints:</span>
          <span class="app-footer__endpoint">/api/v1/harness</span>
        </div>

        <div v-if="connectedPairs?.length" class="app-footer__bindings">
          <span class="app-footer__label">connected:</span>
          <span class="app-footer__binding">{{
            connectedPairs.join(', ')
          }}</span>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 40;
  border-top: 1px solid var(--color-divider);
  background-color: var(--color-bg-secondary);
}

.app-footer__container {
  max-width: 80rem;
  margin-left: auto;
  margin-right: auto;
  padding: 0.5rem 1rem;
}

@media (min-width: 640px) {
  .app-footer__container {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .app-footer__container {
    padding-left: 2rem;
    padding-right: 2rem;
  }
}

.app-footer__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  line-height: 1rem;
  color: var(--color-fg-muted);
}

.app-footer__left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.app-footer__right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.app-footer__brand {
  color: var(--color-tab-rest);
}

.app-footer__divider {
  color: var(--color-border);
}

.app-footer__socket-id {
  font-size: 0.625rem;
  line-height: 0.875rem;
  color: var(--color-fg-secondary);
}

.app-footer__label {
  color: var(--color-fg-muted);
}

.app-footer__bindings {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.app-footer__binding {
  color: var(--color-accent-primary);
}

.app-footer__endpoint {
  color: var(--color-accent-primary);
}
</style>
