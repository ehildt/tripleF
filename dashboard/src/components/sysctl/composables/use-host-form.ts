import { type Ref, ref, watch } from 'vue';

/**
 * Draft state for the Ollama host field. The input mirrors the server's
 * effective host; on change only a trimmed, non-empty, actually changed
 * value is patched — anything else restores the display. After a successful
 * patch the refreshed host is mirrored back via the watch.
 */
export function useHostForm(
  save: (host: string) => Promise<void>,
  current: Ref<string>,
) {
  const draft = ref('');

  watch(
    current,
    (host) => {
      draft.value = host;
    },
    { immediate: true },
  );

  async function submit() {
    const host = draft.value.trim();
    if (!host || host === current.value) {
      draft.value = current.value;
      return;
    }
    await save(host);
  }

  return { draft, submit };
}
