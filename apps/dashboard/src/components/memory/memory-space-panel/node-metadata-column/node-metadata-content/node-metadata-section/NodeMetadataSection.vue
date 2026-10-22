<script setup lang="ts">
/**
 * A titled metadata section: a mono uppercase tag above a list of rows, in
 * either warning or neutral chrome. Used for the contested frictions and
 * the supporting evidence of a selected constellation dot — the two blocks
 * share shape and differ only in tone and text.
 */
import type { NodeMetadataSectionProps } from './NodeMetadataSection.types';

defineProps<NodeMetadataSectionProps>();
</script>

<template>
  <section
    class="node-metadata-section"
    :class="`node-metadata-section--${tone}`"
  >
    <span class="node-metadata-section__tag">{{ label }}</span>
    <!-- Rows are inert strings, order-static per selection and possibly
         duplicated — keyed by index by design (no id to key on). -->
    <p
      v-for="(item, index) in items"
      :key="index"
      class="node-metadata-section__item"
    >
      {{ item }}
    </p>
  </section>
</template>

<style scoped>
.node-metadata-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  padding: var(--spacing-2);
}

.node-metadata-section--warning {
  background-color: color-mix(
    in srgb,
    var(--color-status-warning) 12%,
    transparent
  );
  border: 1px solid
    color-mix(in srgb, var(--color-status-warning) 45%, transparent);
}

.node-metadata-section--neutral {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-divider);
}

.node-metadata-section__tag {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.node-metadata-section--warning .node-metadata-section__tag {
  color: var(--color-status-warning);
}

.node-metadata-section--neutral .node-metadata-section__tag {
  color: var(--color-fg-muted);
}

.node-metadata-section__item {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  line-height: 1.4;
  color: var(--color-fg-primary);
  overflow-wrap: anywhere;
}
</style>
