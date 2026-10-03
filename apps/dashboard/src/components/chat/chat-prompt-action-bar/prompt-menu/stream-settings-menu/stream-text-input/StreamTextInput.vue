<script setup lang="ts">
import type { StreamTextInputProps } from './StreamTextInput.types';

defineProps<StreamTextInputProps>();

/** The field's value — exposed as the component's `v-model`. */
const model = defineModel<string>({ required: true });
</script>

<template>
  <div class="stream-text-input">
    <component :is="icon" class="stream-text-input__icon" />
    <input
      v-model="model"
      :name="name"
      :placeholder="placeholder"
      class="stream-text-input__input"
    />
  </div>
</template>

<style scoped>
.stream-text-input {
  position: relative;
  flex: 1;
  min-width: 0;
}

.stream-text-input__icon {
  width: 0.875rem;
  height: 0.875rem;
  color: var(--color-fg-muted);
  position: absolute;
  left: var(--spacing-2);
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

.stream-text-input__input {
  width: 100%;
  padding: var(--spacing-1-5) var(--spacing-3);
  padding-left: 1.75rem;
  font-size: 0.75rem;
  font-family: var(--font-mono);
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-divider);
  color: var(--color-fg-secondary);
  outline: none;
}

.stream-text-input__input::placeholder {
  color: var(--color-fg-muted);
}

.stream-text-input__input:focus {
  border-color: var(--color-accent-primary);
}
</style>
