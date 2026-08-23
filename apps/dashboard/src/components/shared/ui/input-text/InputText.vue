<script setup lang="ts">
import { useId } from 'vue';

withDefaults(
  defineProps<{
    modelValue: string;
    placeholder?: string;
    disabled?: boolean;
    /** Stable id for the field. Auto-generated if omitted. */
    id?: string;
    /** Name attribute, aids browser autofill. */
    name?: string;
  }>(),
  { id: () => useId(), name: undefined, placeholder: undefined },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
}
</script>

<template>
  <div class="input-text">
    <div v-if="$slots['prepend-icon']" class="input-text__prepend">
      <slot name="prepend-icon" />
    </div>
    <input
      :id="id"
      :name="name"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      class="input-text__field"
      :class="{
        'input-text__field--with-prepend': $slots['prepend-icon'],
        'input-text__field--disabled': disabled,
      }"
      @input="handleInput"
    />
  </div>
</template>

<style scoped>
.input-text {
  position: relative;
  width: 100%;
}

.input-text__prepend {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: center;
  padding-left: var(--spacing-3);
  pointer-events: none;
  z-index: 10;
}

.input-text__field {
  width: 100%;
  padding: var(--spacing-2) var(--spacing-3);
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-divider);
  border-radius: 0;
  font-size: 0.875rem;
  color: var(--color-fg-primary);
  font-family: var(--font-mono);
  outline: none;
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.input-text__field::placeholder {
  text-align: left;
  color: var(--color-fg-muted);
}

.input-text__field:focus {
  border-color: var(--color-accent-active);
  box-shadow: 0 0 0 1px var(--color-accent-active);
}

.input-text__field:disabled,
.input-text__field--disabled {
  opacity: 0.5;
  cursor: default;
}

.input-text__field--with-prepend {
  padding-left: 2.25rem;
}
</style>
