<script setup lang="ts">
import { Check } from '@lucide/vue';
import { computed, ref } from 'vue';

import { stripHtml } from '@/utils/strip-html.helper';

import { displayValue } from './helpers/display-value.helper';
import { useDropdown } from './use-dropdown';

const props = withDefaults(
  defineProps<{
    /** Visual style: `labeled` for input-style trigger, `icon-only` for compact toolbar button. */
    variant?: 'labeled' | 'icon-only';
    /** Horizontal alignment of the dropdown menu relative to the trigger. */
    align?: 'left' | 'center' | 'right';
    /** Vertical side the menu opens toward. */
    side?: 'top' | 'bottom';
    /** Label text displayed in the trigger button (labeled variant only). */
    label: string;
    /** Available options to select from. */
    options: readonly string[];
    /** Currently selected value. */
    modelValue: string;
    /** Disables interaction and dims the trigger. */
    disabled?: boolean;
    /** Placeholder text shown when no value is selected (falls back to `label`). */
    placeholder?: string;
    /** Optional transform applied to the displayed value and each option label. */
    formatValue?: (value: string) => string;
    /** Shows an error indicator on the trigger. Requires `#error-icon` slot content. */
    errored?: boolean;
  }>(),
  {
    variant: 'labeled',
    align: 'left',
    side: 'top',
    disabled: false,
    placeholder: '',
    formatValue: undefined,
    errored: false,
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'open'): void;
}>();

const containerRef = ref<HTMLElement | null>(null);

const { open, toggle, select, close } = useDropdown(
  containerRef,
  (value: string) => emit('update:modelValue', value),
  () => emit('open'),
  computed(() => props.disabled),
);

defineExpose({ close });
</script>

<template>
  <div
    ref="containerRef"
    class="dropdown"
    :class="{ 'dropdown--icon-only': variant === 'icon-only' }"
  >
    <template v-if="variant === 'labeled'">
      <button
        class="dropdown-trigger"
        :class="{ 'dropdown-trigger--errored': errored }"
        :disabled="disabled"
        @click.stop="toggle"
      >
        <slot />
        <span class="dropdown-label">{{ label }}</span>
        <span class="dropdown-value">{{
          displayValue(
            props.modelValue,
            props.placeholder,
            props.label,
            props.formatValue,
          )
        }}</span>
        <span v-if="errored" class="dropdown-error-icon">
          <slot name="error-icon" />
        </span>
      </button>
    </template>
    <template v-else>
      <button
        class="dropdown-trigger--icon-only"
        :class="{ 'dropdown-trigger--icon-only--active': open }"
        :disabled="disabled"
        :title="`Select ${label.toLowerCase()}`"
        @click.stop="toggle"
      >
        <slot />
      </button>
    </template>
    <Transition name="dropdown">
      <div
        v-if="open"
        class="dropdown-menu"
        :class="[
          side === 'top' ? 'dropdown-menu--top' : 'dropdown-menu--bottom',
          align === 'left'
            ? 'dropdown-menu--left'
            : align === 'center'
              ? 'dropdown-menu--center'
              : 'dropdown-menu--right',
          variant === 'icon-only' && 'dropdown-menu--icon-only',
        ]"
        @click.stop
      >
        <button
          v-for="opt in options"
          :key="opt"
          class="dropdown-item"
          :class="{ 'dropdown-item--selected': modelValue === opt }"
          @click="select(opt)"
        >
          <Check v-if="modelValue === opt" class="dropdown-item__check" />
          <span v-else class="dropdown-item__check-placeholder" />
          {{ stripHtml(props.formatValue ? props.formatValue(opt) : opt) }}
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.dropdown {
  position: relative;
  flex: 1;
  min-width: 0;
  height: fit-content;
}

.dropdown--icon-only {
  flex: none;
  min-width: 0;
}

.dropdown-trigger {
  width: 100%;
  padding: var(--spacing-1-5) var(--spacing-3);
  font-size: 0.75rem;
  font-family: var(--font-mono);
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-divider);
  color: var(--color-fg-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.dropdown-trigger:disabled {
  opacity: 0.5;
  cursor: default;
}

.dropdown-trigger:hover:not(:disabled) {
  color: var(--color-accent-primary);
}

.dropdown-trigger--icon-only {
  padding: var(--spacing-1);
  color: var(--color-fg-muted);
  cursor: pointer;
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.dropdown-trigger--icon-only:disabled {
  opacity: 0.4;
  cursor: default;
}

.dropdown-trigger--icon-only:hover:not(:disabled) {
  color: var(--color-accent-primary);
  background-color: var(--color-bg-tertiary);
}

.dropdown-trigger--icon-only--active {
  color: var(--color-accent-primary);
  background-color: var(--color-bg-tertiary);
}

.dropdown-label {
  flex: 1;
  text-align: left;
}

.dropdown-value {
  font-size: 0.625rem;
  color: var(--color-fg-muted);
  font-family: var(--font-mono);
}

.dropdown-trigger--errored {
  border-color: var(--color-status-error);
}

.dropdown-error-icon {
  display: flex;
  align-items: center;
}

.dropdown-menu {
  position: absolute;
  z-index: 50;
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-divider);
  box-shadow: 0 10px 15px -3px
    color-mix(in srgb, var(--color-bg-primary) 10%, transparent);
  max-height: 12rem;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
}

.dropdown-menu::-webkit-scrollbar {
  width: 6px;
}

.dropdown-menu::-webkit-scrollbar-track {
  background: transparent;
}

.dropdown-menu::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--color-fg-muted) 50%, transparent);
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition:
    max-height 150ms ease,
    opacity 150ms ease;
  overflow: hidden;
}

.dropdown-enter-from,
.dropdown-leave-to {
  max-height: 0;
  opacity: 0;
}

.dropdown-enter-to,
.dropdown-leave-from {
  max-height: 12rem;
  opacity: 1;
}

.dropdown-menu--left {
  left: 0;
  right: auto;
}

.dropdown-menu--center {
  left: 50%;
  transform: translateX(-50%);
  right: auto;
}

.dropdown-menu--right {
  left: auto;
  right: 0;
}

.dropdown-menu--top {
  bottom: 100%;
  margin-bottom: var(--spacing-1);
}

.dropdown-menu--bottom {
  top: 100%;
  margin-top: var(--spacing-1);
}

.dropdown-menu--icon-only {
  width: auto;
  white-space: nowrap;
}

.dropdown-item {
  width: 100%;
  padding: var(--spacing-1-5) var(--spacing-3);
  text-align: left;
  font-size: 0.75rem;
  font-family: var(--font-mono);
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  color: var(--color-fg-secondary);
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.dropdown-item:hover {
  background-color: var(--color-bg-tertiary);
}

.dropdown-item--selected {
  color: var(--color-accent-primary);
}

.dropdown-item__check {
  width: 0.75rem;
  height: 0.75rem;
  flex-shrink: 0;
}

.dropdown-item__check-placeholder {
  width: 0.75rem;
  height: 0.75rem;
  flex-shrink: 0;
}
</style>
