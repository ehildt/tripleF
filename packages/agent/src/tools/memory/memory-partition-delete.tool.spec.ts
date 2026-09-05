import { describe, expect, it, vi } from 'vitest';

import { createMemoryPartitionDeleteTool } from './memory-partition-delete.tool.js';

const scope = {
  memoryPartition: 'christopher',
  sessionId: 'sess-1',
  conversationId: 'conv-1',
};

describe('createMemoryPartitionDeleteTool', () => {
  it('deletes the verbatim record and confirms the removed text', async () => {
    const deleteRecords = vi.fn().mockResolvedValue({
      deleted: 1,
      texts: ['Sams phone number is 555-1234'],
      matched: 1,
    });
    const tool = createMemoryPartitionDeleteTool({ scope, deleteRecords });

    const result = await tool.execute!({ text: 'Sams phone number is 555-1234' }, {} as never);

    expect(deleteRecords).toHaveBeenCalledWith({
      memoryPartition: 'christopher',
      text: 'Sams phone number is 555-1234',
    });
    expect(result).toEqual({
      deleted: 1,
      removed: ['Sams phone number is 555-1234'],
    });
  });

  it('reports a no-match honestly', async () => {
    const deleteRecords = vi.fn().mockResolvedValue({
      deleted: 0,
      texts: [],
      matched: 0,
    });
    const tool = createMemoryPartitionDeleteTool({ scope, deleteRecords });

    const result = await tool.execute!({ text: 'not stored' }, {} as never);

    expect(result).toEqual({
      deleted: 0,
      message:
        'No stored record matches that exact text — use memory-partition-recall to find the verbatim statement first.',
    });
  });

  it('returns an honest error instead of throwing when the delete fails', async () => {
    const deleteRecords = vi.fn().mockRejectedValue(new Error('store down'));
    const tool = createMemoryPartitionDeleteTool({ scope, deleteRecords });

    const result = await tool.execute!({ text: 'Doomed fact' }, {} as never);

    expect(result).toEqual({ deleted: 0, error: 'store down' });
  });
});
