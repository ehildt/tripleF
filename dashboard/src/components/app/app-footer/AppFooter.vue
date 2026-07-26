<script setup lang="ts">
import { useClipboard } from '@vueuse/core';

import { useToast } from '../../../composables/use-toast';

const props = defineProps<{
  socketId?: string | null;
}>();

const toast = useToast();
const { copy } = useClipboard({ legacy: true });

/** Game-style session id: click copies it for support/debugging. */
async function copySessionId() {
  if (!props.socketId) return;
  await copy(props.socketId);
  toast.success('Copied to clipboard');
}
</script>

<template>
  <footer class="app-footer">
    <div class="app-footer__container">
      <button
        type="button"
        class="app-footer__session"
        :disabled="!socketId"
        :title="socketId ? 'Session ID — click to copy' : 'No session'"
        @click="copySessionId"
      >
        {{ socketId ?? '—' }}
      </button>
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
  margin-left: auto;
  margin-right: auto;
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
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

.app-footer__session {
  padding: 0;
  border: none;
  background: none;
  font-family: var(--font-mono);
  font-size: 0.625rem;
  line-height: 0.875rem;
  color: var(--color-fg-muted);
  cursor: pointer;
  user-select: text;
  transition: color 0.2s ease;
}

.app-footer__session:hover:not(:disabled) {
  color: var(--color-fg-primary);
}

.app-footer__session:disabled {
  cursor: default;
}
</style>
