import { describe, expect, it } from 'vitest';

import type { MutedToastMessage } from '../toast-settings.types';
import { appendMutedToastMessage } from './append-muted-toast-message.helper';

describe('appendMutedToastMessage', () => {
  it('appends a new message kind without mutating the existing history', () => {
    const messages: MutedToastMessage[] = [{ key: 'existing', sample: 'Old' }];

    const result = appendMutedToastMessage(messages, 'new', 'New');

    expect(result).toEqual([
      { key: 'existing', sample: 'Old' },
      { key: 'new', sample: 'New' },
    ]);
    expect(result).not.toBe(messages);
    expect(messages).toEqual([{ key: 'existing', sample: 'Old' }]);
  });

  it('returns the original array for a duplicate and preserves its sample', () => {
    const messages: MutedToastMessage[] = [{ key: 'same', sample: 'Original' }];

    const result = appendMutedToastMessage(messages, 'same', 'Replacement');

    expect(result).toBe(messages);
    expect(result[0].sample).toBe('Original');
  });
});
