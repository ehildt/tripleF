<script setup lang="ts">
import { ref } from 'vue';
import { useId } from 'vue';

import { useComboBox } from './composables/use-combo-box';

const props = withDefaults(
  defineProps<{
    /** Current value (free text or a picked option). */
    modelValue: string;
    /** Existing values offered below the divider. Empty → plain input. */
    options?: readonly string[];
    /** Placeholder shown in the input and the empty trigger. */
    placeholder: string;
    /** Stable id for the field. Auto-generated if omitted. */
    id?: string;
    /** Name attribute, aids browser autofill. */
    name?: string;
  }>(),
  { options: () => [], id: () => useId(), name: undefined },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const containerRef = ref<HTMLElement | null>(null);
const menuInputRef = ref<HTMLInputElement | null>(null);

const { open, toggle, select } = useComboBox(
  containerRef,
  menuInputRef,
  (value: string) => emit('update:modelValue', value),
);

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value);
}
</script>

<template>
  <div ref="containerRef" class="combo-box">
    <!-- No existing options: the field is a plain input, no dropdown. -->
    <div v-if="!props.options.length" class="combo-box__field">
      <span v-if="$slots.default" class="combo-box__icon">
        <slot />
      </span>
      <input
        :id="id"
        :name="name"
        :value="props.modelValue"
        :placeholder="props.placeholder"
        class="combo-box__input"
        :class="{ 'combo-box__input--with-icon': $slots.default }"
        @input="onInput"
      />
    </div>

    <!-- Existing options: trigger opens input + divider + option list. -->
    <template v-else>
      <button class="combo-box__trigger" type="button" @click.stop="toggle">
        <span v-if="$slots.default" class="combo-box__icon">
          <slot />
        </span>
        <span
          class="combo-box__value"
          :class="{ 'combo-box__value--placeholder': !props.modelValue }"
        >
          {{ props.modelValue || props.placeholder }}
        </span>
      </button>
      <div v-if="open" class="combo-box__menu" @click.stop>
        <input
          :id="id"
          ref="menuInputRef"
          :name="name"
          :value="props.modelValue"
          :placeholder="props.placeholder"
          class="combo-box__input"
          @input="onInput"
          @keydown.enter="select(props.modelValue)"
        />
        <div class="combo-box__divider" role="separator" />
        <button
          v-for="option in props.options"
          :key="option"
          class="combo-box__option"
          :class="{
            'combo-box__option--selected': option === props.modelValue,
          }"
          type="button"
          @click="select(option)"
        >
          {{ option }}
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.combo-box {
  position: relative;
  width: 100%;
  min-width: 0;
}

.combo-box__field {
  position: relative;
}

.combo-box__icon {
  position: absolute;
  left: var(--spacing-3);
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  color: var(--color-fg-muted);
  pointer-events: none;
  z-index: 1;
}

.combo-box__input {
  width: 100%;
  padding: var(--spacing-1-5) var(--spacing-3);
  font-size: 0.75rem;
  font-family: var(--font-mono);
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-divider);
  color: var(--color-fg-secondary);
  outline: none;
}

.combo-box__input--with-icon {
  padding-left: 2rem;
}

.combo-box__input::placeholder {
  color: var(--color-fg-muted);
}

.combo-box__input:focus {
  border-color: var(--color-accent-primary);
}

.combo-box__trigger {
  position: relative;
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
  text-align: left;
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.combo-box__trigger:hover {
  color: var(--color-accent-primary);
}

.combo-box__trigger .combo-box__icon {
  position: static;
  transform: none;
}

.combo-box__value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.combo-box__value--placeholder {
  color: var(--color-fg-muted);
}

.combo-box__menu {
  position: absolute;
  left: 0;
  right: 0;
  top: 100%;
  z-index: 60;
  display: flex;
  flex-direction: column;
  padding: var(--spacing-1);
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-divider);
  box-shadow: 0 10px 15px -3px
    color-mix(in srgb, var(--color-bg-primary) 10%, transparent);
}

.combo-box__divider {
  height: 1px;
  margin: var(--spacing-1) 0;
  background-color: var(--color-divider);
}

.combo-box__option {
  padding: var(--spacing-1-5) var(--spacing-2);
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--color-fg-secondary);
  text-align: left;
  cursor: pointer;
  border: none;
  background-color: transparent;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

.combo-box__option:hover {
  background-color: var(--color-bg-tertiary);
}

.combo-box__option--selected {
  color: var(--color-accent-primary);
}
</style>
