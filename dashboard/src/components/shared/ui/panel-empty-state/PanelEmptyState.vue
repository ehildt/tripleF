<script lang="ts" setup>
import { ShieldCheck } from '@lucide/vue';

withDefaults(defineProps<{ message?: string; submessage?: string }>(), {
  message: 'No requests yet',
  submessage: 'Send a request to see results',
});
</script>

<template>
  <div class="panel-empty-state">
    <div class="panel-empty-state__icon-wrapper">
      <ShieldCheck class="panel-empty-state__icon" />
    </div>
    <p class="panel-empty-state__message">
      {{ message }}
    </p>
    <p class="panel-empty-state__submessage">
      {{ submessage }}
    </p>
  </div>
</template>

<style scoped>
.panel-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem var(--spacing-4);
}

.panel-empty-state__icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  background-color: var(--color-bg-tertiary);
  margin-bottom: var(--spacing-3);
}

.panel-empty-state__icon {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--color-fg-muted);
}

.panel-empty-state__message {
  font-size: 0.875rem;
  font-family: var(--font-mono);
  color: var(--color-fg-muted);
  margin: 0;
}

.panel-empty-state__submessage {
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: color-mix(in srgb, var(--color-fg-muted) 70%, transparent);
  margin: var(--spacing-1) 0 0;
}
</style>
