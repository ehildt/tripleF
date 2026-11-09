import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

import { normalizeTemporaryRetentionMinutes } from './helpers/normalize-temporary-retention-minutes.helper';
import { parseDocumentTextLimit } from './helpers/parse-document-text-limit.helper';
import { parseTemporaryRetentionMinutes } from './helpers/parse-temporary-retention-minutes.helper';
import {
  DEFAULT_DOCUMENT_TEXT_LIMIT,
  DEFAULT_TEMPORARY_RETENTION_MINUTES,
  DOCUMENT_TEXT_LIMIT_KEY,
  TEMPORARY_RETENTION_KEY,
} from './conversation-settings.constant';

export const useConversationSettingsStore = defineStore(
  'conversation-settings',
  () => {
    /** How long an unpinned temporary conversation survives locally. */
    const temporaryRetentionMinutes = ref<number>(
      DEFAULT_TEMPORARY_RETENTION_MINUTES,
    );
    try {
      temporaryRetentionMinutes.value = parseTemporaryRetentionMinutes(
        localStorage.getItem(TEMPORARY_RETENTION_KEY),
      );
    } catch {
      /* Storage unavailable: retain the default retention. */
    }

    /** Maximum extracted document characters retained per file. */
    const documentTextLimit = ref<number>(DEFAULT_DOCUMENT_TEXT_LIMIT);
    try {
      documentTextLimit.value = parseDocumentTextLimit(
        localStorage.getItem(DOCUMENT_TEXT_LIMIT_KEY),
      );
    } catch {
      /* Storage unavailable: retain the default document limit. */
    }

    watch(temporaryRetentionMinutes, (value) => {
      try {
        localStorage.setItem(TEMPORARY_RETENTION_KEY, String(value));
      } catch {
        /* Storage unavailable: retain the preference in memory. */
      }
    });
    watch(documentTextLimit, (value) => {
      try {
        localStorage.setItem(DOCUMENT_TEXT_LIMIT_KEY, String(value));
      } catch {
        /* Storage unavailable: retain the preference in memory. */
      }
    });

    function setTemporaryRetentionMinutes(minutes: number): void {
      temporaryRetentionMinutes.value =
        normalizeTemporaryRetentionMinutes(minutes);
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
