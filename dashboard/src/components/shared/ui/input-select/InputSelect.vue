<script setup lang="ts">
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/vue';
import { AlertCircle, Check, ChevronDown } from '@lucide/vue';
import { computed } from 'vue';

const props = defineProps<{
  modelValue: string;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
  blinking?: boolean;
  errored?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const displayValue = computed(() => {
  if (!props.modelValue) return props.placeholder || 'Select...';
  return props.modelValue;
});
</script>

<template>
  <Listbox
    :model-value="modelValue"
    :disabled="disabled"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="input-select">
      <ListboxButton
        class="input-select__button"
        :class="{ 'input-select__button--blinking': blinking }"
      >
        <span
          class="input-select__value"
          :class="{ 'input-select__value--placeholder': !modelValue }"
        >
          <slot name="prepend-icon" />
          <AlertCircle v-if="errored" class="input-select__error-icon" />
          {{ displayValue }}
        </span>
        <ChevronDown class="input-select__chevron" />
      </ListboxButton>
      <ListboxOptions class="input-select__options shadow-floating">
        <ListboxOption
          v-for="option in options"
          :key="option"
          v-slot="{ active, selected }"
          :value="option"
        >
          <li
            class="input-select__option"
            :class="{
              'input-select__option--active': active && !selected,
              'input-select__option--selected': selected,
            }"
          >
            <span>{{ option }}</span>
            <Check v-if="selected" class="input-select__check-icon" />
          </li>
        </ListboxOption>
      </ListboxOptions>
    </div>
  </Listbox>
</template>

<style scoped>
.input-select {
  position: relative;
  width: 100%;
}

/* Borderless — the surrounding field box IS the frame */
.input-select__button {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: var(--spacing-1) var(--spacing-4) var(--spacing-1) var(--spacing-1);
  border: none;
  background: transparent;
  color: var(--color-fg-primary);
  font-family: var(--font-mono);
  font-size: 0.8rem;
  text-align: center;
  cursor: pointer;
  outline: none;
}

.input-select__button:disabled {
  opacity: 0.4;
  cursor: default;
}

.input-select__button--blinking {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  box-shadow: 0 0 0 2px var(--color-accent-active);
}

.input-select__value {
  display: flex;
  align-items: center;
  gap: var(--spacing-1-5);
  min-width: 0;
}

.input-select__value--placeholder {
  color: var(--color-fg-muted);
}

.input-select__error-icon {
  flex-shrink: 0;
  width: 0.85rem;
  height: 0.85rem;
  color: var(--color-status-error);
}

.input-select__chevron {
  position: absolute;
  right: var(--spacing-1);
  top: 50%;
  transform: translateY(-50%);
  width: 1rem;
  height: 1rem;
  pointer-events: none;
  color: var(--color-fg-muted);
}

.input-select__options {
  position: absolute;
  z-index: 50;
  width: 100%;
  margin-top: var(--spacing-1);
  padding: 0;
  list-style: none;
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-divider);
  max-height: 10rem;
  overflow-y: auto;
  outline: none;
}

.input-select__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-1-5) var(--spacing-2);
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--color-fg-primary);
  cursor: pointer;
}

.input-select__option--active {
  background-color: color-mix(
    in srgb,
    var(--color-accent-active) 20%,
    transparent
  );
}

.input-select__option--selected {
  background-color: var(--color-accent-active);
  color: var(--color-fg-inverse);
}

.input-select__check-icon {
  width: 1rem;
  height: 1rem;
}
</style>
