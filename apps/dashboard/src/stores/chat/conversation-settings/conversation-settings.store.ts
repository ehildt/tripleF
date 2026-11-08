import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

import { parseDocumentTextLimit } from './helpers/parse-document-text-limit.helper';
import { parseTemporaryRetentionMinutes } from './helpers/parse-temporary-retention-minutes.helper';
import {
  DEFAULT_DOCUMENT_TEXT_LIMIT,
  DEFAULT_TEMPORARY_RETENTION_MINUTES,
  DOCUMENT_TEXT_LIMIT_KEY,
  TEMPORARY_RETENTION_KEY,
} from './conversation-settings.constant';

function loadTemporaryRetentionMinutes(): number {
  try {
    const raw = localStorage.getItem(TEMPORARY_RETENTION_KEY);
    return parseTemporaryRetentionMinutes(raw);
  } catch {
    /* ignore */
  }
  return DEFAULT_TEMPORARY_RETENTION_MINUTES;
}

function saveTemporaryRetentionMinutes(value: number): void {
  try {
    localStorage.setItem(TEMPORARY_RETENTION_KEY, String(value));
  } catch {
    /* ignore */
  }
}

function loadDocumentTextLimit(): number {
  try {
    const raw = localStorage.getItem(DOCUMENT_TEXT_LIMIT_KEY);
    return parseDocumentTextLimit(raw);
  } catch {
    return DEFAULT_DOCUMENT_TEXT_LIMIT;
  }
}

function saveDocumentTextLimit(value: number): void {
  try {
    localStorage.setItem(DOCUMENT_TEXT_LIMIT_KEY, String(value));
  } catch {
    /* ignore */
  }
}

export const useConversationSettingsStore = defineStore(
  'conversation-settings',
  () => {
    /** How long an unpinned (temporary) conversation survives locally. */
    const temporaryRetentionMinutes = ref<number>(
      loadTemporaryRetentionMinutes(),
    );
    /** Max characters of extracted document text kept per file; the rest is
     * truncated with a toast. Configurable so it can grow as models do. */
    const documentTextLimit = ref<number>(loadDocumentTextLimit());

    watch(temporaryRetentionMinutes, saveTemporaryRetentionMinutes);
    watch(documentTextLimit, saveDocumentTextLimit);

    function setTemporaryRetentionMinutes(minutes: number): void {
      temporaryRetentionMinutes.value = Math.max(
        0,
        Math.floor(Number.isFinite(minutes) ? minutes : 0),
      );
    }

    function setDocumentTextLimit(value: number): void {
      documentTextLimit.value = value;
    }

    return {
      temporaryRetentionMinutes,
      documentTextLimit,
      setTemporaryRetentionMinutes,
      setDocumentTextLimit,
    };
  },
);
