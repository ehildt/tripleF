import { describe, expect, it } from 'vitest';

import type { MutedToastMessage } from '../toast-settings.types';
import { removeMutedToastMessage } from './remove-muted-toast-message.helper';

describe('removeMutedToastMessage', () => {
  it('removes every matching entry without mutating the source', () => {
    const messages: MutedToastMessage[] = [
      { key: 'remove', sample: 'First' },
      { key: 'keep', sample: 'Keep' },
      { key: 'remove', sample: 'Duplicate' },
    ];

    const result = removeMutedToastMessage(messages, 'remove');

    expect(result).toEqual([{ key: 'keep', sample: 'Keep' }]);
    expect(messages).toHaveLength(3);
  });

  it('returns a new array even when the key is absent', () => {
    const messages: MutedToastMessage[] = [{ key: 'keep', sample: 'Keep' }];

    const result = removeMutedToastMessage(messages, 'missing');

    expect(result).toEqual(messages);
    expect(result).not.toBe(messages);
  });
});
