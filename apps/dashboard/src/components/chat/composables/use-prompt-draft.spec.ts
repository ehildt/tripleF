import { beforeEach, describe, expect, it } from 'vitest';

import { usePromptDraft } from './use-prompt-draft';

const STORAGE_KEY = 'api-fields';

describe('usePromptDraft', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts empty when nothing is persisted', () => {
    const { promptDraft } = usePromptDraft();

    expect(promptDraft.value).toBe('');
  });

  it('hydrates the draft from the current persisted field', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ promptDraft: 'hello there' }),
    );

    const { promptDraft } = usePromptDraft();

    expect(promptDraft.value).toBe('hello there');
  });

  it('hydrates the draft from the legacy persisted field', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ arguments_: 'legacy draft' }),
    );

    const { promptDraft } = usePromptDraft();

    expect(promptDraft.value).toBe('legacy draft');
  });

  it('falls back to empty when the persisted value is malformed', () => {
    localStorage.setItem(STORAGE_KEY, 'not json');

    const { promptDraft } = usePromptDraft();

    expect(promptDraft.value).toBe('');
  });

  it('persists the draft under the current field and preserves siblings', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ other: 1 }));

    const { promptDraft, persistPromptDraft } = usePromptDraft();
    promptDraft.value = 'typed text';
    persistPromptDraft();

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')).toEqual({
      other: 1,
      promptDraft: 'typed text',
    });
  });

  it('resets the draft and persists the empty value', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ promptDraft: 'to clear' }),
    );

    const { promptDraft, resetPromptDraft } = usePromptDraft();
    resetPromptDraft();

    expect(promptDraft.value).toBe('');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')).toEqual({
      promptDraft: '',
    });
  });
});
