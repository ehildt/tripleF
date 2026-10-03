import type { Ref } from 'vue';

export function useChatInput(
  promptDraft: Ref<string>,
  submit: (text?: string) => Promise<void>,
  persistPromptDraft: () => void,
) {
  function onCollapsedSubmit() {
    const trimmed = promptDraft.value.trim();
    if (!trimmed) return;
    submit(trimmed);
    promptDraft.value = '';
    persistPromptDraft();
  }

  function onCollapsedKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onCollapsedSubmit();
    }
  }

  function onPromptInput(e: Event) {
    const val = (e.target as HTMLTextAreaElement).value;
    promptDraft.value = val;
    persistPromptDraft();
  }

  return {
    onCollapsedSubmit,
    onCollapsedKeydown,
    onPromptInput,
  };
}
