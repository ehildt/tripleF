<script setup lang="ts">
/**
 * Section heading for assistant-response blocks (news, sources, …): a
 * consistent h3 with the shared section-title treatment. Presentational —
 * the caller owns the text (translated or computed).
 */
defineProps<{
  title: string;
  /** Anchor id so the owning section can reference this title via aria-labelledby. */
  id?: string;
}>();
</script>

<template>
  <h3 :id="id" class="section-title">{{ title }}</h3>
</template>

<style scoped>
.section-title {
  margin: 0 0 var(--spacing-2);
  font-size: 1rem;
  color: var(--color-fg-primary);
}
</style>
