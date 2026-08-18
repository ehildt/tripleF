<script setup lang="ts">
/**
 * Merge marker row for a user exchange that consolidates earlier requests:
 * one glassy square tag per source request id.
 */
defineProps<{
  requestIds: string[];
}>();
</script>

<template>
  <div v-if="requestIds.length" class="merge-tags">
    <span
      v-for="requestId in requestIds"
      :key="requestId"
      class="merge-tags__tag"
      >{{ requestId }}</span
    >
  </div>
</template>

<style scoped>
.merge-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: var(--spacing-1);
  margin-bottom: var(--spacing-1);
}

.merge-tags__tag {
  max-width: 100%;
  overflow-wrap: anywhere;
  padding: 0.15em 0.5em;
  font-size: 0.75em;
  line-height: 1.4;
  color: var(--color-fg-primary);
  /* Glassy, deliberately square: translucent tint + backdrop blur, no
     border radius. */
  background: color-mix(in srgb, var(--color-accent-primary) 12%, transparent);
  border: 1px solid
    color-mix(in srgb, var(--color-accent-primary) 30%, transparent);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 0;
}
</style>
