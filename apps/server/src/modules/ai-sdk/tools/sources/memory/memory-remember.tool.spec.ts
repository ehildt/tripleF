import { describe, expect, it, vi } from 'vitest';

import { createMemoryRememberTool } from './memory-remember.tool.js';

const scope = {
  memoryPartition: 'christopher',
  sessionId: 'sess-1',
  conversationId: 'conv-1',
};

describe('createMemoryRememberTool', () => {
  it('stores the record with the partition scope and tags', async () => {
    const storeRecord = vi.fn().mockResolvedValue('point-1');
    const tool = createMemoryRememberTool({ scope, storeRecord });

    const result = await tool.execute(
      { text: 'Sams phone number is 555-1234', tags: ['contacts', 'sam'] },
      {} as never,
    );

    expect(storeRecord).toHaveBeenCalledWith({
      memoryPartition: 'christopher',
      sessionId: 'sess-1',
      conversationId: 'conv-1',
      requestId: undefined,
      text: 'Sams phone number is 555-1234',
      tags: ['contacts', 'sam'],
    });
    expect(result).toEqual({ stored: true, id: 'point-1' });
  });

  it('returns an honest error instead of throwing when the store fails', async () => {
    const storeRecord = vi.fn().mockRejectedValue(new Error('embed down'));
    const tool = createMemoryRememberTool({ scope, storeRecord });

    const result = await tool.execute({ text: 'Doomed fact' }, {} as never);

    expect(result).toEqual({ stored: false, error: 'embed down' });
  });
});
