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
    <button
      type="button"
      class="app-footer__session"
      :disabled="!socketId"
      :title="socketId ? 'Session ID — click to copy' : 'No session'"
      @click="copySessionId"
    >
      {{ socketId ?? '—' }}
    </button>
  </footer>
</template>

<style scoped>
.app-footer {
  position: fixed;
  bottom: 0.75rem;
  left: 1rem;
  z-index: 40;
  padding: var(--spacing-0-5) var(--spacing-1);
}

@media (min-width: 640px) {
  .app-footer {
    left: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .app-footer {
    left: 2rem;
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
