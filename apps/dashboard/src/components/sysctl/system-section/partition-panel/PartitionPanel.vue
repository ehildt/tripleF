<script setup lang="ts">
import { Brain, RefreshCw, Trash2 } from '@lucide/vue';

import IconButton from '@/components/shared/ui/icon-button/IconButton.vue';

import type {
  PartitionPanelEmits,
  PartitionPanelProps,
} from './PartitionPanel.types';

/**
 * The user's memory partition read-out — the fact-record sibling of the
 * cognition panel, styled identically (header row with icon/label/description
 * + actions, bordered read-out below). Read-only: the turn pipeline writes
 * these records; the user reads, refreshes, and prunes them.
 */
defineProps<PartitionPanelProps>();
const emit = defineEmits<PartitionPanelEmits>();
</script>

<template>
  <div class="partition-panel">
    <div class="partition-panel__header">
      <div class="partition-panel__icon">
        <Brain class="partition-panel__icon-glyph" />
      </div>
      <div class="partition-panel__content">
        <span class="partition-panel__label">{{
          $t('common.memoryPartitionFacts')
        }}</span>
        <span class="partition-panel__description">{{
          $t('common.memoryPartitionFactsDesc')
        }}</span>
      </div>
      <div class="partition-panel__actions">
        <IconButton
          :title="$t('common.memoryPartitionRefresh')"
          :disabled="disabled"
          size="sm"
          @click="emit('refresh')"
        >
          <RefreshCw />
        </IconButton>
        <IconButton
          danger
          size="sm"
          :armed="wipeArmed"
          :disabled="disabled || isEmpty"
          :title="
            wipeArmed
              ? $t('common.clickAgainConfirmDelete')
              : $t('common.memoryPartitionWipe')
          "
          @click="emit('wipe')"
        >
          <Trash2 />
        </IconButton>
      </div>
    </div>

    <div
      class="partition-panel__body"
      :class="{ 'partition-panel__body--empty': isEmpty || isUnavailable }"
    >
      <template v-if="isUnavailable">{{
        $t('common.memoryPartitionUnavailable')
      }}</template>
      <template v-else-if="isEmpty">{{
        $t('common.memoryPartitionEmpty')
      }}</template>
      <template v-else>{{ displayText }}</template>
    </div>
  </div>
</template>

<style scoped>
.partition-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  background-color: color-mix(in srgb, var(--color-fg-muted) 10%, transparent);
}

.partition-panel:hover {
  filter: brightness(1.08);
}

/* Header row (field-card look): icon tile + label + description + actions */
.partition-panel__header {
  background-color: var(--color-bg-tertiary);
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-2) var(--spacing-3);
}

.partition-panel__icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  background-color: color-mix(in srgb, var(--color-fg-muted) 10%, transparent);
  color: var(--color-fg-muted);
}

.partition-panel__icon-glyph {
  width: 1rem;
  height: 1rem;
}

.partition-panel__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.partition-panel__label {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-fg-secondary);
  overflow-wrap: anywhere;
}

.partition-panel__description {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  line-height: 1.4;
  color: var(--color-fg-muted);
  overflow-wrap: anywhere;
}

.partition-panel__actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  flex-shrink: 0;
}

/* Read-out body: pre-wrapped mono, scrolls like the source lists. */
.partition-panel__body {
  max-height: 16rem;
  padding: var(--spacing-2) var(--spacing-3);
  color: var(--color-fg-primary);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.partition-panel__body--empty {
  color: var(--color-fg-muted);
  font-style: italic;
}
</style>
