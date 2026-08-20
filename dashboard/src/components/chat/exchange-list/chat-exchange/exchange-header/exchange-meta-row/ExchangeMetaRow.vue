<script setup lang="ts">
/**
 * The user exchange's header row: the request id, model, and formatted
 * exchange time right-aligned, closed by the user icon at the very right
 * (same size as the assistant header's bot icon). User exchanges carry no
 * header actions — those live on the right-panel history items — so the
 * meta row is the only header content.
 */
import { User } from '@lucide/vue';

defineProps<{
  requestId?: string;
  model?: string;
  time: string;
}>();
</script>

<template>
  <div class="meta-row">
    <span v-if="requestId" class="meta-row__item">{{ requestId }}</span>
    <span v-if="model" class="meta-row__item">{{ model }}</span>
    <span class="meta-row__item">{{ time }}</span>
    <User class="meta-row__icon" aria-hidden="true" />
  </div>
</template>

<style scoped>
.meta-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-1);
}

.meta-row__icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  color: var(--color-tab-accent);
}

.meta-row__item {
  font-size: 0.75rem;
  color: var(--color-fg-muted);
  font-family: var(--font-mono);
}
</style>
