<script setup lang="ts">
import { useId } from 'vue';

withDefaults(
  defineProps<{
    modelValue: string;
    placeholder?: string;
    disabled?: boolean;
    rows?: number;
    /** Stable id for the field. Auto-generated if omitted. */
    id?: string;
    /** Name attribute, aids browser autofill. */
    name?: string;
  }>(),
  {
    id: () => useId(),
    name: undefined,
    placeholder: undefined,
    rows: undefined,
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'keydown', event: KeyboardEvent): void;
}>();

function handleInput(event: Event) {
  const target = event.target as HTMLTextAreaElement;
  emit('update:modelValue', target.value);
}

function handleKeydown(event: KeyboardEvent) {
  emit('keydown', event);
}
</script>

<template>
  <textarea
    :id="id"
    :name="name"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :rows="rows ?? 3"
    class="input-text-area"
    :class="{ 'input-text-area--disabled': disabled }"
    @input="handleInput"
    @keydown="handleKeydown"
  />
</template>

<style scoped>
.input-text-area {
  width: 100%;
  padding: var(--spacing-2) var(--spacing-3);
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-divider);
  border-radius: 0;
  font-size: 0.875rem;
  color: var(--color-fg-primary);
  font-family: var(--font-mono);
  outline: none;
  resize: none;
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.input-text-area::placeholder {
  text-align: left;
  color: var(--color-fg-muted);
}

.input-text-area:focus {
  border-color: var(--color-tab-rest);
  box-shadow: 0 0 0 1px var(--color-tab-rest);
}

.input-text-area:disabled,
.input-text-area--disabled {
  opacity: 0.5;
  cursor: default;
}
</style>
