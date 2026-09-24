<script setup lang="ts">
/**
 * The shared empty-state card for response templates: a centered, bordered
 * panel shown when a response carries no content at all (or a collection
 * template has nothing to list). Callers pass already-translated strings —
 * the optional title is the prominent heading, the message the body line.
 */
defineProps<{
  title?: string;
  message: string;
}>();
</script>

<template>
  <section class="empty-state-section">
    <h3 v-if="title">{{ title }}</h3>
    <p>{{ message }}</p>
  </section>
</template>

<style scoped>
.empty-state-section {
  padding: 1.5em;
  border: 1px solid var(--color-divider);
  background: var(--color-bg-tertiary);
  text-align: center;
}

.empty-state-section h3 {
  margin: 0 0 0.5em;
  font-size: 1.1em;
  color: var(--color-fg-primary);
}

.empty-state-section p {
  margin: 0;
  color: var(--color-fg-secondary);
  font-size: 0.95em;
}
</style>
