import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

import { useApiKeyForm } from './use-api-key-form';

describe('useApiKeyForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('mirrors the masked key into the draft immediately', () => {
    const masked = ref('sk-****abcd');
    const { draft } = useApiKeyForm(vi.fn(), masked);

    expect(draft.value).toBe('sk-****abcd');
  });

  it('selects the whole field text on focus', () => {
    const { selectAllText } = useApiKeyForm(vi.fn(), ref(''));
    const select = vi.fn();
    selectAllText({
      target: { select },
    } as unknown as FocusEvent);

    expect(select).toHaveBeenCalledTimes(1);
  });

  it('restores the masked display when no new key was entered', async () => {
    const masked = ref('sk-****abcd');
    const save = vi.fn().mockResolvedValue(true);
    const { draft, submit } = useApiKeyForm(save, masked);

    draft.value = 'sk-****abcd'; // untouched mask
    await submit();

    expect(save).not.toHaveBeenCalled();
    expect(draft.value).toBe('sk-****abcd');
  });

  it('saves a new trimmed key', async () => {
    const masked = ref('sk-****abcd');
    const save = vi.fn().mockResolvedValue(true);
    const { draft, submit } = useApiKeyForm(save, masked);

    draft.value = '  sk-new-secret  ';
    await submit();

    expect(save).toHaveBeenCalledWith('sk-new-secret');
  });

  it('restores the masked display when the save fails', async () => {
    const masked = ref('sk-****abcd');
    const save = vi.fn().mockResolvedValue(false);
    const { draft, submit } = useApiKeyForm(save, masked);

    draft.value = 'sk-new-secret';
    await submit();

    expect(draft.value).toBe('sk-****abcd');
  });

  it('ignores a second submit while a save is in flight', async () => {
    const masked = ref('sk-****abcd');
    let resolveSave: (saved: boolean) => void = () => {};
    const save = vi.fn(
      () => new Promise<boolean>((resolve) => (resolveSave = resolve)),
    );
    const { draft, isSaving, submit } = useApiKeyForm(save, masked);

    draft.value = 'sk-new-secret';
    const first = submit();
    expect(isSaving.value).toBe(true);
    await submit();

    expect(save).toHaveBeenCalledTimes(1);
    resolveSave(true);
    await first;
    expect(isSaving.value).toBe(false);
  });
});
