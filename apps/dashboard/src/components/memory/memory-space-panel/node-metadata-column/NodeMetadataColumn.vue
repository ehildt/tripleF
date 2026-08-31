<script setup lang="ts">
/**
 * The metadata column: the selected dot's label, full text, and meta rows
 * (urls, timestamps, paths, …). Shows an empty hint until a dot is clicked.
 */
import type { NodeMetadataColumnProps } from './NodeMetadataColumn.types';

defineProps<NodeMetadataColumnProps>();
</script>

<template>
  <aside class="node-metadata-column">
    <template v-if="node">
      <h3 class="node-metadata-column__label">{{ node.label }}</h3>
      <p class="node-metadata-column__text">{{ node.text }}</p>
      <div v-if="frictions?.length" class="node-metadata-column__frictions">
        <span class="node-metadata-column__frictions-tag">{{
          $t('common.memoryFrictionTag')
        }}</span>
        <p
          v-for="(friction, index) in frictions"
          :key="`${friction.source}|${friction.target}|${index}`"
          class="node-metadata-column__friction"
        >
          {{ friction.reason }}
        </p>
      </div>
      <div
        v-if="node.evidenceTexts?.length"
        class="node-metadata-column__evidence"
      >
        <span class="node-metadata-column__evidence-tag">{{
          $t('common.memoryEvidenceTag')
        }}</span>
        <p
          v-for="(text, index) in node.evidenceTexts"
          :key="index"
          class="node-metadata-column__evidence-item"
        >
          {{ text }}
        </p>
      </div>
      <dl v-if="node.meta?.length" class="node-metadata-column__meta">
        <div
          v-for="row in node.meta"
          :key="row.label"
          class="node-metadata-column__row"
        >
          <dt>{{ row.label }}</dt>
          <dd>{{ row.value }}</dd>
        </div>
      </dl>
    </template>
    <p v-else class="node-metadata-column__empty">
      {{ $t('common.memoryMetadataEmpty') }}
    </p>
  </aside>
</template>

<style scoped>
.node-metadata-column {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  min-width: 0;
  padding: var(--spacing-3);
  overflow-y: auto;
  background-color: var(--color-bg-tertiary);
  border-left: 1px solid var(--color-divider);
}

.node-metadata-column__label {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-fg-secondary);
  overflow-wrap: anywhere;
}

.node-metadata-column__text {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  line-height: 1.5;
  color: var(--color-fg-primary);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.node-metadata-column__meta {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  margin: 0;
  padding-top: var(--spacing-2);
  border-top: 1px solid var(--color-divider);
}

.node-metadata-column__row {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-0-5);
}

.node-metadata-column__row dt {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-fg-muted);
}

.node-metadata-column__row dd {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-fg-primary);
  overflow-wrap: anywhere;
}

.node-metadata-column__empty {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-style: italic;
  color: var(--color-fg-muted);
}

/* Contested section: an open friction the selected dot is party to. */
.node-metadata-column__frictions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  padding: var(--spacing-2);
  background-color: color-mix(
    in srgb,
    var(--color-status-warning) 12%,
    transparent
  );
  border: 1px solid
    color-mix(in srgb, var(--color-status-warning) 45%, transparent);
}

.node-metadata-column__frictions-tag {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-status-warning);
}

.node-metadata-column__friction {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  line-height: 1.4;
  color: var(--color-fg-primary);
  overflow-wrap: anywhere;
}

/* Evidence section: the supporting facts a bridge/conviction cites. */
.node-metadata-column__evidence {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  padding: var(--spacing-2);
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-divider);
}

.node-metadata-column__evidence-tag {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-fg-muted);
}

.node-metadata-column__evidence-item {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  line-height: 1.4;
  color: var(--color-fg-primary);
  overflow-wrap: anywhere;
}
</style>
