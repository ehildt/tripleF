<script setup lang="ts">
/**
 * Secondary meta line below the user exchange header: request id, model, and
 * the formatted exchange time.
 */
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
    <span class="meta-row__time">{{ time }}</span>
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

.meta-row__item {
  font-size: 0.75rem;
  color: var(--color-fg-muted);
  font-family: var(--font-mono);
}

.meta-row__time {
  font-size: 0.75rem;
  color: var(--color-fg-muted);
  font-family: var(--font-mono);
}
</style>
