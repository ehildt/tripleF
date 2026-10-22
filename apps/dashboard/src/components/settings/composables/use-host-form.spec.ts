import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

import { useHostForm } from './use-host-form';

describe('useHostForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('mirrors the current host into the draft immediately and on change', async () => {
    const current = ref('https://ollama.local');
    const { draft } = useHostForm(vi.fn(), current);

    expect(draft.value).toBe('https://ollama.local');
    current.value = 'https://ollama-2.local';
    await Promise.resolve();
    expect(draft.value).toBe('https://ollama-2.local');
  });

  it('saves a trimmed, changed host', async () => {
    const current = ref('https://ollama.local');
    const save = vi.fn().mockResolvedValue(undefined);
    const { draft, submit } = useHostForm(save, current);

    draft.value = '  https://remote.local  ';
    await submit();

    expect(save).toHaveBeenCalledWith('https://remote.local');
  });

  it.each([
    ['unchanged value', (draft: string) => draft],
    ['empty input', () => ''],
    ['whitespace only', () => '   '],
  ])(
    'restores the display and skips saving for %s',
    async (_label, mutateDraft) => {
      const current = ref('https://ollama.local');
      const save = vi.fn().mockResolvedValue(undefined);
      const { draft, submit } = useHostForm(save, current);

      draft.value = mutateDraft(draft.value);
      await submit();

      expect(save).not.toHaveBeenCalled();
      expect(draft.value).toBe('https://ollama.local');
    },
  );
});
