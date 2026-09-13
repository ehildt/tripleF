<script setup lang="ts">
import { MessagesSquare } from '@lucide/vue';

import type { ConversationNameInputProps } from './ConversationNameInput.types';

defineProps<ConversationNameInputProps>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
  submit: [];
}>();
</script>

<template>
  <div class="conversation-name-input">
    <MessagesSquare class="conversation-name-input__icon" />
    <input
      :value="modelValue"
      name="conversation-name"
      :placeholder="placeholder"
      class="conversation-name-input__input"
      @keydown.enter="emit('submit')"
      @input="
        emit('update:modelValue', ($event.target as HTMLInputElement).value)
      "
    />
  </div>
</template>

<style scoped>
.conversation-name-input {
  position: relative;
}

.conversation-name-input__icon {
  width: 0.875rem;
  height: 0.875rem;
  color: var(--color-fg-muted);
  position: absolute;
  left: var(--spacing-3);
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

.conversation-name-input__input {
  width: 100%;
  padding: var(--spacing-1-5) var(--spacing-3);
  padding-left: 2rem;
  font-size: 0.75rem;
  font-family: var(--font-mono);
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-divider);
  color: var(--color-fg-secondary);
  outline: none;
}

.conversation-name-input__input::placeholder {
  color: var(--color-fg-muted);
}

.conversation-name-input__input:focus {
  border-color: var(--color-accent-primary);
}
</style>
