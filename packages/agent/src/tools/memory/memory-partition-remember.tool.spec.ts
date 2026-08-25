import { describe, expect, it, vi } from 'vitest';

import { createMemoryPartitionRememberTool } from './memory-partition-remember.tool.js';

const scope = {
  memoryPartition: 'christopher',
  sessionId: 'sess-1',
  conversationId: 'conv-1',
};

describe('createMemoryPartitionRememberTool', () => {
  it('stores the record with the partition scope, tags, and category', async () => {
    const storeRecord = vi.fn().mockResolvedValue('point-1');
    const tool = createMemoryPartitionRememberTool({ scope, storeRecord });

    const result = await tool.execute(
      {
        text: 'Sams phone number is 555-1234',
        tags: ['contacts', 'sam'],
        category: 'contacts',
      },
      {} as never,
    );

    expect(storeRecord).toHaveBeenCalledWith({
      memoryPartition: 'christopher',
      sessionId: 'sess-1',
      conversationId: 'conv-1',
      requestId: undefined,
      text: 'Sams phone number is 555-1234',
      tags: ['contacts', 'sam'],
      category: 'contacts',
    });
    expect(result).toEqual({ stored: true, id: 'point-1' });
  });

  it('forwards an absent category as undefined', async () => {
    const storeRecord = vi.fn().mockResolvedValue('point-1');
    const tool = createMemoryPartitionRememberTool({ scope, storeRecord });

    await tool.execute({ text: 'Uncategorized fact', tags: ['misc'] }, {} as never);

    expect(storeRecord).toHaveBeenCalledWith(expect.objectContaining({ category: undefined }));
  });

  it('returns an honest error instead of throwing when the store fails', async () => {
    const storeRecord = vi.fn().mockRejectedValue(new Error('embed down'));
    const tool = createMemoryPartitionRememberTool({ scope, storeRecord });

    const result = await tool.execute({ text: 'Doomed fact' }, {} as never);

    expect(result).toEqual({ stored: false, error: 'embed down' });
  });
});
