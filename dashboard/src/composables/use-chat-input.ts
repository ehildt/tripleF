import type { Ref } from 'vue';

export function useChatInput(
  arguments_: Ref<string>,
  submit: (text?: string) => Promise<void>,
  persistArguments: () => void,
) {
  function onCollapsedSubmit() {
    const trimmed = arguments_.value.trim();
    if (!trimmed) return;
    submit(trimmed);
    arguments_.value = '';
    persistArguments();
  }

  function onCollapsedKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onCollapsedSubmit();
    }
  }

  function onPromptInput(e: Event) {
    const val = (e.target as HTMLTextAreaElement).value;
    arguments_.value = val;
    persistArguments();
  }

  return {
    onCollapsedSubmit,
    onCollapsedKeydown,
    onPromptInput,
  };
}
