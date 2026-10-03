import { usePromptDraft } from './use-prompt-draft';
import { useSubmit } from './use-submit';

/**
 * Keyboard handling for the chat prompt: Enter submits, Shift+Enter keeps
 * the newline. Composes its dependencies by import — the shared prompt
 * draft and the submit composable — rather than receiving them as arguments.
 * The prompt text itself binds through `v-model` on the prompt input.
 */
export function useChatInput() {
  const { promptDraft } = usePromptDraft();
  const { submit } = useSubmit();

  function onCollapsedSubmit() {
    const trimmed = promptDraft.value.trim();
    if (!trimmed) return;
    submit(trimmed);
    promptDraft.value = '';
  }

  function onCollapsedKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onCollapsedSubmit();
    }
  }

  return {
    onCollapsedSubmit,
    onCollapsedKeydown,
  };
}
