<script setup lang="ts">
import { BrainCircuit, CircleGauge, Upload } from '@lucide/vue';
import { computed } from 'vue';

import Dropdown from '../../shared/ui/drop-down/DropDown.vue';
import { type SetDropdownRef } from '../composables/use-chat-dropdowns';

const props = defineProps<{
  value: string;
  isCompacting: boolean;
  thinkOptions: readonly string[];
  thinkValue: string;
  contextSizeOptions: readonly string[];
  contextSizeValue: string;
  defaultContextSize: string;
  formatContextSize: (value: string) => string;
  isDisabled: boolean;
  isFileSelectDisabled: boolean;
  fileSelectDisabledReason?: string;
  setActionBarRef: SetDropdownRef;
  setThinkDropdownRef: SetDropdownRef;
  setContextSizeDropdownRef: SetDropdownRef;
}>();

const emit = defineEmits<{
  input: [event: Event];
  keydown: [event: KeyboardEvent];
  selectThink: [think: string];
  selectContextSize: [ctx: string];
  openThink: [];
  openContextSize: [];
  disabledHoverStart: [];
  disabledHoverEnd: [];
  fileSelect: [];
}>();

const fileSelectClass = computed(() => ({
  'chat-prompt-action-bar__file-button': true,
  'chat-prompt-action-bar__file-button--disabled': props.isFileSelectDisabled,
}));

const fileSelectTitle = computed(
  () => props.fileSelectDisabledReason || 'Select files',
);

function onFileButtonMouseEnter() {
  if (props.isFileSelectDisabled) {
    emit('disabledHoverStart');
  }
}

function onFileButtonMouseLeave() {
  if (props.isFileSelectDisabled) {
    emit('disabledHoverEnd');
  }
}
</script>

<template>
  <div class="chat-prompt-action-bar">
    <span class="chat-prompt-action-bar__prompt">&gt;</span>
    <textarea
      :value="props.value"
      :rows="1"
      placeholder="Enter your text here…  (Enter: send, Shift+Enter: new line)"
      class="chat-prompt-action-bar__input"
      style="caret-shape: block"
      :disabled="props.isCompacting"
      @input="emit('input', $event)"
      @keydown="emit('keydown', $event)"
    />
    <div :ref="props.setActionBarRef" class="chat-prompt-action-bar__actions">
      <Dropdown
        :ref="props.setThinkDropdownRef"
        variant="icon-only"
        label="Think level"
        :options="props.thinkOptions"
        :model-value="props.thinkValue"
        :disabled="props.isDisabled"
        @update:model-value="emit('selectThink', $event)"
        @open="emit('openThink')"
      >
        <BrainCircuit class="chat-prompt-action-bar__icon" />
      </Dropdown>
      <Dropdown
        :ref="props.setContextSizeDropdownRef"
        variant="icon-only"
        label="Context"
        :options="props.contextSizeOptions"
        :model-value="props.contextSizeValue"
        :disabled="props.isDisabled"
        :format-value="props.formatContextSize"
        @update:model-value="emit('selectContextSize', $event)"
        @open="emit('openContextSize')"
      >
        <CircleGauge class="chat-prompt-action-bar__icon" />
      </Dropdown>
      <button
        :class="fileSelectClass"
        :disabled="props.isFileSelectDisabled"
        :title="fileSelectTitle"
        @mouseenter="onFileButtonMouseEnter"
        @mouseleave="onFileButtonMouseLeave"
        @click="emit('fileSelect')"
      >
        <Upload class="chat-prompt-action-bar__icon" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.chat-prompt-action-bar {
  margin-top: var(--spacing-3);
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-3);
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-divider);
  padding: var(--spacing-3) var(--spacing-4);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.chat-prompt-action-bar:focus-within {
  border-color: var(--color-tab-rest);
  box-shadow: 0 0 0 1px var(--color-tab-rest);
}

.chat-prompt-action-bar__prompt {
  color: var(--color-tab-rest);
  font-family: var(--font-mono);
  line-height: 1.5rem;
  user-select: none;
}

.chat-prompt-action-bar__input {
  flex: 1 1 0%;
  min-width: 0;
  background-color: transparent;
  border: none;
  color: var(--color-fg-primary);
  font-family: var(--font-mono);
  resize: none;
  outline: none;
}

.chat-prompt-action-bar__input::placeholder {
  color: var(--color-fg-muted);
}

.chat-prompt-action-bar__input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.chat-prompt-action-bar__actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--spacing-1-5);
  align-self: center;
}

.chat-prompt-action-bar__icon {
  width: 1rem;
  height: 1rem;
}

.chat-prompt-action-bar__file-button {
  padding: var(--spacing-1);
  color: var(--color-fg-muted);
  border-radius: 0.25rem;
  cursor: pointer;
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
  border: none;
  background-color: transparent;
}

.chat-prompt-action-bar__file-button:hover:not(:disabled) {
  color: var(--color-accent-primary);
  background-color: var(--color-bg-tertiary);
}

.chat-prompt-action-bar__file-button--disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
