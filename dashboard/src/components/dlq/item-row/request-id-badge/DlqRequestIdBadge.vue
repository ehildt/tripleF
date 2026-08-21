<script setup lang="ts">
defineProps<{
  /** BullMQ job name — for harness turns it is the originating request id. */
  jobName: string;
}>();
</script>

<template>
  <span class="dlq-request-id-badge">{{ jobName }}</span>
</template>

<style scoped>
/* Accent text on its own translucent tint (same language as the active
   row) instead of near-white text on the opaque gradient. */
.dlq-request-id-badge {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  padding: var(--spacing-0-5) var(--spacing-2);
  color: var(--color-tab-debug);
  background: linear-gradient(
    to right,
    color-mix(in srgb, var(--color-tab-debug) 15%, transparent),
    transparent
  );
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
