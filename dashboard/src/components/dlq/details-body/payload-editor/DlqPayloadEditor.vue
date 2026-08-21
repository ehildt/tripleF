<script setup lang="ts">
import { Check, FilePenLine, Undo2, X } from '@lucide/vue';

import type { DlqEntry } from '@/types/dlq-entry.model';
import { formatBody } from '@/utils/format-body.helper';

import InputTextArea from '../../../shared/ui/input-text-area/InputTextArea.vue';
import Tooltip from '../../../shared/ui/tooltip/Tooltip.vue';
import { useDlqPayloadEdit } from './composables/use-dlq-payload-edit';

const props = defineProps<{
  entry: DlqEntry | null;
  isImmutable: boolean;
  showBack?: boolean;
  scrollable?: boolean;
}>();

const emit = defineEmits<{
  (e: 'savePayload', id: string, payload: Record<string, unknown>): void;
  (e: 'back'): void;
}>();

const { payloadText, isEditingPayload, startEdit, cancelEdit, saveEdit } =
  useDlqPayloadEdit();

function handleSave() {
  if (!props.entry) return;
  const result = saveEdit(props.entry);
  if (result) {
    emit('savePayload', props.entry.id, result);
  }
}
</script>

<template>
  <div v-if="entry?.payload" class="dlq-payload-editor">
    <div class="dlq-payload-editor__toolbar">
      <Tooltip v-if="showBack" :text="$t('common.back')">
        <button
          class="dlq-payload-editor__toolbar-button"
          @click="emit('back')"
        >
          <Undo2 class="dlq-payload-editor__toolbar-icon" />
        </button>
      </Tooltip>
      <template v-if="!isImmutable">
        <template v-if="isEditingPayload">
          <Tooltip :text="$t('common.save')">
            <button
              class="dlq-payload-editor__toolbar-button dlq-payload-editor__toolbar-button--success"
              @click="handleSave"
            >
              <Check class="dlq-payload-editor__toolbar-icon" />
            </button>
          </Tooltip>
          <Tooltip :text="$t('common.cancel')">
            <button
              class="dlq-payload-editor__toolbar-button dlq-payload-editor__toolbar-button--error"
              @click="cancelEdit"
            >
              <X class="dlq-payload-editor__toolbar-icon" />
            </button>
          </Tooltip>
        </template>
        <Tooltip v-else :text="$t('common.edit')">
          <button
            class="dlq-payload-editor__toolbar-button"
            @click="startEdit(entry!)"
          >
            <FilePenLine class="dlq-payload-editor__toolbar-icon" />
          </button>
        </Tooltip>
      </template>
    </div>
    <InputTextArea
      v-if="isEditingPayload && !isImmutable"
      v-model="payloadText"
      :rows="Math.max(5, (payloadText.match(/\n/g) || []).length + 3)"
      class="dlq-payload-editor__textarea"
    />
    <pre
      v-else
      class="dlq-payload-editor__read-only"
      :class="{
        'dlq-payload-editor__read-only--clickable': !isImmutable,
        'dlq-payload-editor__read-only--scrollable': scrollable,
      }"
      @click="!isImmutable && startEdit(entry!)"
      >{{ formatBody(entry.payload) }}</pre>
  </div>
</template>

<style scoped>
.dlq-payload-editor {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.dlq-payload-editor__toolbar {
  position: absolute;
  top: var(--spacing-2);
  right: var(--spacing-2);
  z-index: 10;
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
}

.dlq-payload-editor__toolbar-button {
  padding: var(--spacing-1);
  color: var(--color-fg-muted);
  cursor: pointer;
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

.dlq-payload-editor__toolbar-button:hover {
  color: var(--color-fg-primary);
}

.dlq-payload-editor__toolbar-button--success {
  color: var(--color-status-success);
}

.dlq-payload-editor__toolbar-button--success:hover {
  background-color: color-mix(
    in srgb,
    var(--color-status-success) 10%,
    transparent
  );
}

.dlq-payload-editor__toolbar-button--error {
  color: var(--color-status-error);
}

.dlq-payload-editor__toolbar-button--error:hover {
  background-color: color-mix(
    in srgb,
    var(--color-status-error) 10%,
    transparent
  );
}

.dlq-payload-editor__toolbar-icon {
  width: 0.875rem;
  height: 0.875rem;
}

.dlq-payload-editor__textarea {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  resize: none;
  user-select: text;
}

.dlq-payload-editor__read-only {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-fg-primary);
  white-space: pre-wrap;
  overflow-wrap: break-word;
  background-color: var(--color-bg-secondary);
  padding: var(--spacing-2);
  border: 1px solid var(--color-divider);
  user-select: text;
}

.dlq-payload-editor__read-only--clickable {
  cursor: pointer;
}

.dlq-payload-editor__read-only--scrollable {
  overflow: auto;
  overscroll-behavior: contain;
  max-height: calc(100vh - 17.5rem);
}
</style>
