import { describe, expect, it } from 'vitest';

import { buildPendingFilesKey } from './build-pending-files-key.helper';

describe('buildPendingFilesKey', () => {
  it('encodes parent and stable ids as a JSON tuple', () => {
    expect(
      buildPendingFilesKey({
        parentConversationId: 'parent::one',
        conversationId: 'stable/one',
      }),
    ).toBe('["parent::one","stable/one"]');
  });

  it('keeps reversed or delimiter-containing identities distinct', () => {
    const first = buildPendingFilesKey({
      parentConversationId: 'parent',
      conversationId: 'stable|child',
    });
    const second = buildPendingFilesKey({
      parentConversationId: 'parent|stable',
      conversationId: 'child',
    });

    expect(first).not.toBe(second);
  });
});
