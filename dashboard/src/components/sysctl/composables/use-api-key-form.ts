import { type Ref, ref, watch } from 'vue';

/**
 * Draft state for the provider API key field. The single input displays the
 * server's masked key; focusing it selects the text so typing replaces it,
 * and whenever no new key was entered (empty or unchanged) the masked key
 * is restored. After a successful patch the refreshed masked key is
 * mirrored back into the field. The real key never lingers in the UI.
 */
export function useApiKeyForm(
  save: (apiKey: string) => Promise<boolean>,
  masked: Ref<string>,
) {
  const draft = ref('');
  const isSaving = ref(false);

  watch(
    masked,
    (maskedKey) => {
      draft.value = maskedKey;
    },
    { immediate: true },
  );

  /** Select the masked text so typing replaces it without a manual clear. */
  function selectAllText(event: FocusEvent) {
    (event.target as HTMLInputElement).select();
  }

  async function submit() {
    const apiKey = draft.value.trim();
    if (isSaving.value) return;
    // No new key entered (empty or the untouched mask) — restore display.
    if (!apiKey || apiKey === masked.value) {
      draft.value = masked.value;
      return;
    }
    isSaving.value = true;
    const saved = await save(apiKey);
    isSaving.value = false;
    // On success the refreshed masked key flows back via the watch;
    // on failure the masked display is restored.
    if (!saved) draft.value = masked.value;
  }

  return { draft, isSaving, selectAllText, submit };
}
