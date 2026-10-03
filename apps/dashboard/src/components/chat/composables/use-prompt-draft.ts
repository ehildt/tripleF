import { type Ref, ref } from 'vue';

/**
 * The chat prompt text, held in memory for the chat view's lifetime.
 *
 * Module-scope so every caller — the input binding, the collapsed-submit
 * handler, and the submit composable — shares the same ref. This is a
 * deliberate singleton composable, not fresh state per call: the draft must
 * be one value no matter who asks. It is intentionally not persisted to
 * storage, so a draft never reappears after a reload.
 */
const promptDraft = ref('');

export function usePromptDraft(): {
  promptDraft: Ref<string>;
  resetPromptDraft: () => void;
} {
  function resetPromptDraft() {
    promptDraft.value = '';
  }

  return { promptDraft, resetPromptDraft };
}
