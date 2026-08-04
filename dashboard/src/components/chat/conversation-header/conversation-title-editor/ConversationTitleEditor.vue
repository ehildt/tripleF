<script setup lang="ts">
defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'keydown', event: KeyboardEvent): void;
  (e: 'blur'): void;
}>();

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value);
}
</script>

<template>
  <input
    :value="modelValue"
    name="conversation-title"
    data-rename-input
    class="conversation-title-editor"
    @input="onInput"
    @keydown="(e) => emit('keydown', e)"
    @blur="emit('blur')"
  />
</template>

<style scoped>
.conversation-title-editor {
  flex: 1;
  min-width: 0;
  padding: 0 var(--spacing-1);
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-divider);
  font-size: 0.875rem;
  color: var(--color-fg-primary);
  font-family: var(--font-mono);
  outline: none;
}

.conversation-title-editor:focus {
  border-color: var(--color-tab-rest);
}
</style>
