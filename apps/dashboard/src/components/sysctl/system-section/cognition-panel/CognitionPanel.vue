<script setup lang="ts">
import { Fingerprint, RefreshCw, Trash2 } from '@lucide/vue';

import IconButton from '@/components/shared/ui/icon-button/IconButton.vue';

import type {
  CognitionPanelEmits,
  CognitionPanelProps,
} from './CognitionPanel.types';

/**
 * The AI's memory cognition read-out — styled after the search-engine
 * SourceListCard (header row with icon/label/description + actions, bordered
 * read-out below). Read-only: the AI writes this document; the user reads,
 * refreshes, and wipes it.
 */
defineProps<CognitionPanelProps>();
const emit = defineEmits<CognitionPanelEmits>();
</script>

<template>
  <div class="cognition-panel">
    <div class="cognition-panel__header">
      <div class="cognition-panel__icon">
        <Fingerprint class="cognition-panel__icon-glyph" />
      </div>
      <div class="cognition-panel__content">
        <span class="cognition-panel__label">{{
          $t('common.memoryCognition')
        }}</span>
        <span class="cognition-panel__description">{{
          $t('common.memoryCognitionDesc')
        }}</span>
      </div>
      <div class="cognition-panel__actions">
        <IconButton
          :title="$t('common.memoryCognitionRefresh')"
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
              : $t('common.memoryCognitionWipe')
          "
          @click="emit('wipe')"
        >
          <Trash2 />
        </IconButton>
      </div>
    </div>

    <div
      class="cognition-panel__body"
      :class="{ 'cognition-panel__body--empty': isEmpty || isUnavailable }"
    >
      <template v-if="isUnavailable">{{
        $t('common.memoryCognitionUnavailable')
      }}</template>
      <template v-else-if="isEmpty">{{
        $t('common.memoryCognitionEmpty')
      }}</template>
      <template v-else>{{ displayText }}</template>
    </div>
  </div>
</template>

<style scoped>
.cognition-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  background-color: color-mix(in srgb, var(--color-fg-muted) 10%, transparent);
}

.cognition-panel:hover {
  filter: brightness(1.08);
}

/* Header row (field-card look): icon tile + label + description + actions */
.cognition-panel__header {
  background-color: var(--color-bg-tertiary);
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-2) var(--spacing-3);
}

.cognition-panel__icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  background-color: color-mix(in srgb, var(--color-fg-muted) 10%, transparent);
  color: var(--color-fg-muted);
}

.cognition-panel__icon-glyph {
  width: 1rem;
  height: 1rem;
}

.cognition-panel__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.cognition-panel__label {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-fg-secondary);
  overflow-wrap: anywhere;
}

.cognition-panel__description {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  line-height: 1.4;
  color: var(--color-fg-muted);
  overflow-wrap: anywhere;
}

.cognition-panel__actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  flex-shrink: 0;
}

/* Read-out body: pre-wrapped mono, scrolls like the source lists. */
.cognition-panel__body {
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

.cognition-panel__body--empty {
  color: var(--color-fg-muted);
  font-style: italic;
}
</style>
