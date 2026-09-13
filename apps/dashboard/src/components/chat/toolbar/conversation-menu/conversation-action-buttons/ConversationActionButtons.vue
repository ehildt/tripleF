<script setup lang="ts">
import type { ConversationActionButtonsProps } from './ConversationActionButtons.types';

defineProps<ConversationActionButtonsProps>();

const emit = defineEmits<{
  create: [type: 'temporary' | 'persistent'];
}>();
</script>

<template>
  <div class="conversation-action-buttons">
    <button
      class="conversation-action-buttons__button"
      :class="
        canCreate
          ? 'conversation-action-buttons__button--enabled'
          : 'conversation-action-buttons__button--disabled'
      "
      :disabled="!canCreate"
      @click.stop="emit('create', 'temporary')"
    >
      {{ $t('common.temporary') }}
    </button>
    <button
      class="conversation-action-buttons__button"
      :class="
        canCreate
          ? 'conversation-action-buttons__button--enabled'
          : 'conversation-action-buttons__button--disabled'
      "
      :disabled="!canCreate"
      @click.stop="emit('create', 'persistent')"
    >
      {{ $t('common.persistent') }}
    </button>
  </div>
</template>

<style scoped>
.conversation-action-buttons {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
}

.conversation-action-buttons__button {
  flex: 1;
  padding: var(--spacing-1-5) var(--spacing-2);
  font-size: 0.75rem;
  font-family: var(--font-mono);
  transition:
    color 0.3s ease,
    background-color 0.3s ease,
    border-color 0.3s ease;
  border: 1px solid var(--color-divider);
}

.conversation-action-buttons__button--enabled {
  cursor: pointer;
  background-color: var(--color-bg-tertiary);
  color: var(--color-fg-muted);
}

.conversation-action-buttons__button--enabled:hover {
  background-color: var(--color-accent-primary);
  color: var(--color-fg-inverse);
}

.conversation-action-buttons__button--disabled {
  cursor: default;
  opacity: 0.5;
  background-color: var(--color-bg-tertiary);
  color: var(--color-fg-muted);
}
</style>
