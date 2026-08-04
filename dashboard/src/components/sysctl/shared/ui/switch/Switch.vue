<script setup lang="ts">
import { useId } from 'vue';

withDefaults(
  defineProps<{
    checked: boolean;
    disabled?: boolean;
    /** Stable id for the checkbox. Auto-generated if omitted. */
    id?: string;
    /** Name attribute, aids browser autofill. */
    name?: string;
  }>(),
  { id: () => useId(), name: undefined },
);

const emit = defineEmits<{
  toggle: [];
}>();
</script>

<template>
  <label class="switch" :class="{ 'switch--disabled': disabled }">
    <input
      :id="id"
      type="checkbox"
      class="switch__input"
      :name="name"
      :checked="checked"
      :disabled="disabled"
      @change="emit('toggle')"
    />
    <span class="switch__track" />
    <span class="switch__thumb" />
  </label>
</template>

<style scoped>
.switch {
  position: relative;
  display: inline-flex;
  width: 1.5rem;
  height: 0.75rem;
  align-items: center;
  flex-shrink: 0;
  cursor: pointer;
}

.switch--disabled {
  cursor: default;
  opacity: 0.4;
}

.switch__input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.switch__track {
  position: absolute;
  inset: 0;
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-divider);
  transition: background-color 200ms ease;
}

.switch__input:checked + .switch__track {
  background-color: var(--color-accent-primary);
}

.switch__thumb {
  position: absolute;
  top: 0.125rem;
  left: 0.125rem;
  width: 0.5rem;
  height: 0.5rem;
  background-color: var(--color-fg-muted);
  transition:
    transform 200ms ease,
    background-color 200ms ease;
}

.switch__input:checked + .switch__track + .switch__thumb {
  transform: translateX(0.75rem);
  background-color: var(--color-fg-primary);
}
</style>
