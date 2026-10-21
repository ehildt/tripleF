<script setup lang="ts">
import InputTextArea from '@/components/shared/ui/input-text-area/InputTextArea.vue';
import { formatBody } from '@/utils/format-body.helper';

import { useDlqPayloadEdit } from './composables/use-dlq-payload-edit';
import DlqPayloadToolbar from './dlq-payload-toolbar/DlqPayloadToolbar.vue';
import type {
  DlqPayloadEditorEmits,
  DlqPayloadEditorProps,
} from './DlqPayloadEditor.types';

/**
 * Read-only or edit-in-place view of the selected entry's payload: the
 * floating toolbar (back / edit / save / cancel) over either the editable
 * text area or the formatted read-only block. The entry and its payload are
 * guaranteed by the parent tab branch; editing is suppressed when immutable.
 */
const props = defineProps<DlqPayloadEditorProps>();

const emit = defineEmits<DlqPayloadEditorEmits>();

const { payloadText, isEditingPayload, startEdit, cancelEdit, saveEdit } =
  useDlqPayloadEdit();

function handleSave() {
  const result = saveEdit(props.entry);
  if (result) emit('savePayload', props.entry.id, result);
}
</script>

<template>
  <div class="dlq-payload-editor">
    <DlqPayloadToolbar
      :show-back="showBack ?? false"
      :is-immutable="isImmutable"
      :is-editing-payload="isEditingPayload"
      @back="emit('back')"
      @edit="startEdit(entry)"
      @save="handleSave"
      @cancel="cancelEdit"
    />
    <InputTextArea
      v-if="isEditingPayload && !isImmutable"
      v-model="payloadText"
      :rows="Math.max(5, (payloadText.match(/\n/g) || []).length + 3)"
      class="dlq-payload-editor__textarea"
    />
    <pre
      v-if="isImmutable || !isEditingPayload"
      class="dlq-payload-editor__read-only"
      :class="{
        'dlq-payload-editor__read-only--clickable': !isImmutable,
        'dlq-payload-editor__read-only--scrollable': scrollable,
      }"
      @click="!isImmutable && startEdit(entry)"
      >{{ formatBody(entry.payload ?? {}) }}</pre>
  </div>
</template>

<style scoped>
.dlq-payload-editor {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
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
