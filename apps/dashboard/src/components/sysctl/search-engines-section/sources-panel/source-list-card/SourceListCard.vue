<script setup lang="ts">
import ResetButton from '@/components/shared/ui/reset-button/ResetButton.vue';

import { useSourceListCard } from './composables/use-source-list-card.composable';
import type {
  SourceListCardEmits,
  SourceListCardProps,
} from './SourceListCard.types';

const props = defineProps<SourceListCardProps>();
const emit = defineEmits<SourceListCardEmits>();

const { draft, textarea, resize, save } = useSourceListCard(props, emit);
</script>

<template>
  <div class="source-list-card">
    <div class="source-list-card__header">
      <div class="source-list-card__icon">
        <component :is="icon" class="source-list-card__icon-glyph" />
      </div>
      <div class="source-list-card__content">
        <span class="source-list-card__label">{{ label }}</span>
        <span class="source-list-card__description">{{ description }}</span>
      </div>
      <ResetButton :title="resetTitle" @click="emit('reset')" />
    </div>
    <textarea
      ref="textarea"
      v-model="draft"
      class="source-list-card__input"
      rows="6"
      :placeholder="placeholder"
      autocomplete="off"
      spellcheck="false"
      @input="resize(textarea)"
      @change="save"
    />
  </div>
</template>

<style scoped>
.source-list-card {
  flex: 1;
  gap: var(--spacing-1);
  min-width: 0;
  display: flex;
  flex-direction: column;
  background-color: color-mix(in srgb, var(--color-fg-muted) 10%, transparent);
}

.source-list-card:hover {
  filter: brightness(1.08);
}

/* Header row (field-card look): icon tile + label + description */
.source-list-card__header {
  background-color: var(--color-bg-tertiary);
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-2) var(--spacing-3);
}

.source-list-card__icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  background-color: color-mix(in srgb, var(--color-fg-muted) 10%, transparent);
  color: var(--color-fg-muted);
}

.source-list-card__icon-glyph {
  width: 1rem;
  height: 1rem;
}

.source-list-card__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.source-list-card__label {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-fg-secondary);
  overflow-wrap: anywhere;
}

.source-list-card__description {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  line-height: 1.4;
  color: var(--color-fg-muted);
  overflow-wrap: anywhere;
}

.source-list-card__input {
  width: 100%;
  max-height: 16rem;
  padding: var(--spacing-2) var(--spacing-3);
  border: none;

  color: var(--color-fg-primary);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  line-height: 1.5;
  outline: none;
  resize: none;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.source-list-card__input::placeholder {
  color: var(--color-fg-muted);
  opacity: 0.5;
}
</style>
