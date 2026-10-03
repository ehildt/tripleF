import { type Ref, ref } from 'vue';

/**
 * Storage key for the persisted chat prompt draft. Kept as the legacy
 * `'api-fields'` value so drafts written by earlier versions survive the
 * refactor.
 */
const PROMPT_DRAFT_STORAGE_KEY = 'api-fields';

interface PersistedPromptDraft {
  /** Current field name. */
  promptDraft?: string;
  /** Legacy field name, read only for backward compatibility. */
  arguments_?: string;
  /** Unrelated legacy siblings are preserved on write. */
  [key: string]: unknown;
}

/**
 * The chat prompt text and its persistence across reloads. Owns the draft
 * value the prompt input binds to, so the submit flow no longer mixes draft
 * state into the request logic.
 */
export function usePromptDraft(): {
  promptDraft: Ref<string>;
  persistPromptDraft: () => void;
  resetPromptDraft: () => void;
} {
  const promptDraft = ref('');

  const saved = localStorage.getItem(PROMPT_DRAFT_STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as PersistedPromptDraft;
      promptDraft.value = parsed.promptDraft ?? parsed.arguments_ ?? '';
    } catch {
      /* ignore malformed persisted draft */
    }
  }

  function persistPromptDraft() {
    try {
      const existing = JSON.parse(
        localStorage.getItem(PROMPT_DRAFT_STORAGE_KEY) ?? '{}',
      ) as PersistedPromptDraft;
      existing.promptDraft = promptDraft.value;
      localStorage.setItem(PROMPT_DRAFT_STORAGE_KEY, JSON.stringify(existing));
    } catch {
      /* ignore */
    }
  }

  function resetPromptDraft() {
    promptDraft.value = '';
    persistPromptDraft();
  }

  return { promptDraft, persistPromptDraft, resetPromptDraft };
}
