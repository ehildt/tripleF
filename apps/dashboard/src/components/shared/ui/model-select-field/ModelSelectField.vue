<script setup lang="ts">
import { AlertCircle, ChevronDown } from '@lucide/vue';
import { computed, ref } from 'vue';

import ModelList from '@/components/shared/ui/model-list/ModelList.vue';

import { useModelSelectField } from './composables/use-model-select-field';
import type {
  ModelSelectFieldEmits,
  ModelSelectFieldProps,
} from './ModelSelectField.types';

/**
 * Model picker for the settings Memory tab and the DLQ details top bar: a
 * borderless trigger inside ModelFieldCard's inline field, a teleported
 * dropdown
 * with the shared searchable model list, and an optional "Default"
 * pseudo-option that clears the override (env baseline). An override missing
 * from the catalog is prepended so it stays selectable.
 */
const props = withDefaults(defineProps<ModelSelectFieldProps>(), {
  modelValue: '',
  disabled: false,
  errored: false,
});
const emit = defineEmits<ModelSelectFieldEmits>();

const containerRef = ref<HTMLElement | null>(null);
const triggerRef = ref<HTMLElement | null>(null);
const dropdownRef = ref<HTMLElement | null>(null);

const { isOpen, positionStyle, toggleMenu, closeMenu } = useModelSelectField({
  containerRef,
  triggerRef,
  dropdownRef,
});

/** An override missing from the catalog stays listed so it can be kept. */
const localModelsWithMissing = computed(() => {
  const catalog = [...props.localModels, ...props.cloudModels];
  if (props.modelValue && !catalog.some((m) => m.model === props.modelValue)) {
    return [{ model: props.modelValue }, ...props.localModels];
  }
  return props.localModels;
});

function onSelect(model: string) {
  emit('update:modelValue', model);
  closeMenu();
}
</script>

<template>
  <div ref="containerRef" class="model-select-field">
    <button
      ref="triggerRef"
      type="button"
      class="model-select-field__trigger"
      :class="{ 'model-select-field__trigger--active': isOpen }"
      :title="$t('common.selectModel')"
      :aria-label="$t('common.selectModel')"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
      :disabled="disabled"
      @click="toggleMenu"
    >
      <span
        class="model-select-field__trigger-label"
        :class="{ 'model-select-field__trigger-label--default': !modelValue }"
      >
        {{ modelValue || defaultLabel }}
      </span>
      <AlertCircle v-if="errored" class="model-select-field__trigger-error" />
      <ChevronDown class="model-select-field__trigger-chevron" />
    </button>

    <!-- Teleported to <body>: the card's hover filter would otherwise
         paint an open dropdown under the cards after it. -->
    <Teleport to="body">
      <Transition name="dropdown">
        <div
          v-if="isOpen"
          ref="dropdownRef"
          class="model-select-field__dropdown"
          :style="positionStyle ?? undefined"
          role="listbox"
        >
          <ModelList
            :local-models="localModelsWithMissing"
            :cloud-models="cloudModels"
            :selected-model="modelValue"
            :loading="loading"
            :default-label="defaultLabel"
            @select="onSelect"
          />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.model-select-field {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 1.75rem;
  justify-content: center;
}

/* Trigger: fills the card's field box like the former text input. */
.model-select-field__trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-1);
  width: 100%;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--color-fg-primary);
  font-family: var(--font-mono);
  font-size: 0.8rem;
  cursor: pointer;
  transition: color 0.3s ease;
}

.model-select-field__trigger:hover {
  color: var(--color-accent-primary);
}

.model-select-field__trigger:disabled {
  opacity: 0.4;
  cursor: default;
}

.model-select-field__trigger:disabled:hover {
  color: var(--color-fg-primary);
}

.model-select-field__trigger:focus {
  outline: none;
}

.model-select-field__trigger:focus-visible {
  outline: 1px solid var(--color-accent-primary);
  outline-offset: 2px;
}

.model-select-field__trigger-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.model-select-field__trigger-label--default {
  color: var(--color-fg-muted);
  font-size: 0.7rem;
}

.model-select-field__trigger-chevron {
  flex-shrink: 0;
  width: 0.875rem;
  height: 0.875rem;
  color: var(--color-fg-muted);
}

.model-select-field__trigger-error {
  flex-shrink: 0;
  width: 0.875rem;
  height: 0.875rem;
  color: var(--color-status-error);
}

/* Teleported dropdown, matching the SpaceSelector's elevated surface. */
.model-select-field__dropdown {
  position: fixed;
  width: 14rem;
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-divider);
  box-shadow: 0 10px 15px -3px
    color-mix(in srgb, var(--color-bg-primary) 10%, transparent);
  z-index: 1300;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
