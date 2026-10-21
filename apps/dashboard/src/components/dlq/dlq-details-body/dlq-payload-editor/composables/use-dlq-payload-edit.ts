import { ref } from 'vue';

import type { DlqEntry } from '@/types/dlq-entry.model';

export function useDlqPayloadEdit() {
  const payloadText = ref('');
  const isEditingPayload = ref(false);

  function startEdit(entry: DlqEntry | null) {
    if (!entry) return;
    payloadText.value = JSON.stringify(entry.payload ?? {}, null, 2);
    isEditingPayload.value = true;
  }

  function cancelEdit() {
    isEditingPayload.value = false;
  }

  function saveEdit(entry: DlqEntry | null): Record<string, unknown> | null {
    if (!entry) return null;
    try {
      const parsed = JSON.parse(payloadText.value);
      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        alert('Invalid JSON. Please correct before saving.');
        return null;
      }
      isEditingPayload.value = false;
      return parsed as Record<string, unknown>;
    } catch {
      alert('Invalid JSON. Please correct before saving.');
      return null;
    }
  }

  return { payloadText, isEditingPayload, startEdit, cancelEdit, saveEdit };
}
